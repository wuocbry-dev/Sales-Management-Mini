"""Schemas for file upload operations."""

from datetime import datetime

from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    """Response after successful file upload."""

    id: str
    filename: str
    mime_type: str
    size: int
    file_type: str


class FileInfo(FileUploadResponse):
    """Full file metadata."""

    created_at: datetime
    user_id: str


class TrainingDocumentResponse(BaseModel):
    """Training document metadata returned after ingestion."""

    id: str
    source_file_id: str | None = None
    filename: str
    mime_type: str
    size: int
    file_type: str
    status: str
    chunk_count: int
    content_length: int
    created_at: datetime
