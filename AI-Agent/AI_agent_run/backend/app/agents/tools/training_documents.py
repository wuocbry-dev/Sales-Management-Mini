"""Tools for searching uploaded AI training documents."""

from contextlib import contextmanager

from app.db.session import get_db_session
from app.repositories import rag_document_repo
from app.services.sales_training_store import search_sales_training_documents


def _snippet(content: str, query: str, max_chars: int = 900) -> str:
    """Return a compact snippet near the first matched query term."""
    lower_content = content.lower()
    terms = [term.lower() for term in query.split() if term.strip()]
    first_match = min(
        (idx for term in terms if (idx := lower_content.find(term)) >= 0),
        default=0,
    )
    start = max(0, first_match - max_chars // 4)
    end = min(len(content), start + max_chars)
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(content) else ""
    return f"{prefix}{content[start:end].strip()}{suffix}"


def search_training_documents(query: str, user_id: str | None = None, limit: int = 5) -> str:
    """Search documents uploaded through the AI training UI."""
    clean_query = query.strip()
    if not clean_query:
        return "Chua co tu khoa tim kiem tai lieu training."

    with contextmanager(get_db_session)() as db:
        documents = rag_document_repo.search(db, clean_query, user_id=user_id, limit=limit)

    sales_documents = search_sales_training_documents(clean_query, limit=limit)

    if not documents and not sales_documents:
        return "Khong tim thay noi dung phu hop trong tai lieu training da upload."

    sections = []
    for index, doc in enumerate(documents, start=1):
        sections.append(
            "\n".join(
                [
                    f"[{index}] {doc.filename}",
                    f"Document ID: {doc.id}",
                    f"Uploaded: {doc.created_at}",
                    "Snippet:",
                    _snippet(doc.content, clean_query),
                ]
            )
        )
    start_index = len(sections) + 1
    for index, doc in enumerate(sales_documents, start=start_index):
        sections.append(
            "\n".join(
                [
                    f"[{index}] {doc.get('file_name')}",
                    f"Document ID: mysql:{doc.get('training_document_id')}",
                    f"Uploaded: {doc.get('created_at')}",
                    "Snippet:",
                    _snippet(str(doc.get("parsed_content") or ""), clean_query),
                ]
            )
        )
    return "\n\n".join(sections)
