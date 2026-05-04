"""Repository helpers for AI training documents."""

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db.models.rag_document import RagDocument


def create(db: Session, document: RagDocument) -> RagDocument:
    """Persist a RAG document."""
    db.add(document)
    db.flush()
    return document


def list_for_user(db: Session, user_id: str, limit: int = 50) -> list[RagDocument]:
    """List a user's latest training documents."""
    stmt = (
        select(RagDocument)
        .where(RagDocument.user_id == user_id)
        .order_by(RagDocument.created_at.desc())
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def search(db: Session, query: str, user_id: str | None = None, limit: int = 5) -> list[RagDocument]:
    """Simple SQLite LIKE search across document filename and content."""
    terms = [term.strip() for term in query.split() if term.strip()]
    filters = []
    if user_id:
        filters.append(RagDocument.user_id == user_id)
    if terms:
        for term in terms[:6]:
            pattern = f"%{term}%"
            filters.append(or_(RagDocument.filename.ilike(pattern), RagDocument.content.ilike(pattern)))

    stmt = select(RagDocument)
    for condition in filters:
        stmt = stmt.where(condition)
    stmt = stmt.order_by(RagDocument.created_at.desc()).limit(limit)
    return list(db.execute(stmt).scalars().all())
