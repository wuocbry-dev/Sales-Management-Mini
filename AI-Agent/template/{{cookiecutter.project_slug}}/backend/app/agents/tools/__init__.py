"""Agent tools module.

This module contains utility functions that can be used as agent tools.
Tools are registered in the agent definition using @agent.tool decorator.
"""

from app.agents.tools.datetime_tool import get_current_datetime
{%- if cookiecutter.enable_web_search %}
from app.agents.tools.web_search import web_search, web_search_sync
{%- endif %}

{%- if cookiecutter.enable_rag %}
from app.agents.tools.rag_tool import search_knowledge_base, search_knowledge_base_sync

__all__ = ["get_current_datetime", "search_knowledge_base", "search_knowledge_base_sync"]
{%- else %}
__all__ = ["get_current_datetime"]
{%- endif %}
