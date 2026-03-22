"""Add curated seed metadata and search text columns."""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260321_0002"
down_revision = "20260321_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add metadata and search-ready columns for curated bootstrap seeds."""
    op.add_column("documents", sa.Column("title", sa.String(length=512), nullable=True))
    op.add_column("documents", sa.Column("citation", sa.Text(), nullable=True))
    op.add_column("documents", sa.Column("doi", sa.String(length=255), nullable=True))
    op.add_column(
        "documents",
        sa.Column("journal", sa.String(length=255), nullable=True),
    )
    op.add_column("documents", sa.Column("year", sa.Integer(), nullable=True))
    op.add_column(
        "documents",
        sa.Column(
            "authors_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column("documents", sa.Column("abstract", sa.Text(), nullable=True))
    op.add_column(
        "documents",
        sa.Column(
            "keywords_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column("documents", sa.Column("search_text", sa.Text(), nullable=True))
    op.create_index("ix_documents_doi", "documents", ["doi"], unique=False)

    op.add_column("cpa_structures", sa.Column("search_text", sa.Text(), nullable=True))
    op.add_column(
        "replacement_index",
        sa.Column("search_text", sa.Text(), nullable=True),
    )

    op.add_column(
        "findings",
        sa.Column(
            "conditions_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column(
        "findings",
        sa.Column(
            "statistics_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column(
        "findings",
        sa.Column(
            "tags_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column("findings", sa.Column("search_text", sa.Text(), nullable=True))

    op.alter_column("documents", "authors_json", server_default=None)
    op.alter_column("documents", "keywords_json", server_default=None)
    op.alter_column("findings", "conditions_json", server_default=None)
    op.alter_column("findings", "statistics_json", server_default=None)
    op.alter_column("findings", "tags_json", server_default=None)


def downgrade() -> None:
    """Remove curated seed metadata and search-ready columns."""
    op.drop_column("findings", "search_text")
    op.drop_column("findings", "tags_json")
    op.drop_column("findings", "statistics_json")
    op.drop_column("findings", "conditions_json")

    op.drop_column("replacement_index", "search_text")
    op.drop_column("cpa_structures", "search_text")

    op.drop_index("ix_documents_doi", table_name="documents")
    op.drop_column("documents", "search_text")
    op.drop_column("documents", "keywords_json")
    op.drop_column("documents", "abstract")
    op.drop_column("documents", "authors_json")
    op.drop_column("documents", "year")
    op.drop_column("documents", "journal")
    op.drop_column("documents", "doi")
    op.drop_column("documents", "citation")
    op.drop_column("documents", "title")
