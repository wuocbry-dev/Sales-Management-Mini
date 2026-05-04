"""Read-only analytics tools for the Sales-Management-Mini database."""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from functools import lru_cache
from typing import Any
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import settings

SENSITIVE_COLUMN_MARKERS = (
    "password",
    "password_hash",
    "token",
    "secret",
    "api_key",
    "authorization",
    "credential",
)

BLOCKED_SQL_TOKENS = (
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "truncate",
    "create",
    "replace",
    "grant",
    "revoke",
    "lock",
    "unlock",
    "call",
    "execute",
    "prepare",
    "set",
    "load",
    "outfile",
    "dumpfile",
)


def _json_default(value: Any) -> str | float | int | None:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime | date):
        return value.isoformat()
    return str(value) if value is not None else None


def _to_json(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False, default=_json_default)


def _mask_sensitive(row: dict[str, Any]) -> dict[str, Any]:
    masked: dict[str, Any] = {}
    for key, value in row.items():
        normalized = key.lower()
        if any(marker in normalized for marker in SENSITIVE_COLUMN_MARKERS):
            masked[key] = "***masked***" if value is not None else None
        else:
            masked[key] = value
    return masked


@lru_cache(maxsize=1)
def _engine() -> Engine:
    password = quote_plus(settings.SALES_DB_PASSWORD)
    url = (
        f"mysql+pymysql://{settings.SALES_DB_USER}:{password}"
        f"@{settings.SALES_DB_HOST}:{settings.SALES_DB_PORT}/{settings.SALES_DB_NAME}"
        "?charset=utf8mb4"
    )
    return create_engine(url, pool_pre_ping=True, pool_recycle=1800)


