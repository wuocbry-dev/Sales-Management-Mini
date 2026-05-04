"""Training document service for the AI agent knowledge base."""

from typing import Any

from sqlalchemy.orm import Session

from app.db.models.rag_document import RagDocument
from app.repositories import rag_document_repo
from app.services.sales_training_store import save_training_document_to_sales_db


class TrainingDocumentService:
    """Create and read documents used by the agent as persistent knowledge."""

    def __init__(self, db: Session):
        self.db = db

    def create_document(
        self,
        *,
        user_id: Any,
        source_file_id: str | None,
        filename: str,
        mime_type: str,
        size: int,
        storage_path: str,
        file_type: str,
        content: str,
    ) -> RagDocument:
        """Store parsed training content."""
        normalized_content = content.strip()
        chunk_count = max(1, (len(normalized_content) + 3999) // 4000)
        document = RagDocument(
            user_id=str(user_id),
            source_file_id=source_file_id,
            filename=filename,
            mime_type=mime_type,
            size=size,
            storage_path=storage_path,
            file_type=file_type,
            content=normalized_content,
            status="ready",
            chunk_count=chunk_count,
        )
        saved = rag_document_repo.create(self.db, document)
        self.db.commit()
        self.db.refresh(saved)
        save_training_document_to_sales_db(
            source_file_id=source_file_id,
            filename=filename,
            mime_type=mime_type,
            size=size,
            storage_path=storage_path,
            file_type=file_type,
            content=normalized_content,
            chunk_count=chunk_count,
        )
        return saved

    def list_documents(self, user_id: Any, limit: int = 50) -> list[RagDocument]:
        """List training documents owned by a user."""
        return rag_document_repo.list_for_user(self.db, str(user_id), limit=limit)
