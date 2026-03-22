"""add hypotheses table

Revision ID: 20260322_0004
Revises: 20260321_0003
Create Date: 2026-03-22 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260322_0004"
down_revision: str | None = "20260321_0003"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    hypothesis_status = sa.Enum(
        "draft",
        "prioritized",
        "planned",
        name="hypothesis_status",
    )
    hypothesis_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "hypotheses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(
                "draft",
                "prioritized",
                "planned",
                name="hypothesis_status",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("benchmark", sa.String(length=255), nullable=True),
        sa.Column("target", sa.String(length=255), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column(
            "evidence_ids_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("next_step", sa.Text(), nullable=True),
        sa.Column("source_prompt", sa.Text(), nullable=True),
        sa.Column(
            "agent_profile",
            sa.String(length=64),
            nullable=False,
            server_default="hypothesis",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_hypotheses")),
    )
    op.create_index(
        op.f("ix_hypotheses_status"),
        "hypotheses",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_hypotheses_benchmark"),
        "hypotheses",
        ["benchmark"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_hypotheses_benchmark"), table_name="hypotheses")
    op.drop_index(op.f("ix_hypotheses_status"), table_name="hypotheses")
    op.drop_table("hypotheses")
    sa.Enum(name="hypothesis_status").drop(op.get_bind(), checkfirst=True)
