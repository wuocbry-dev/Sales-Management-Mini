"""AI Agent WebSocket routes with streaming support (PydanticAI)."""

import json
import logging
import re
from contextlib import contextmanager
from typing import Any

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic_ai import (
    Agent,
    FinalResultEvent,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    PartDeltaEvent,
    PartStartEvent,
    TextPartDelta,
    ToolCallPartDelta,
)
from pydantic_ai.messages import (
    ModelRequest,
    ModelResponse,
    SystemPromptPart,
    TextPart,
    UserPromptPart,
)
from sqlalchemy import select

from app.agents.assistant import Deps, get_agent, get_fallback_models
from app.agents.tools import get_store_staff_summary, set_store_staff_status_by_username
from app.api.deps import get_conversation_service, get_current_user_ws
from app.db.models.user import User
from app.db.session import get_db_session
from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    MessageCreate,
    ToolCallComplete,
    ToolCallCreate,
)

logger = logging.getLogger(__name__)

router = APIRouter()

USERNAME_PATTERN = re.compile(r"\b[A-Za-z][A-Za-z0-9_.-]{2,49}\b")
USERNAME_STOP_WORDS = {
    "active",
    "admin",
    "cashier",
    "inactive",
    "locked",
    "sale",
    "staff",
    "store",
    "username",
    "warehouse",
}


def _detect_store_staff_status_action(
    user_message: str,
    conversation_history: list[dict[str, str]],
) -> tuple[str, str] | None:
    """Detect direct staff activate/deactivate commands before invoking the LLM."""
    current_text = user_message.strip()
    history_tail = " ".join(msg["content"] for msg in conversation_history[-4:])
    combined = f"{history_tail} {current_text}".lower()

    deactivate_markers = (
        "ngừng hoạt động",
        "ngung hoat dong",
        "vô hiệu",
        "vo hieu",
        "khóa",
        "khoa",
        "inactive",
        "deactivate",
    )
    activate_markers = (
        "kích hoạt",
        "kich hoat",
        "mở lại",
        "mo lai",
        "active lại",
        "activate",
    )

    action: str | None = None
    if any(marker in combined for marker in deactivate_markers):
        action = "deactivate"
    elif any(marker in combined for marker in activate_markers):
        action = "activate"
    if not action:
        return None

    candidates = [
        token
        for token in USERNAME_PATTERN.findall(current_text)
        if token.lower() not in USERNAME_STOP_WORDS
    ]
    if not candidates:
        return None

    has_username_hint = any(
        marker in current_text.lower()
        for marker in ("username", "tên đăng nhập", "ten dang nhap")
    )
    previous_asked_username = any(
        marker in history_tail.lower()
        for marker in ("username", "tên đăng nhập", "ten dang nhap")
    )
    looks_like_account = any(any(ch.isdigit() for ch in token) for token in candidates)
    if not (has_username_hint or previous_asked_username or looks_like_account):
        return None

    return candidates[0], action


def _detect_store_staff_summary_request(user_message: str) -> bool:
    """Detect questions asking which stores have staff."""
    text = user_message.strip().lower()
    staff_markers = (
        "nhân viên",
        "nhan vien",
        "staff",
        "cashier",
        "thu ngân",
        "thu ngan",
        "warehouse staff",
        "nhân sự",
        "nhan su",
    )
    store_markers = ("cửa hàng", "cua hang", "store")
    intent_markers = ("nào", "nao", "có", "co", "danh sách", "danh sach", "liệt kê", "liet ke")
    return (
        any(marker in text for marker in staff_markers)
        and any(marker in text for marker in store_markers)
        and any(marker in text for marker in intent_markers)
    )


