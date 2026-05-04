"""Agent tools module.

This module contains utility functions that can be used as agent tools.
Tools are registered in the agent definition using @agent.tool decorator.
"""

from app.agents.tools.datetime_tool import get_current_datetime
from app.agents.tools.sales_analytics import (
    describe_sales_database_table,
    get_catalog_snapshot,
    get_inventory_alerts,
    get_revenue_by_day,
    get_sales_database_health,
    get_sales_overview,
    get_store_performance,
    get_top_selling_products,
    list_sales_database_tables,
    run_sales_readonly_sql,
)
from app.agents.tools.sales_backend_api import (
    call_sales_backend_api,
    call_sales_backend_get,
    get_store_staff_summary,
    list_sales_backend_api_routes,
    set_store_staff_status_by_username,
)
from app.agents.tools.training_documents import search_training_documents
from app.agents.tools.web_research import fetch_web_page, search_web

__all__ = [
    "call_sales_backend_api",
    "call_sales_backend_get",
    "describe_sales_database_table",
    "fetch_web_page",
    "get_catalog_snapshot",
    "get_current_datetime",
    "get_inventory_alerts",
    "get_revenue_by_day",
    "get_sales_database_health",
    "get_sales_overview",
    "get_store_performance",
    "get_store_staff_summary",
    "get_top_selling_products",
    "list_sales_backend_api_routes",
    "list_sales_database_tables",
    "run_sales_readonly_sql",
    "search_training_documents",
    "search_web",
    "set_store_staff_status_by_username",
]
