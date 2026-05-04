"""Assistant agent with PydanticAI.

The main conversational agent that can be extended with custom tools.
"""

import logging
from dataclasses import dataclass, field
from typing import Any

from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import (
    ModelRequest,
    ModelResponse,
    SystemPromptPart,
    TextPart,
    UserPromptPart,
)
from pydantic_ai.models.gemini import GeminiModel
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.google_gla import GoogleGLAProvider
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings

from app.agents.prompts import DEFAULT_SYSTEM_PROMPT
from app.agents.tools import (
    call_sales_backend_api,
    call_sales_backend_get,
    describe_sales_database_table,
    fetch_web_page,
    get_catalog_snapshot,
    get_current_datetime,
    get_inventory_alerts,
    get_revenue_by_day,
    get_sales_database_health,
    get_sales_overview,
    get_store_performance,
    get_store_staff_summary,
    get_top_selling_products,
    list_sales_backend_api_routes,
    list_sales_database_tables,
    run_sales_readonly_sql,
    search_training_documents,
    search_web,
    set_store_staff_status_by_username,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


def _is_openai_model(model_name: str) -> bool:
    """Infer provider from common OpenAI model name prefixes."""
    return model_name.startswith(("gpt-", "o1", "o3", "o4"))


def _model_has_api_key(model_name: str) -> bool:
    """Return whether the configured environment has a key for this model provider."""
    if _is_openai_model(model_name):
        return bool(settings.OPENAI_API_KEY)
    return bool(settings.GEMINI_API_KEY)


def get_fallback_models(primary_model: str | None = None) -> list[str]:
    """Return configured fallback models with usable API keys, excluding duplicates."""
    primary = primary_model or settings.AI_MODEL
    candidates = [primary, *settings.AI_FALLBACK_MODELS, *settings.AI_AVAILABLE_MODELS]
    seen: set[str] = set()
    result: list[str] = []
    for model_name in candidates:
        if not model_name or model_name in seen:
            continue
        seen.add(model_name)
        if model_name == primary:
            continue
        if not _model_has_api_key(model_name):
            continue
        result.append(model_name)
    return result


@dataclass
class Deps:
    """Dependencies for the assistant agent.

    These are passed to tools via RunContext.
    """

    user_id: str | None = None
    user_name: str | None = None
    access_token: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class AssistantAgent:
    """Assistant agent wrapper for conversational AI.

    Encapsulates agent creation and execution with tool support.
    """

    def __init__(
        self,
        model_name: str | None = None,
        temperature: float | None = None,
        system_prompt: str | None = None,
    ):
        self.model_name = model_name or settings.AI_MODEL
        self.temperature = temperature or settings.AI_TEMPERATURE
        self.system_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
        self._agent: Agent[Deps, str] | None = None

    def _create_agent(self) -> Agent[Deps, str]:
        """Create and configure the PydanticAI agent."""
        use_openai = settings.LLM_PROVIDER == "openai" or _is_openai_model(self.model_name)

        if not use_openai:
            model = GeminiModel(
                self.model_name,
                provider=GoogleGLAProvider(api_key=settings.GEMINI_API_KEY),
            )
            capabilities = []
        else:
            model = OpenAIResponsesModel(
                self.model_name,
                provider=OpenAIProvider(api_key=settings.OPENAI_API_KEY),
            )
            capabilities = []

        agent = Agent[Deps, str](
            model=model,
            model_settings=ModelSettings(temperature=self.temperature),
            system_prompt=self.system_prompt,
            capabilities=capabilities,
        )

        self._register_tools(agent)

        return agent

    def _register_tools(self, agent: Agent[Deps, str]) -> None:
        """Register all tools on the agent."""

        @agent.tool
        async def current_datetime(ctx: RunContext[Deps]) -> str:
            """Get the current date and time.

            Use this tool when you need to know the current date or time.
            """
            return get_current_datetime()

        @agent.tool
        async def sales_database_health(ctx: RunContext[Deps]) -> str:
            """Check Sales-Management-Mini database connectivity and row counts.

            Use this first when the user asks whether the analytics datasource is ready.
            """
            return get_sales_database_health()

        @agent.tool
        async def sales_overview(
            ctx: RunContext[Deps],
            start_date: str | None = None,
            end_date: str | None = None,
            store_id: int | None = None,
        ) -> str:
            """Get Sales-Management-Mini revenue, returns, purchasing and stock overview.

            Dates must use YYYY-MM-DD. Omit dates for all available data.
            """
            return get_sales_overview(start_date=start_date, end_date=end_date, store_id=store_id)

        @agent.tool
        async def top_selling_products(
            ctx: RunContext[Deps],
            start_date: str | None = None,
            end_date: str | None = None,
            store_id: int | None = None,
            limit: int | None = 10,
        ) -> str:
            """Get top-selling products from completed sales orders."""
            return get_top_selling_products(
                start_date=start_date,
                end_date=end_date,
                store_id=store_id,
                limit=limit,
            )

        @agent.tool
        async def revenue_by_day(
            ctx: RunContext[Deps],
            start_date: str | None = None,
            end_date: str | None = None,
            store_id: int | None = None,
            limit: int | None = 31,
        ) -> str:
            """Get daily revenue trend from completed sales orders."""
            return get_revenue_by_day(
                start_date=start_date,
                end_date=end_date,
                store_id=store_id,
                limit=limit,
            )

        @agent.tool
        async def store_performance(
            ctx: RunContext[Deps],
            start_date: str | None = None,
            end_date: str | None = None,
        ) -> str:
            """Compare stores by completed revenue, orders and estimated gross profit."""
            return get_store_performance(start_date=start_date, end_date=end_date)

        @agent.tool
        async def inventory_alerts(
            ctx: RunContext[Deps],
            store_id: int | None = None,
            limit: int | None = 20,
        ) -> str:
            """Find products/variants whose stock is at or below reorder level."""
            return get_inventory_alerts(store_id=store_id, limit=limit)

        @agent.tool
        async def catalog_snapshot(ctx: RunContext[Deps], store_id: int | None = None) -> str:
            """Get store catalog, warehouse, stock quantity and inventory value snapshot."""
            return get_catalog_snapshot(store_id=store_id)

        @agent.tool
        async def sales_database_tables(ctx: RunContext[Deps]) -> str:
            """List all Sales-Management-Mini database tables and row counts."""
            return list_sales_database_tables()

        @agent.tool
        async def sales_backend_api_routes(ctx: RunContext[Deps]) -> str:
            """List all Sales-Management-Mini backend API endpoints and payload hints.

            Use this before calling Sales backend APIs for lookup, CRUD, workflow
            actions, user management, RBAC, orders, inventory, reports and master data.
            """
            return list_sales_backend_api_routes()

        @agent.tool
        async def sales_backend_api_get(
            ctx: RunContext[Deps],
            path: str,
            params: dict[str, Any] | None = None,
            max_chars: int | None = 12000,
        ) -> str:
            """Call any read-only GET endpoint on the Sales-Management-Mini backend.

            The path must start with /api. The request uses the current user's
            access token, so normal backend permissions still apply.
            """
            return call_sales_backend_get(
                path=path,
                params=params,
                access_token=ctx.deps.access_token,
                max_chars=max_chars or 12000,
            )

        @agent.tool
        async def sales_backend_api_call(
            ctx: RunContext[Deps],
            method: str,
            path: str,
            params: dict[str, Any] | None = None,
            json_body: dict[str, Any] | list[Any] | None = None,
            explicit_user_request: bool = False,
            max_chars: int | None = 12000,
        ) -> str:
            """Call any Sales-Management-Mini backend API endpoint.

            Use GET for reading. Use POST/PUT/PATCH/DELETE only when the user
            clearly asked to perform that exact CRUD/workflow action. Ask for
            missing IDs and required body fields before mutating. The request
            uses the current user's access token, so backend permissions still apply.
            """
            return call_sales_backend_api(
                method=method,
                path=path,
                params=params,
                json_body=json_body,
                explicit_user_request=explicit_user_request,
                access_token=ctx.deps.access_token,
                max_chars=max_chars or 12000,
            )

        @agent.tool
        async def store_staff_summary(
            ctx: RunContext[Deps],
            status: str | None = None,
            role_code: str | None = None,
        ) -> str:
            """List stores that have staff and summarize staff by store.

            Use this whenever the user asks which stores have employees,
            staff/cashiers/warehouse staff, or asks to inspect employee
            distribution across stores. This uses the current user's JWT; admin
            users can see all stores if the backend authorizes them.
            """
            return get_store_staff_summary(
                access_token=ctx.deps.access_token,
                status=status,
                role_code=role_code,
            )

        @agent.tool
        async def store_staff_status_by_username(
            ctx: RunContext[Deps],
            username: str,
            action: str,
        ) -> str:
            """Activate or deactivate a store staff account by username.

            Use this when the user asks to ngừng hoạt động/vô hiệu hóa/khóa
            or mở lại/kích hoạt a cashier or warehouse staff account and gives
            a username such as ministopNV1. Set action to deactivate or activate.
            """
            return set_store_staff_status_by_username(
                username=username,
                action=action,
                access_token=ctx.deps.access_token,
            )

        @agent.tool
        async def sales_database_table_schema(ctx: RunContext[Deps], table_name: str) -> str:
            """Describe a Sales-Management-Mini database table."""
            return describe_sales_database_table(table_name)

        @agent.tool
        async def sales_readonly_sql(
            ctx: RunContext[Deps],
            query: str,
            limit: int | None = 100,
        ) -> str:
            """Run read-only SQL against the Sales-Management-Mini database.

            Only SELECT/SHOW/DESCRIBE/EXPLAIN are allowed. Results are limited and sensitive
            columns are masked.
            """
            return run_sales_readonly_sql(query=query, limit=limit)

        @agent.tool
        async def search_training_documents_tool(
            ctx: RunContext[Deps],
            query: str,
            limit: int | None = 5,
        ) -> str:
            """Search the user's uploaded AI training documents.

            Use this when the user asks about policies, notes, procedures, or any
            information that may come from files uploaded to the AI Agent.
            """
            return search_training_documents(
                query=query,
                user_id=ctx.deps.user_id,
                limit=limit or 5,
            )

        @agent.tool
        async def web_search(ctx: RunContext[Deps], query: str, max_results: int = 5) -> str:
            """Search the public web when the user explicitly asks for external research."""
            return search_web(query=query, max_results=max_results)

        @agent.tool
        async def web_fetch(ctx: RunContext[Deps], url: str, max_chars: int = 6000) -> str:
            """Fetch a public web page as readable text for external research."""
            return fetch_web_page(url=url, max_chars=max_chars)

    @property
    def agent(self) -> Agent[Deps, str]:
        """Get or create the agent instance."""
        if self._agent is None:
            self._agent = self._create_agent()
        return self._agent

    async def run(
        self,
        user_input: str,
        history: list[dict[str, str]] | None = None,
        deps: Deps | None = None,
    ) -> tuple[str, list[Any], Deps]:
        """Run agent and return the output along with tool call events.

        Args:
            user_input: User's message.
            history: Conversation history as list of {"role": "...", "content": "..."}.
            deps: Optional dependencies. If not provided, a new Deps will be created.

        Returns:
            Tuple of (output_text, tool_events, deps).
        """
        model_history: list[ModelRequest | ModelResponse] = []

        for msg in history or []:
            if msg["role"] == "user":
                model_history.append(ModelRequest(parts=[UserPromptPart(content=msg["content"])]))
            elif msg["role"] == "assistant":
                model_history.append(ModelResponse(parts=[TextPart(content=msg["content"])]))
            elif msg["role"] == "system":
                model_history.append(ModelRequest(parts=[SystemPromptPart(content=msg["content"])]))

        agent_deps = deps if deps is not None else Deps()

        logger.info(f"Running agent with user input: {user_input[:100]}...")
        result = await self.agent.run(user_input, deps=agent_deps, message_history=model_history)

        tool_events: list[Any] = []
        for message in result.all_messages():
            if hasattr(message, "parts"):
                for part in message.parts:
                    if hasattr(part, "tool_name"):
                        tool_events.append(part)

        logger.info(f"Agent run complete. Output length: {len(result.output)} chars")

        return result.output, tool_events, agent_deps

    async def iter(
        self,
        user_input: str,
        history: list[dict[str, str]] | None = None,
        deps: Deps | None = None,
    ) -> Any:
        """Stream agent execution with full event access.

        Args:
            user_input: User's message.
            history: Conversation history.
            deps: Optional dependencies.

        Yields:
            Agent events for streaming responses.
        """
        model_history: list[ModelRequest | ModelResponse] = []

        for msg in history or []:
            if msg["role"] == "user":
                model_history.append(ModelRequest(parts=[UserPromptPart(content=msg["content"])]))
            elif msg["role"] == "assistant":
                model_history.append(ModelResponse(parts=[TextPart(content=msg["content"])]))
            elif msg["role"] == "system":
                model_history.append(ModelRequest(parts=[SystemPromptPart(content=msg["content"])]))

        agent_deps = deps if deps is not None else Deps()

        async with self.agent.iter(
            user_input,
            deps=agent_deps,
            message_history=model_history,
        ) as run:
            async for event in run:
                yield event


def get_agent(model_name: str | None = None) -> AssistantAgent:
    """Factory function to create an AssistantAgent.

    Args:
        model_name: Override the default AI model.

    Returns:
        Configured AssistantAgent instance.
    """
    return AssistantAgent(model_name=model_name)


async def run_agent(
    user_input: str,
    history: list[dict[str, str]],
    deps: Deps | None = None,
) -> tuple[str, list[Any], Deps]:
    """Run agent and return the output along with tool call events.

    This is a convenience function for backwards compatibility.

    Args:
        user_input: User's message.
        history: Conversation history.
        deps: Optional dependencies.

    Returns:
        Tuple of (output_text, tool_events, deps).
    """
    agent = get_agent()
    return await agent.run(user_input, history, deps)