def _format_store_staff_summary(tool_result: str) -> str:
    """Format store staff summary JSON into a concise Vietnamese response."""
    payload = json.loads(tool_result)
    if not payload.get("ok"):
        backend_response = payload.get("backend_response", {})
        status_code = backend_response.get("status_code")
        if status_code in {401, 403}:
            return (
                "Backend từ chối truy vấn nhân viên vì token hiện tại không đủ quyền. "
                "Bạn hãy đăng xuất rồi đăng nhập lại tài khoản admin để token có role mới nhất."
            )
        return f"Chưa truy vấn được nhân viên cửa hàng: {payload.get('error') or backend_response}"

    stores = payload.get("storesWithStaff") or []
    current_user = payload.get("current_user") or {}
    roles = current_user.get("roles") if isinstance(current_user, dict) else None
    total_staff = payload.get("totalStaff", 0)

    if not stores:
        return (
            "Mình đã kiểm tra bằng API nhân viên cửa hàng. Hiện chưa có cửa hàng nào có nhân viên "
            f"theo phạm vi quyền của tài khoản hiện tại. Roles hiện tại: {roles or 'không rõ'}."
        )

    lines = [
        "### Cửa hàng có nhân viên",
        "",
        f"Tổng cộng: **{len(stores)} cửa hàng**, **{total_staff} nhân viên**.",
        "",
        "| Cửa hàng | ID | Số nhân viên | Phân bổ vai trò |",
        "|---|---:|---:|---|",
    ]
    for store in stores:
        role_parts = [
            f"{role}: {count}" for role, count in (store.get("byRole") or {}).items()
        ]
        role_text = ", ".join(role_parts) if role_parts else "chưa rõ role"
        lines.append(
            f"| {store.get('storeName')} | {store.get('storeId')} | "
            f"{store.get('staffCount')} | {role_text} |"
        )
    return "\n".join(lines)


@router.get("/agent/models")
async def list_models() -> dict[str, Any]:
    """Return available LLM models and the current default."""
    from app.core.config import settings

    def is_openai_model(model_name: str) -> bool:
        return model_name.startswith(("gpt-", "o1", "o3", "o4"))

    def has_key(model_name: str) -> bool:
        if is_openai_model(model_name):
            return bool(settings.OPENAI_API_KEY)
        return bool(settings.GEMINI_API_KEY)

    fallback_models = [name for name in settings.AI_FALLBACK_MODELS if name in settings.AI_AVAILABLE_MODELS]
    all_models = [settings.AI_MODEL, *fallback_models, *settings.AI_AVAILABLE_MODELS]

    seen: set[str] = set()
    recommended: list[str] = []
    configured: list[str] = []
    unavailable: list[str] = []
    for model_name in all_models:
        if not model_name or model_name in seen:
            continue
        seen.add(model_name)
        if model_name in fallback_models and has_key(model_name):
            recommended.append(model_name)
        elif has_key(model_name):
            configured.append(model_name)
        else:
            unavailable.append(model_name)

    ordered_models = [*recommended, *configured, *unavailable]
    default_model = recommended[0] if recommended else configured[0] if configured else settings.AI_MODEL

    return {
        "default": default_model,
        "models": ordered_models,
        "recommended_models": recommended,
        "configured_models": configured,
        "unavailable_models": unavailable,
    }


class AgentConnectionManager:
    """WebSocket connection manager for AI agent."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and store a new WebSocket connection."""
        # Echo back the application subprotocol chosen during auth (if any)
        subprotocol = getattr(websocket.state, "accept_subprotocol", None)
        await websocket.accept(subprotocol=subprotocol)
        self.active_connections.append(websocket)
        logger.info(f"Agent WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(
            f"Agent WebSocket disconnected. Total connections: {len(self.active_connections)}"
        )

    async def send_event(self, websocket: WebSocket, event_type: str, data: Any) -> bool:
        """Send a JSON event to a specific WebSocket client.

        Returns True if sent successfully, False if connection is closed.
        """
        try:
            await websocket.send_json({"type": event_type, "data": data})
            return True
        except (WebSocketDisconnect, RuntimeError):
            # Connection already closed
            return False


manager = AgentConnectionManager()


def format_agent_error(exc: Exception) -> str:
    """Return a user-friendly message for common LLM provider failures."""
    raw_message = str(exc)
    lowered = raw_message.lower()

    if (
        "429" in raw_message
        or "resource_exhausted" in lowered
        or "quota exceeded" in lowered
        or "insufficient_quota" in lowered
    ):
        return (
            "Model/API key dang het quota hoac chua co billing kha dung. "
            "He thong da thu fallback neu duoc cau hinh; neu van loi, hay doi key khac, "
            "bat billing/nang cap quota, hoac doi sang model con quota."
        )

    if "api key" in lowered or "authentication" in lowered or "unauthorized" in lowered:
        return (
            "AI provider dang tu choi xac thuc. Hay kiem tra GEMINI_API_KEY/OPENAI_API_KEY "
            "trong file .env cua AI-Agent."
        )

    if "model" in lowered and ("not found" in lowered or "unsupported" in lowered):
        return (
            "Model AI dang chon khong hop le voi provider hien tai. "
            "Hay chon model Gemini khi dung GEMINI_API_KEY, hoac model GPT khi dung OPENAI_API_KEY."
        )

    return "AI Agent dang gap loi khi goi LLM. Hay xem terminal AI-Agent de biet chi tiet."