def _run(query: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    if not settings.SALES_DB_ENABLED:
        return [{"error": "Sales database analytics is disabled."}]

    with _engine().connect() as conn:
        result = conn.execute(text(query), params or {})
        return [_mask_sensitive(dict(row._mapping)) for row in result]


def _bounded_limit(limit: int | None, default: int = 10, maximum: int = 50) -> int:
    if limit is None:
        return default
    return max(1, min(int(limit), maximum))


def _validate_readonly_sql(query: str) -> str:
    stripped = query.strip().rstrip(";")
    lowered = " ".join(stripped.lower().split())
    if not lowered:
        raise ValueError("SQL query is empty.")
    if ";" in stripped:
        raise ValueError("Only one SQL statement is allowed.")
    first = lowered.split(" ", 1)[0]
    if first not in {"select", "show", "describe", "desc", "explain"}:
        raise ValueError("Only read-only SELECT/SHOW/DESCRIBE/EXPLAIN queries are allowed.")
    padded = f" {lowered} "
    for token in BLOCKED_SQL_TOKENS:
        if f" {token} " in padded:
            raise ValueError(f"Blocked unsafe SQL token: {token}")
    return stripped


def list_sales_database_tables() -> str:
    """List all tables in the Sales-Management-Mini database with row counts."""
    try:
        table_rows = _run(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY table_name
            """
        )
        tables: list[dict[str, Any]] = []
        for row in table_rows:
            table_name = row.get("table_name") or row.get("TABLE_NAME")
            if not table_name:
                continue
            count = _run(f"SELECT COUNT(*) AS row_count FROM `{table_name}`")[0]["row_count"]
            tables.append({"table_name": table_name, "row_count": count})
        return _to_json({"ok": True, "tables": tables})
    except Exception as exc:
        return _to_json({"ok": False, "error": str(exc)})


def describe_sales_database_table(table_name: str) -> str:
    """Describe one table's columns, types, keys and indexes."""
    safe_name = table_name.strip().replace("`", "")
    try:
        columns = _run(
            """
            SELECT
              column_name,
              data_type,
              column_type,
              is_nullable,
              column_key,
              column_default,
              extra
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = :table_name
            ORDER BY ordinal_position
            """,
            {"table_name": safe_name},
        )
        indexes = _run(
            """
            SELECT index_name, non_unique, seq_in_index, column_name
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = :table_name
            ORDER BY index_name, seq_in_index
            """,
            {"table_name": safe_name},
        )
        return _to_json({"ok": True, "table_name": safe_name, "columns": columns, "indexes": indexes})
    except Exception as exc:
        return _to_json({"ok": False, "error": str(exc)})


def run_sales_readonly_sql(query: str, limit: int | None = 100) -> str:
    """Run a read-only SQL query against the Sales-Management-Mini database."""
    try:
        safe_query = _validate_readonly_sql(query)
        bounded_limit = _bounded_limit(limit, default=100, maximum=500)
        lowered = safe_query.lower()
        if lowered.startswith("select") and " limit " not in f" {lowered} ":
            safe_query = f"{safe_query}\nLIMIT {bounded_limit}"
        rows = _run(safe_query)
        return _to_json({"ok": True, "row_count": len(rows), "rows": rows})
    except Exception as exc:
        return _to_json({"ok": False, "error": str(exc)})


def _date_params(
    start_date: str | None,
    end_date: str | None,
    store_id: int | None = None,
) -> dict[str, Any]:
    return {
        "start_date": start_date,
        "end_date": end_date,
        "store_id": store_id,
    }


def get_sales_database_health() -> str:
    """Check Sales-Management-Mini database connectivity and core table counts."""
    try:
        rows = _run(
            """
            SELECT 'stores' table_name, COUNT(*) row_count FROM stores
            UNION ALL SELECT 'branches', COUNT(*) FROM branches
            UNION ALL SELECT 'warehouses', COUNT(*) FROM warehouses
            UNION ALL SELECT 'products', COUNT(*) FROM products
            UNION ALL SELECT 'product_variants', COUNT(*) FROM product_variants
            UNION ALL SELECT 'inventories', COUNT(*) FROM inventories
            UNION ALL SELECT 'sales_orders', COUNT(*) FROM sales_orders
            UNION ALL SELECT 'sales_order_items', COUNT(*) FROM sales_order_items
            UNION ALL SELECT 'goods_receipts', COUNT(*) FROM goods_receipts
            UNION ALL SELECT 'sales_returns', COUNT(*) FROM sales_returns
            """
        )
        return _to_json({"ok": True, "tables": rows})
    except Exception as exc:
        return _to_json({"ok": False, "error": str(exc)})


def get_sales_overview(
    start_date: str | None = None,
    end_date: str | None = None,
    store_id: int | None = None,
) -> str:
    """Summarize revenue, orders, returns, purchasing, catalog and low-stock status."""
    params = _date_params(start_date, end_date, store_id)
    payload: dict[str, Any] = {"filters": params}

    payload["sales"] = _run(
        """
        SELECT
          COUNT(*) AS completed_orders,
          COALESCE(SUM(total_amount), 0) AS gross_revenue,
          COALESCE(SUM(discount_amount), 0) AS discount_amount,
          COALESCE(SUM(paid_amount), 0) AS paid_amount,
          COALESCE(AVG(total_amount), 0) AS average_order_value,
          MIN(order_date) AS first_order_at,
          MAX(order_date) AS last_order_at
        FROM sales_orders
        WHERE LOWER(status) = 'completed'
          AND (:store_id IS NULL OR store_id = :store_id)
          AND (:start_date IS NULL OR order_date >= :start_date)
          AND (:end_date IS NULL OR order_date < DATE_ADD(:end_date, INTERVAL 1 DAY))
        """,
        params,
    )[0]

    payload["returns"] = _run(
        """
        SELECT
          COUNT(*) AS completed_returns,
          COALESCE(SUM(refund_amount), 0) AS refund_amount
        FROM sales_returns
        WHERE LOWER(status) = 'completed'
          AND (:store_id IS NULL OR store_id = :store_id)
          AND (:start_date IS NULL OR return_date >= :start_date)
          AND (:end_date IS NULL OR return_date < DATE_ADD(:end_date, INTERVAL 1 DAY))
        """,
        params,
    )[0]

    payload["purchasing"] = _run(
        """
        SELECT
          COUNT(*) AS confirmed_receipts,
          COALESCE(SUM(total_amount), 0) AS purchase_amount
        FROM goods_receipts
        WHERE LOWER(status) IN ('completed', 'confirmed')
          AND (:store_id IS NULL OR store_id = :store_id)
          AND (:start_date IS NULL OR receipt_date >= :start_date)
          AND (:end_date IS NULL OR receipt_date < DATE_ADD(:end_date, INTERVAL 1 DAY))
        """,
        params,
    )[0]

    payload["catalog"] = _run(
        """
        SELECT
          COUNT(DISTINCT p.product_id) AS products,
          COUNT(DISTINCT pv.variant_id) AS variants,
          COUNT(DISTINCT i.inventory_id) AS inventory_rows,
          COALESCE(SUM(i.quantity_on_hand), 0) AS quantity_on_hand,
          COALESCE(SUM(i.reserved_qty), 0) AS reserved_qty,
          SUM(CASE WHEN i.quantity_on_hand <= pv.reorder_level THEN 1 ELSE 0 END) AS low_stock_variants
        FROM products p
        LEFT JOIN product_variants pv ON pv.product_id = p.product_id
        LEFT JOIN inventories i ON i.variant_id = pv.variant_id
        WHERE (:store_id IS NULL OR p.store_id = :store_id)
        """,
        {"store_id": store_id},
    )[0]

    return _to_json(payload)


def get_top_selling_products(
    start_date: str | None = None,
    end_date: str | None = None,
    store_id: int | None = None,
    limit: int | None = 10,
) -> str:
    """Return top products by completed sales quantity and revenue."""
    params = _date_params(start_date, end_date, store_id)
    params["limit"] = _bounded_limit(limit)
    rows = _run(
        """
        SELECT
          s.store_name,
          p.product_code,
          p.product_name,
          pv.sku,
          pv.variant_name,
          COALESCE(SUM(soi.quantity), 0) AS quantity_sold,
          COALESCE(SUM(soi.line_total), 0) AS revenue,
          COALESCE(SUM(soi.line_total - (soi.quantity * pv.cost_price)), 0) AS estimated_gross_profit
        FROM sales_order_items soi
        JOIN sales_orders so ON so.order_id = soi.order_id
        JOIN product_variants pv ON pv.variant_id = soi.variant_id
        JOIN products p ON p.product_id = pv.product_id
        JOIN stores s ON s.store_id = so.store_id
        WHERE LOWER(so.status) = 'completed'
          AND (:store_id IS NULL OR so.store_id = :store_id)
          AND (:start_date IS NULL OR so.order_date >= :start_date)
          AND (:end_date IS NULL OR so.order_date < DATE_ADD(:end_date, INTERVAL 1 DAY))
        GROUP BY s.store_name, p.product_code, p.product_name, pv.sku, pv.variant_name
        ORDER BY revenue DESC, quantity_sold DESC
        LIMIT :limit
        """,
        params,
    )
    return _to_json({"filters": params, "rows": rows})


def get_revenue_by_day(
    start_date: str | None = None,
    end_date: str | None = None,
    store_id: int | None = None,
    limit: int | None = 31,
) -> str:
    """Return daily completed-order revenue trend."""
    params = _date_params(start_date, end_date, store_id)
    params["limit"] = _bounded_limit(limit, default=31, maximum=120)
    rows = _run(
        """
        SELECT
          DATE(order_date) AS order_day,
          COUNT(*) AS completed_orders,
          COALESCE(SUM(total_amount), 0) AS revenue,
          COALESCE(SUM(paid_amount), 0) AS paid_amount,
          COALESCE(AVG(total_amount), 0) AS average_order_value
        FROM sales_orders
        WHERE LOWER(status) = 'completed'
          AND (:store_id IS NULL OR store_id = :store_id)
          AND (:start_date IS NULL OR order_date >= :start_date)
          AND (:end_date IS NULL OR order_date < DATE_ADD(:end_date, INTERVAL 1 DAY))
        GROUP BY DATE(order_date)
        ORDER BY order_day DESC
        LIMIT :limit
        """,
        params,
    )
    return _to_json({"filters": params, "rows": rows})


def get_store_performance(
    start_date: str | None = None,
    end_date: str | None = None,
) -> str:
    """Compare stores by completed order revenue, orders and estimated gross profit."""
    params = _date_params(start_date, end_date)
    rows = _run(
        """
        SELECT
          s.store_id,
          s.store_code,
          s.store_name,
          COUNT(DISTINCT so.order_id) AS completed_orders,
          COALESCE(SUM(so.total_amount), 0) AS revenue,
          COALESCE(SUM(so.paid_amount), 0) AS paid_amount,
          COALESCE(SUM(soi.line_total - (soi.quantity * pv.cost_price)), 0) AS estimated_gross_profit
        FROM stores s
        LEFT JOIN sales_orders so ON so.store_id = s.store_id
          AND LOWER(so.status) = 'completed'
          AND (:start_date IS NULL OR so.order_date >= :start_date)
          AND (:end_date IS NULL OR so.order_date < DATE_ADD(:end_date, INTERVAL 1 DAY))
        LEFT JOIN sales_order_items soi ON soi.order_id = so.order_id
        LEFT JOIN product_variants pv ON pv.variant_id = soi.variant_id
        GROUP BY s.store_id, s.store_code, s.store_name
        ORDER BY revenue DESC
        """,
        params,
    )
    return _to_json({"filters": params, "rows": rows})


def get_inventory_alerts(store_id: int | None = None, limit: int | None = 20) -> str:
    """Return variants at or below reorder level, sorted by highest shortage first."""
    params = {"store_id": store_id, "limit": _bounded_limit(limit, default=20)}
    rows = _run(
        """
        SELECT
          s.store_name,
          w.warehouse_name,
          p.product_code,
          p.product_name,
          pv.sku,
          pv.variant_name,
          i.quantity_on_hand,
          i.reserved_qty,
          pv.reorder_level,
          (pv.reorder_level - i.quantity_on_hand) AS shortage_qty
        FROM inventories i
        JOIN warehouses w ON w.warehouse_id = i.warehouse_id
        JOIN stores s ON s.store_id = i.store_id
        JOIN product_variants pv ON pv.variant_id = i.variant_id
        JOIN products p ON p.product_id = pv.product_id
        WHERE (:store_id IS NULL OR i.store_id = :store_id)
          AND i.quantity_on_hand <= pv.reorder_level
        ORDER BY shortage_qty DESC, i.quantity_on_hand ASC
        LIMIT :limit
        """,
        params,
    )
    return _to_json({"filters": params, "rows": rows})


def get_catalog_snapshot(store_id: int | None = None) -> str:
    """Return high-level product, variant, warehouse and inventory snapshot."""
    params = {"store_id": store_id}
    rows = _run(
        """
        SELECT
          s.store_id,
          s.store_code,
          s.store_name,
          COUNT(DISTINCT b.branch_id) AS branches,
          COUNT(DISTINCT w.warehouse_id) AS warehouses,
          COUNT(DISTINCT p.product_id) AS products,
          COUNT(DISTINCT pv.variant_id) AS variants,
          COALESCE(SUM(i.quantity_on_hand), 0) AS quantity_on_hand,
          COALESCE(SUM(i.quantity_on_hand * pv.cost_price), 0) AS inventory_cost_value,
          COALESCE(SUM(i.quantity_on_hand * pv.selling_price), 0) AS inventory_selling_value
        FROM stores s
        LEFT JOIN branches b ON b.store_id = s.store_id
        LEFT JOIN warehouses w ON w.store_id = s.store_id
        LEFT JOIN products p ON p.store_id = s.store_id
        LEFT JOIN product_variants pv ON pv.product_id = p.product_id
        LEFT JOIN inventories i ON i.variant_id = pv.variant_id
        WHERE (:store_id IS NULL OR s.store_id = :store_id)
        GROUP BY s.store_id, s.store_code, s.store_name
        ORDER BY s.store_id
        """,
        params,
    )
    return _to_json({"filters": params, "rows": rows})
