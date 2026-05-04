"""Public chat endpoint — no authentication required.

Provides a restricted AI chat for unauthenticated users on the public landing page.
Uses PUBLIC_CHAT_SYSTEM_PROMPT to strictly limit responses to SaleMaster product
consultation only. All sensitive data queries are refused.

Rate limit: 5 requests / minute / IP (in-memory, resets on server restart).
"""

import logging
import time
from collections import defaultdict
from threading import Lock

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.agents.prompts import PUBLIC_CHAT_SYSTEM_PROMPT
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── In-memory rate limiter (5 req / 60 s / IP) ──────────────────────────────

_RATE_LIMIT = 5          # max requests
_RATE_WINDOW = 60        # seconds
_rate_store: dict[str, list[float]] = defaultdict(list)
_rate_lock = Lock()


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For for reverse proxies."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(ip: str) -> None:
    """Raise HTTP 429 if the IP has exceeded the rate limit."""
    now = time.monotonic()
    with _rate_lock:
        timestamps = _rate_store[ip]
        # Keep only timestamps within the current window
        _rate_store[ip] = [t for t in timestamps if now - t < _RATE_WINDOW]
        if len(_rate_store[ip]) >= _RATE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Bạn đã gửi quá {_RATE_LIMIT} tin nhắn trong vòng "
                    f"{_RATE_WINDOW} giây. Vui lòng đợi một chút rồi thử lại."
                ),
            )
        _rate_store[ip].append(now)


# ─── Gemini call (server-side, key not exposed to browser) ───────────────────

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta"
    "/models/gemini-2.0-flash-lite:generateContent"
)
_MAX_OUTPUT_TOKENS = 300
_TEMPERATURE = 0.5


async def _call_openai_fallback(history: list[dict], user_text: str) -> str | None:
    """Try OpenAI gpt-4o-mini as fallback when Gemini is rate-limited."""
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        return None

    messages = [{"role": "system", "content": PUBLIC_CHAT_SYSTEM_PROMPT}]
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("text") or msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_text})

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json={
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "max_tokens": _MAX_OUTPUT_TOKENS,
                    "temperature": _TEMPERATURE,
                },
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
            )
        if response.is_success:
            data = response.json()
            text: str = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return text.strip() or None
    except Exception as exc:
        logger.warning("OpenAI fallback failed: %s", exc)
    return None


async def _call_gemini(history: list[dict], user_text: str) -> str:
    """Call Gemini first; fall back to OpenAI gpt-4o-mini on quota/rate errors."""
    api_key = settings.GEMINI_API_KEY
    gemini_ok = bool(api_key)
    gemini_rate_limited = False

    if gemini_ok:
        contents: list[dict] = []
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("text") or msg.get("content", "")
            if role in ("user", "assistant") and content:
                contents.append({
                    "role": "model" if role == "assistant" else "user",
                    "parts": [{"text": content}],
                })
        contents.append({"role": "user", "parts": [{"text": user_text}]})

        payload = {
            "system_instruction": {"parts": [{"text": PUBLIC_CHAT_SYSTEM_PROMPT}]},
            "contents": contents,
            "generationConfig": {
                "temperature": _TEMPERATURE,
                "maxOutputTokens": _MAX_OUTPUT_TOKENS,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    f"{_GEMINI_URL}?key={api_key}",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

            if response.status_code == 429:
                logger.warning("Gemini quota/rate-limit hit — trying OpenAI fallback")
                gemini_rate_limited = True
            elif response.is_success:
                data = response.json()
                text: str = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
                return text.strip() or "Tôi chưa có câu trả lời cho câu hỏi này."
            else:
                logger.error("Gemini error %s: %s", response.status_code, response.text[:200])
                gemini_rate_limited = True  # treat other errors as fallback-worthy

        except httpx.TimeoutException:
            logger.warning("Gemini timeout — trying OpenAI fallback")
            gemini_rate_limited = True
        except httpx.HTTPError as exc:
            logger.error("Gemini request failed: %s", exc)
            gemini_rate_limited = True

    # ── Fallback to OpenAI ────────────────────────────────────────────────────
    if not gemini_ok or gemini_rate_limited:
        fallback_reply = await _call_openai_fallback(history, user_text)
        if fallback_reply:
            return fallback_reply
        if gemini_rate_limited:
            raise HTTPException(
                status_code=503,
                detail="AI đang quá tải. Vui lòng thử lại sau vài giây.",
            )
        raise HTTPException(
            status_code=503,
            detail="Dịch vụ AI chưa được cấu hình. Vui lòng liên hệ admin.",
        )

    raise HTTPException(
        status_code=503,
        detail="Dịch vụ AI chưa được cấu hình. Vui lòng liên hệ admin.",
    )


# ─── Schemas ─────────────────────────────────────────────────────────────────


class PublicChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    text: str


class PublicChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: list[PublicChatMessage] = Field(default_factory=list, max_length=20)


class PublicChatResponse(BaseModel):
    reply: str


# ─── Endpoint ────────────────────────────────────────────────────────────────


@router.post(
    "/public-chat",
    response_model=PublicChatResponse,
    summary="Public SaleMaster AI chat (no auth required)",
    description=(
        "Endpoint for the unauthenticated landing page chat widget. "
        "Strictly limited to SaleMaster product consultation. "
        "Rate limited to 5 requests per minute per IP."
    ),
    tags=["public"],
)
async def public_chat(request: Request, body: PublicChatRequest) -> PublicChatResponse:
    """Handle a public (unauthenticated) chat message.

    - Enforces per-IP rate limiting (5 req/min).
    - Uses a restricted system prompt — refuses all real data queries.
    - Calls Gemini API server-side (API key never sent to browser).
    """
    client_ip = _get_client_ip(request)
    _check_rate_limit(client_ip)

    history = [{"role": m.role, "text": m.text} for m in body.history]
    reply = await _call_gemini(history, body.message)

    return PublicChatResponse(reply=reply)
