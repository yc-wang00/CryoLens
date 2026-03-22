"""Create CryoSight knowledge base schema."""

import sqlalchemy as sa
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260321_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create the initial CryoSight schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    document_source_type = postgresql.ENUM(
        "upload",
        name="document_source_type",
        create_type=False,
    )
    ingestion_status = postgresql.ENUM(
        "completed",
        name="ingestion_status",
        create_type=False,
    )
    cpa_structure_type = postgresql.ENUM(
        "single",
        "mixture",
        "benchmark",
        name="cpa_structure_type",
        create_type=False,
    )
    replacement_entry_type = postgresql.ENUM(
        "molecule",
        "class",
        name="replacement_entry_type",
        create_type=False,
    )
    finding_source_type = postgresql.ENUM(
        "paper",
        "preprint",
        "experiment",
        name="finding_source_type",
        create_type=False,
    )

    bind = op.get_bind()
    document_source_type.create(bind, checkfirst=True)
    ingestion_status.create(bind, checkfirst=True)
    cpa_structure_type.create(bind, checkfirst=True)
    replacement_entry_type.create(bind, checkfirst=True)
    finding_source_type.create(bind, checkfirst=True)

    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=True),
        sa.Column("source_type", document_source_type, nullable=False),
        sa.Column("extraction_instruction", sa.Text(), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_documents")),
    )

    op.create_table(
        "document_chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(768), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_document_chunks_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_document_chunks")),
    )
    op.create_index(
        "ix_document_chunks_document_chunk",
        "document_chunks",
        ["document_id", "chunk_index"],
        unique=False,
    )

    op.create_table(
        "ingestion_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", ingestion_status, nullable=False),
        sa.Column("extraction_instruction", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            name=op.f("fk_ingestion_runs_document_id_documents"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ingestion_runs")),
    )

    op.create_table(
        "cpa_structures",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("structure_type", cpa_structure_type, nullable=False),
        sa.Column(
            "components_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "component_roles_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "tissue_tags_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["source_document_id"],
            ["documents.id"],
            name=op.f("fk_cpa_structures_source_document_id_documents"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cpa_structures")),
        sa.UniqueConstraint("name", name=op.f("uq_cpa_structures_name")),
    )

    op.create_table(
        "replacement_index",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("entry_type", replacement_entry_type, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "aliases_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("class_name", sa.String(length=255), nullable=True),
        sa.Column(
            "simple_descriptors_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["source_document_id"],
            ["documents.id"],
            name=op.f("fk_replacement_index_source_document_id_documents"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_replacement_index")),
        sa.UniqueConstraint("name", name=op.f("uq_replacement_index_name")),
    )
    op.create_index(
        op.f("ix_replacement_index_class_name"),
        "replacement_index",
        ["class_name"],
        unique=False,
    )

    op.create_table(
        "findings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("source_type", finding_source_type, nullable=False),
        sa.Column("source_title", sa.String(length=512), nullable=False),
        sa.Column("citation", sa.Text(), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("tissue", sa.String(length=255), nullable=True),
        sa.Column("modality", sa.String(length=255), nullable=True),
        sa.Column(
            "component_names_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "candidate_names_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("metric_type", sa.String(length=255), nullable=True),
        sa.Column("metric_value", sa.Float(), nullable=True),
        sa.Column("metric_unit", sa.String(length=64), nullable=True),
        sa.Column("finding_summary", sa.Text(), nullable=False),
        sa.Column("source_location", sa.String(length=255), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["source_document_id"],
            ["documents.id"],
            name=op.f("fk_findings_source_document_id_documents"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_findings")),
    )
    op.create_index(
        op.f("ix_findings_metric_type"),
        "findings",
        ["metric_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_findings_modality"),
        "findings",
        ["modality"],
        unique=False,
    )
    op.create_index(
        op.f("ix_findings_tissue"),
        "findings",
        ["tissue"],
        unique=False,
    )
    op.create_index(op.f("ix_findings_year"), "findings", ["year"], unique=False)


def downgrade() -> None:
    """Drop the initial CryoSight schema."""
    op.drop_index(op.f("ix_findings_year"), table_name="findings")
    op.drop_index(op.f("ix_findings_tissue"), table_name="findings")
    op.drop_index(op.f("ix_findings_modality"), table_name="findings")
    op.drop_index(op.f("ix_findings_metric_type"), table_name="findings")
    op.drop_table("findings")

    op.drop_index(
        op.f("ix_replacement_index_class_name"),
        table_name="replacement_index",
    )
    op.drop_table("replacement_index")
    op.drop_table("cpa_structures")
    op.drop_table("ingestion_runs")

    op.drop_index("ix_document_chunks_document_chunk", table_name="document_chunks")
    op.drop_table("document_chunks")
    op.drop_table("documents")

    bind = op.get_bind()
    postgresql.ENUM(name="finding_source_type").drop(bind, checkfirst=True)
    postgresql.ENUM(name="replacement_entry_type").drop(bind, checkfirst=True)
    postgresql.ENUM(name="cpa_structure_type").drop(bind, checkfirst=True)
    postgresql.ENUM(name="ingestion_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="document_source_type").drop(bind, checkfirst=True)
