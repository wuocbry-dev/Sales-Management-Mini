"""add rag documents

Revision ID: 3f0b5ef8b6a1
Revises: 12ee07e206ce
Create Date: 2026-04-26 05:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3f0b5ef8b6a1"
down_revision: Union[str, None] = "12ee07e206ce"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rag_documents",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("source_file_id", sa.String(length=36), nullable=True),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("file_type", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("chunk_count", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["source_file_id"],
            ["chat_files.id"],
            name=op.f("rag_documents_source_file_id_fkey"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("rag_documents_user_id_fkey"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("rag_documents_pkey")),
    )
    op.create_index(op.f("rag_documents_source_file_id_idx"), "rag_documents", ["source_file_id"])
    op.create_index(op.f("rag_documents_user_id_idx"), "rag_documents", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("rag_documents_user_id_idx"), table_name="rag_documents")
    op.drop_index(op.f("rag_documents_source_file_id_idx"), table_name="rag_documents")
    op.drop_table("rag_documents")
