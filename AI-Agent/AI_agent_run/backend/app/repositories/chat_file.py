"""Chat file repository (SQLite sync).

Contains database operations for ChatFile entities.
"""

from sqlalchemy.orm import Session

from app.db.models.chat_file import ChatFile


def get_by_id(db: Session, file_id: str) -> ChatFile | None:
    """Get a chat file by ID."""
    return db.get(ChatFile, file_id)


def create(
    db: Session,
    *,
    user_id: str,
    filename: str,
    mime_type: str,
    size: int,
    storage_path: str,
    file_type: str,
    parsed_content: str | None = None,
) -> ChatFile:
    """Create a new chat file record."""
    chat_file = ChatFile(
        user_id=user_id,
        filename=filename,
        mime_type=mime_type,
        size=size,
        storage_path=storage_path,
        file_type=file_type,
        parsed_content=parsed_content,
    )
    db.add(chat_file)
    db.flush()
    return chat_file
