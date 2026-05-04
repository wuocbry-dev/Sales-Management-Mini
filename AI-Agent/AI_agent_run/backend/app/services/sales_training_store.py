"""MySQL-backed training document store for Sales-Management-Mini."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from functools import lru_cache
from typing import Any
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.core.config import settings


def _json_ready(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, datetime | date):
        return value.isoformat()
    return value


@lru_cache(maxsize=1)
def _engine() -> Engine:
    password = quote_plus(settings.SALES_DB_PASSWORD)
    url = (
        f"mysql+pymysql://{settings.SALES_DB_USER}:{password}"
        f"@{settings.SALES_DB_HOST}:{settings.SALES_DB_PORT}/{settings.SALES_DB_NAME}"
        "?charset=utf8mb4"
    )
    return create_engine(url, pool_pre_ping=True, pool_recycle=1800)


def save_training_document_to_sales_db(
    *,
    source_file_id: str | None,
    filename: str,
    mime_type: str,
    size: int,
    storage_path: str,
    file_type: str,
    content: str,
    chunk_count: int,
) -> dict[str, Any]:
    """Persist parsed training content to the Sales MySQL database."""
    if not settings.SALES_DB_ENABLED:
        return {"ok": False, "error": "Sales database is disabled."}

    query = text(
        """
        INSERT INTO ai_training_documents (
          uploaded_by_user_id,
          source_file_id,
          file_name,
          mime_type,
          file_size,
          storage_path,
          file_type,
          parsed_content,
          status,
          chunk_count
        )
        VALUES (
          NULL,
          :source_file_id,
          :file_name,
          :mime_type,
          :file_size,
          :storage_path,
          :file_type,
          :parsed_content,
          'READY',
          :chunk_count
        )
        """
    )
    try:
        with _engine().begin() as conn:
            result = conn.execute(
                query,
                {
                    "source_file_id": source_file_id,
                    "file_name": filename,
                    "mime_type": mime_type,
                    "file_size": size,
                    "storage_path": storage_path,
                    "file_type": file_type,
                    "parsed_content": content,
                    "chunk_count": chunk_count,
                },
            )
            return {"ok": True, "training_document_id": result.lastrowid}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def search_sales_training_documents(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """Search parsed training documents stored in Sales MySQL."""
    if not settings.SALES_DB_ENABLED:
        return []

    terms = [term.strip() for term in query.split() if term.strip()]
    if not terms:
        return []

    where_parts: list[str] = []
    params: dict[str, Any] = {"limit": max(1, min(int(limit), 20))}
    for index, term in enumerate(terms[:6]):
        param = f"q{index}"
        params[param] = f"%{term}%"
        where_parts.append(f"(parsed_content LIKE :{param} OR file_name LIKE :{param})")

    sql = text(
        f"""
        SELECT
          training_document_id,
          source_file_id,
          file_name,
          mime_type,
          file_size,
          file_type,
          parsed_content,
          status,
          chunk_count,
          created_at,
          updated_at
        FROM ai_training_documents
        WHERE status = 'READY'
          AND ({" OR ".join(where_parts)})
        ORDER BY updated_at DESC, created_at DESC
        LIMIT :limit
        """
    )
    try:
        with _engine().connect() as conn:
            result = conn.execute(sql, params)
            return [
                {key: _json_ready(value) for key, value in dict(row._mapping).items()}
                for row in result
            ]
    except Exception:
        return []