def is_fallback_candidate_error(exc: Exception) -> bool:
    """Return True when another provider/model may recover from this error."""
    raw_message = str(exc)
    lowered = raw_message.lower()
    return any(
        marker in lowered or marker in raw_message
        for marker in (
            "429",
            "resource_exhausted",
            "quota exceeded",
            "rate limit",
            "rate_limit",
            "insufficient_quota",
            "overloaded",
            "temporarily unavailable",
            "503",
        )
    )


def build_message_history(history: list[dict[str, str]]) -> list[ModelRequest | ModelResponse]:
    """Convert conversation history to PydanticAI message format."""
    model_history: list[ModelRequest | ModelResponse] = []

    for msg in history:
        if msg["role"] == "user":
            model_history.append(ModelRequest(parts=[UserPromptPart(content=msg["content"])]))
        elif msg["role"] == "assistant":
            model_history.append(ModelResponse(parts=[TextPart(content=msg["content"])]))
        elif msg["role"] == "system":
            model_history.append(ModelRequest(parts=[SystemPromptPart(content=msg["content"])]))

    return model_history


@router.websocket("/ws/agent")
async def agent_websocket(
    websocket: WebSocket,
    user: User = Depends(get_current_user_ws),
) -> None:
    """WebSocket endpoint for AI agent with full event streaming.

    Uses PydanticAI iter() to stream all agent events including:
    - user_prompt: When user input is received
    - model_request_start: When model request begins
    - text_delta: Streaming text from the model
    - tool_call_delta: Streaming tool call arguments
    - tool_call: When a tool is called (with full args)
    - tool_result: When a tool returns a result
    - final_result: When the final result is ready
    - complete: When processing is complete
    - error: When an error occurs

    Expected input message format:
    {
        "message": "user message here",
        "history": [{"role": "user|assistant|system", "content": "..."}],
        "conversation_id": "optional-uuid-to-continue-existing-conversation"
    }

    Authentication: Requires a valid JWT token passed as a query parameter or header.

    Persistence: Set 'conversation_id' to continue an existing conversation.
    If not provided, a new conversation is created. The conversation_id is
    returned in the 'conversation_created' event.
    """
    # JWT auth is handled by get_current_user_ws dependency
    # If auth failed, WebSocket was already closed and user is None
    if user is None:
        return

    await manager.connect(websocket)

    # Conversation state per connection
    conversation_history: list[dict[str, str]] = []
    deps = Deps(
        user_id=str(user.id),
        user_name=user.email,
        access_token=getattr(websocket.state, "auth_token", None),
    )
    current_conversation_id: str | None = None

    async def run_fallback_once(
        *,
        failed_model: str | None,
        user_input: str | list[Any],
        model_history: list[ModelRequest | ModelResponse],
        deps: Deps,
    ) -> tuple[str, str, list[Any]] | None:
        """Try configured fallback models and return output/model/tool events."""
        from app.core.config import settings

        if not settings.AI_AUTO_FALLBACK:
            return None

        for fallback_model in get_fallback_models(failed_model):
            await manager.send_event(
                websocket,
                "tool_call",
                {
                    "tool_name": "model_fallback",
                    "args": {
                        "from": failed_model or settings.AI_MODEL,
                        "to": fallback_model,
                    },
                    "tool_call_id": f"fallback-{fallback_model}",
                },
            )
            try:
                fallback_agent = get_agent(model_name=fallback_model)
                result = await fallback_agent.agent.run(
                    user_input,
                    deps=deps,
                    message_history=model_history,
                )
                tool_events: list[Any] = []
                for message in result.all_messages():
                    if hasattr(message, "parts"):
                        for part in message.parts:
                            if hasattr(part, "tool_name"):
                                tool_events.append(part)
                return result.output, fallback_model, tool_events
            except Exception as fallback_exc:
                logger.warning("Fallback model %s failed: %s", fallback_model, fallback_exc)
                if not is_fallback_candidate_error(fallback_exc):
                    continue
        return None

    try:
        while True:
            # Receive user message
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            file_ids = data.get("file_ids", [])

            if not user_message and not file_ids:
                await manager.send_event(websocket, "error", {"message": "Empty message"})
                continue

            # Handle conversation persistence
            try:
                with contextmanager(get_db_session)() as db:
                    conv_service = get_conversation_service(db)

                    # Get or create conversation
                    requested_conv_id = data.get("conversation_id")
                    if requested_conv_id:
                        current_conversation_id = requested_conv_id
                        conv = conv_service.get_conversation(
                            requested_conv_id, user_id=str(user.id)
                        )
                        if not conversation_history:
                            stored_messages, _ = conv_service.list_messages(
                                requested_conv_id,
                                skip=0,
                                limit=100,
                                include_tool_calls=False,
                                user_id=str(user.id),
                            )
                            conversation_history = [
                                {"role": msg.role, "content": msg.content}
                                for msg in stored_messages
                                if msg.role in {"user", "assistant", "system"}
                            ]
                        if not conv.title and user_message:
                            title = user_message[:50] if len(user_message) > 50 else user_message
                            conv_service.update_conversation(
                                requested_conv_id,
                                ConversationUpdate(title=title),
                                user_id=str(user.id),
                            )
                    elif not current_conversation_id:
                        # Create new conversation
                        conv_data = ConversationCreate(
                            user_id=str(user.id),
                            title=user_message[:50] if len(user_message) > 50 else user_message,
                        )
                        conversation = conv_service.create_conversation(conv_data)
                        current_conversation_id = str(conversation.id)
                        await manager.send_event(
                            websocket,
                            "conversation_created",
                            {"conversation_id": current_conversation_id},
                        )

                    # Save user message
                    user_msg = conv_service.add_message(
                        current_conversation_id,
                        MessageCreate(role="user", content=user_message),
                    )
                    # Link uploaded files to this message
                    if file_ids:
                        try:
                            conv_service.link_files_to_message(user_msg.id, file_ids)
                        except Exception as e:
                            logger.warning(f"Failed to link files: {e}")
            except Exception as e:
                logger.warning(f"Failed to persist conversation: {e}")
                # Continue without persistence

            await manager.send_event(websocket, "user_prompt", {"content": user_message})

            direct_staff_action = _detect_store_staff_status_action(
                user_message=user_message,
                conversation_history=conversation_history,
            )
            if direct_staff_action:
                staff_username, staff_action = direct_staff_action
                tool_call_id = f"direct-store-staff-{staff_action}-{staff_username}"
                await manager.send_event(
                    websocket,
                    "tool_call",
                    {
                        "tool_name": "store_staff_status_by_username",
                        "args": {"username": staff_username, "action": staff_action},
                        "tool_call_id": tool_call_id,
                    },
                )
                tool_result = set_store_staff_status_by_username(
                    username=staff_username,
                    action=staff_action,
                    access_token=deps.access_token,
                )
                await manager.send_event(
                    websocket,
                    "tool_result",
                    {"tool_call_id": tool_call_id, "content": tool_result},
                )

                result_payload = json.loads(tool_result)
                if result_payload.get("ok"):
                    body = result_payload.get("backend_response", {}).get("body", {})
                    status = body.get("status") if isinstance(body, dict) else None
                    action_text = (
                        "ngừng hoạt động"
                        if staff_action == "deactivate"
                        else "kích hoạt lại"
                    )
                    assistant_output = (
                        f"Đã {action_text} nhân viên `{staff_username}` thành công."
                        + (f" Trạng thái hiện tại: `{status}`." if status else "")
                    )
                else:
                    backend_response = result_payload.get("backend_response", {})
                    status_code = backend_response.get("status_code")
                    body = backend_response.get("body")
                    if status_code in {401, 403}:
                        assistant_output = (
                            "Backend đã từ chối thao tác này vì tài khoản hiện tại không đủ quyền."
                        )
                    elif result_payload.get("error") == "Store staff username not found.":
                        assistant_output = (
                            f"Không tìm thấy nhân viên cửa hàng có username `{staff_username}`."
                        )
                    else:
                        assistant_output = (
                            "Chưa thực hiện được thao tác nhân viên. "
                            f"Phản hồi backend: {body or result_payload.get('error')}"
                        )

                await manager.send_event(websocket, "final_result", {"output": assistant_output})

                conversation_history.append({"role": "user", "content": user_message})
                conversation_history.append({"role": "assistant", "content": assistant_output})

                assistant_msg_id = None
                if current_conversation_id:
                    try:
                        with contextmanager(get_db_session)() as db:
                            conv_service = get_conversation_service(db)
                            assistant_msg = conv_service.add_message(
                                current_conversation_id,
                                MessageCreate(
                                    role="assistant",
                                    content=assistant_output,
                                    model_name="direct-store-staff-action",
                                ),
                            )
                            assistant_msg_id = str(assistant_msg.id)

                            from datetime import UTC, datetime

                            tc_obj = conv_service.start_tool_call(
                                assistant_msg.id,
                                ToolCallCreate(
                                    tool_call_id=tool_call_id,
                                    tool_name="store_staff_status_by_username",
                                    args={"username": staff_username, "action": staff_action},
                                    started_at=datetime.now(UTC),
                                ),
                            )
                            conv_service.complete_tool_call(
                                tc_obj.id,
                                ToolCallComplete(
                                    result=tool_result,
                                    completed_at=datetime.now(UTC),
                                    success=bool(result_payload.get("ok")),
                                ),
                            )
                    except Exception as e:
                        logger.warning("Failed to persist direct staff action response: %s", e)

                if assistant_msg_id:
                    await manager.send_event(
                        websocket,
                        "message_saved",
                        {
                            "message_id": assistant_msg_id,
                            "conversation_id": current_conversation_id,
                        },
                    )

                await manager.send_event(
                    websocket,
                    "complete",
                    {
                        "conversation_id": current_conversation_id,
                    },
                )
                continue

            if _detect_store_staff_summary_request(user_message):
                tool_call_id = "direct-store-staff-summary"
                await manager.send_event(
                    websocket,
                    "tool_call",
                    {
                        "tool_name": "store_staff_summary",
                        "args": {},
                        "tool_call_id": tool_call_id,
                    },
                )
                tool_result = get_store_staff_summary(access_token=deps.access_token)
                await manager.send_event(
                    websocket,
                    "tool_result",
                    {"tool_call_id": tool_call_id, "content": tool_result},
                )
                assistant_output = _format_store_staff_summary(tool_result)
                await manager.send_event(websocket, "final_result", {"output": assistant_output})

                conversation_history.append({"role": "user", "content": user_message})
                conversation_history.append({"role": "assistant", "content": assistant_output})

                assistant_msg_id = None
                if current_conversation_id:
                    try:
                        with contextmanager(get_db_session)() as db:
                            conv_service = get_conversation_service(db)
                            assistant_msg = conv_service.add_message(
                                current_conversation_id,
                                MessageCreate(
                                    role="assistant",
                                    content=assistant_output,
                                    model_name="direct-store-staff-summary",
                                ),
                            )
                            assistant_msg_id = str(assistant_msg.id)

                            from datetime import UTC, datetime

                            tc_obj = conv_service.start_tool_call(
                                assistant_msg.id,
                                ToolCallCreate(
                                    tool_call_id=tool_call_id,
                                    tool_name="store_staff_summary",
                                    args={},
                                    started_at=datetime.now(UTC),
                                ),
                            )
                            conv_service.complete_tool_call(
                                tc_obj.id,
                                ToolCallComplete(
                                    result=tool_result,
                                    completed_at=datetime.now(UTC),
                                    success=bool(json.loads(tool_result).get("ok")),
                                ),
                            )
                    except Exception as e:
                        logger.warning("Failed to persist direct staff summary response: %s", e)

                if assistant_msg_id:
                    await manager.send_event(
                        websocket,
                        "message_saved",
                        {
                            "message_id": assistant_msg_id,
                            "conversation_id": current_conversation_id,
                        },
                    )

                await manager.send_event(
                    websocket,
                    "complete",
                    {
                        "conversation_id": current_conversation_id,
                    },
                )
                continue

            selected_model = data.get("model")
            model_history = build_message_history(conversation_history)
            user_input: str | list[Any] = user_message

            try:
                assistant = get_agent(model_name=selected_model)

                # Collect tool calls during streaming for persistence
                collected_tool_calls: list[dict[str, Any]] = []
                # Load attached files and build multimodal input
                from pydantic_ai.messages import BinaryContent

                from app.db.models.chat_file import ChatFile as ChatFileModel
                from app.services.file_storage import get_file_storage

                file_context_parts: list[str] = []

                if file_ids:
                    storage = get_file_storage()
                    image_parts = []
                    with contextmanager(get_db_session)() as file_db:
                        for fid in file_ids:
                            try:
                                result = file_db.execute(
                                    select(ChatFileModel).where(ChatFileModel.id == fid)
                                )
                                chat_file = result.scalar_one_or_none()
                                if not chat_file:
                                    continue
                                if chat_file.file_type == "image":
                                    file_data = await storage.load(chat_file.storage_path)
                                    image_parts.append(
                                        BinaryContent(
                                            data=file_data, media_type=chat_file.mime_type
                                        )
                                    )
                                elif chat_file.parsed_content:
                                    file_context_parts.append(
                                        f"\n---\nAttached file: {chat_file.filename}\n```\n{chat_file.parsed_content}\n```"
                                    )
                            except Exception as e:
                                logger.warning(f"Failed to load file {fid}: {e}")

                    if image_parts:
                        full_text = user_message + "".join(file_context_parts)
                        user_input = [full_text, *image_parts]
                    elif file_context_parts:
                        user_input = user_message + "".join(file_context_parts)

                # Use iter() on the underlying PydanticAI agent to stream all events
                async with assistant.agent.iter(
                    user_input,
                    deps=deps,
                    message_history=model_history,
                ) as agent_run:
                    async for node in agent_run:
                        if Agent.is_user_prompt_node(node):
                            prompt_text = (
                                node.user_prompt
                                if isinstance(node.user_prompt, str)
                                else user_message
                            )
                            await manager.send_event(
                                websocket,
                                "user_prompt_processed",
                                {"prompt": prompt_text},
                            )

                        elif Agent.is_model_request_node(node):
                            await manager.send_event(websocket, "model_request_start", {})

                            async with node.stream(agent_run.ctx) as request_stream:
                                async for event in request_stream:
                                    if isinstance(event, PartStartEvent):
                                        await manager.send_event(
                                            websocket,
                                            "part_start",
                                            {
                                                "index": event.index,
                                                "part_type": type(event.part).__name__,
                                            },
                                        )
                                        # Send initial content from TextPart if present
                                        if isinstance(event.part, TextPart) and event.part.content:
                                            await manager.send_event(
                                                websocket,
                                                "text_delta",
                                                {
                                                    "index": event.index,
                                                    "content": event.part.content,
                                                },
                                            )

                                    elif isinstance(event, PartDeltaEvent):
                                        if isinstance(event.delta, TextPartDelta):
                                            await manager.send_event(
                                                websocket,
                                                "text_delta",
                                                {
                                                    "index": event.index,
                                                    "content": event.delta.content_delta,
                                                },
                                            )
                                        elif isinstance(event.delta, ToolCallPartDelta):
                                            await manager.send_event(
                                                websocket,
                                                "tool_call_delta",
                                                {
                                                    "index": event.index,
                                                    "args_delta": event.delta.args_delta,
                                                },
                                            )

                                    elif isinstance(event, FinalResultEvent):
                                        await manager.send_event(
                                            websocket,
                                            "final_result_start",
                                            {"tool_name": event.tool_name},
                                        )

                        elif Agent.is_call_tools_node(node):
                            await manager.send_event(websocket, "call_tools_start", {})

                            async with node.stream(agent_run.ctx) as handle_stream:
                                async for tool_event in handle_stream:
                                    if isinstance(tool_event, FunctionToolCallEvent):
                                        collected_tool_calls.append(
                                            {
                                                "tool_call_id": tool_event.part.tool_call_id,
                                                "tool_name": tool_event.part.tool_name,
                                                "args": tool_event.part.args,
                                            }
                                        )
                                        await manager.send_event(
                                            websocket,
                                            "tool_call",
                                            {
                                                "tool_name": tool_event.part.tool_name,
                                                "args": tool_event.part.args,
                                                "tool_call_id": tool_event.part.tool_call_id,
                                            },
                                        )

                                    elif isinstance(tool_event, FunctionToolResultEvent):
                                        for tc in collected_tool_calls:
                                            if tc["tool_call_id"] == tool_event.tool_call_id:
                                                tc["result"] = str(tool_event.result.content)
                                                break
                                        await manager.send_event(
                                            websocket,
                                            "tool_result",
                                            {
                                                "tool_call_id": tool_event.tool_call_id,
                                                "content": str(tool_event.result.content),
                                            },
                                        )

                        elif Agent.is_end_node(node) and agent_run.result is not None:
                            await manager.send_event(
                                websocket,
                                "final_result",
                                {"output": agent_run.result.output},
                            )

                # Update conversation history
                conversation_history.append({"role": "user", "content": user_message})
                if agent_run.result:
                    conversation_history.append(
                        {"role": "assistant", "content": agent_run.result.output}
                    )

                # Save assistant response to database
                assistant_msg_id = None
                if current_conversation_id and agent_run.result:
                    try:
                        with contextmanager(get_db_session)() as db:
                            conv_service = get_conversation_service(db)
                            assistant_msg = conv_service.add_message(
                                current_conversation_id,
                                MessageCreate(
                                    role="assistant",
                                    content=agent_run.result.output,
                                    model_name=assistant.model_name
                                    if hasattr(assistant, "model_name")
                                    else None,
                                ),
                            )
                            assistant_msg_id = str(assistant_msg.id)
                            # Save tool calls
                            from datetime import UTC, datetime

                            for tc in collected_tool_calls:
                                try:
                                    args_dict = tc.get("args", {})
                                    if isinstance(args_dict, str):
                                        args_dict = (
                                            json.loads(args_dict) if args_dict.strip() else {}
                                        )
                                    if args_dict is None:
                                        args_dict = {}
                                    tc_obj = conv_service.start_tool_call(
                                        assistant_msg.id,
                                        ToolCallCreate(
                                            tool_call_id=tc["tool_call_id"],
                                            tool_name=tc["tool_name"],
                                            args=args_dict,
                                            started_at=datetime.now(UTC),
                                        ),
                                    )
                                    if tc.get("result"):
                                        conv_service.complete_tool_call(
                                            tc_obj.id,
                                            ToolCallComplete(
                                                result=tc["result"],
                                                completed_at=datetime.now(UTC),
                                                success=True,
                                            ),
                                        )
                                except Exception as e:
                                    logger.warning(f"Failed to persist tool call: {e}")
                    except Exception as e:
                        logger.warning(f"Failed to persist assistant response: {e}")

                # Notify frontend that assistant message was saved with real database ID
                if assistant_msg_id:
                    await manager.send_event(
                        websocket,
                        "message_saved",
                        {
                            "message_id": assistant_msg_id,
                            "conversation_id": current_conversation_id,
                        },
                    )

                await manager.send_event(
                    websocket,
                    "complete",
                    {
                        "conversation_id": current_conversation_id,
                    },
                )

            except WebSocketDisconnect:
                # Client disconnected during processing - this is normal
                logger.info("Client disconnected during agent processing")
                break
            except Exception as e:
                logger.exception(f"Error processing agent request: {e}")
                if is_fallback_candidate_error(e):
                    fallback_result = await run_fallback_once(
                        failed_model=selected_model,
                        user_input=user_input,
                        model_history=model_history,
                        deps=deps,
                    )
                    if fallback_result is not None:
                        fallback_output, fallback_model, _fallback_tool_events = fallback_result
                        await manager.send_event(
                            websocket,
                            "final_result",
                            {"output": fallback_output},
                        )

                        conversation_history.append({"role": "user", "content": user_message})
                        conversation_history.append(
                            {"role": "assistant", "content": fallback_output}
                        )

                        assistant_msg_id = None
                        if current_conversation_id:
                            try:
                                with contextmanager(get_db_session)() as db:
                                    conv_service = get_conversation_service(db)
                                    assistant_msg = conv_service.add_message(
                                        current_conversation_id,
                                        MessageCreate(
                                            role="assistant",
                                            content=fallback_output,
                                            model_name=fallback_model,
                                        ),
                                    )
                                    assistant_msg_id = str(assistant_msg.id)
                            except Exception as persist_exc:
                                logger.warning(
                                    "Failed to persist fallback assistant response: %s",
                                    persist_exc,
                                )

                        if assistant_msg_id:
                            await manager.send_event(
                                websocket,
                                "message_saved",
                                {
                                    "message_id": assistant_msg_id,
                                    "conversation_id": current_conversation_id,
                                },
                            )

                        await manager.send_event(
                            websocket,
                            "complete",
                            {
                                "conversation_id": current_conversation_id,
                                "model": fallback_model,
                            },
                        )
                        continue
                # Try to send error, but don't fail if connection is closed
                await manager.send_event(websocket, "error", {"message": format_agent_error(e)})

    except WebSocketDisconnect:
        pass  # Normal disconnect
    finally:
        manager.disconnect(websocket)
