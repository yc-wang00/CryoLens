"""
KNOWLEDGE MODELS
================
Purpose

Persist uploaded PDF documents, chunked text, and the normalized MVP knowledge
records used by CryoSight.

KEY CONCEPTS:
- raw documents and chunk vectors are stored separately from normalized facts
- the MVP knowledge tables remain small and JSONB-heavy on purpose
- persistence shape follows MEM-0001

USAGE:
- import `Base.metadata` in Alembic
- persist through `app/services/ingestion.py`

MEMORY REFERENCES:
- MEM-0001
- MEM-0002
"""

import enum
import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.config import settings
from app.db.base import Base


class DocumentSourceType(str, enum.Enum):
    """Supported document source types."""

    upload = "upload"


class IngestionStatus(str, enum.Enum):
    """Lifecycle states for an ingestion run."""

    completed = "completed"


class CPAStructureType(str, enum.Enum):
    """Types of benchmark structures stored in the MVP."""

    single = "single"
    mixture = "mixture"
    benchmark = "benchmark"


class ReplacementEntryType(str, enum.Enum):
    """Replacement index entry types."""

    molecule = "molecule"
    chemical_class = "class"


class FindingSourceType(str, enum.Enum):
    """Finding provenance source types."""

    paper = "paper"
    preprint = "preprint"
    experiment = "experiment"


class HypothesisStatus(str, enum.Enum):
    """Lifecycle states for saved hypothesis drafts."""

    draft = "draft"
    prioritized = "prioritized"
    planned = "planned"


class Document(Base):
    """Uploaded document and raw text storage."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str | None] = mapped_column(String(512))
    citation: Mapped[str | None] = mapped_column(Text)
    doi: Mapped[str | None] = mapped_column(String(255))
    journal: Mapped[str | None] = mapped_column(String(255))
    year: Mapped[int | None] = mapped_column(Integer)
    authors_json: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    abstract: Mapped[str | None] = mapped_column(Text)
    keywords_json: Mapped[list[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )
    search_text: Mapped[str | None] = mapped_column(Text)
    content_type: Mapped[str | None] = mapped_column(String(100))
    source_type: Mapped[DocumentSourceType] = mapped_column(
        Enum(DocumentSourceType, name="document_source_type"),
        default=DocumentSourceType.upload,
        nullable=False,
    )
    extraction_instruction: Mapped[str | None] = mapped_column(Text)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
    ingestion_runs: Mapped[list["IngestionRun"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
    )
    cpa_structures: Mapped[list["CPAStructure"]] = relationship(
        back_populates="source_document",
    )
    replacement_entries: Mapped[list["ReplacementEntry"]] = relationship(
        back_populates="source_document",
    )
    findings: Mapped[list["Finding"]] = relationship(
        back_populates="source_document",
    )


class DocumentChunk(Base):
    """Stored text chunk prepared for future vector search."""

    __tablename__ = "document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(settings.vector_dimensions),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    document: Mapped["Document"] = relationship(back_populates="chunks")


class IngestionRun(Base):
    """A completed ingestion execution for a source document."""

    __tablename__ = "ingestion_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[IngestionStatus] = mapped_column(
        Enum(IngestionStatus, name="ingestion_status"),
        default=IngestionStatus.completed,
        nullable=False,
    )
    extraction_instruction: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    document: Mapped["Document"] = relationship(back_populates="ingestion_runs")


class CPAStructure(Base):
    """Known benchmark or working CPA formulations."""

    __tablename__ = "cpa_structures"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    source_document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    structure_type: Mapped[CPAStructureType] = mapped_column(
        Enum(CPAStructureType, name="cpa_structure_type"),
        nullable=False,
    )
    components_json: Mapped[list[dict[str, object]]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )
    component_roles_json: Mapped[dict[str, str]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )
    tissue_tags_json: Mapped[list[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text)
    search_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    source_document: Mapped["Document | None"] = relationship(
        back_populates="cpa_structures"
    )


class ReplacementEntry(Base):
    """Searchable candidate replacement molecules or classes."""

    __tablename__ = "replacement_index"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    source_document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    entry_type: Mapped[ReplacementEntryType] = mapped_column(
        Enum(ReplacementEntryType, name="replacement_entry_type"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    aliases_json: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    class_name: Mapped[str | None] = mapped_column(String(255))
    simple_descriptors_json: Mapped[dict[str, object]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text)
    search_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    source_document: Mapped["Document | None"] = relationship(
        back_populates="replacement_entries"
    )


class Finding(Base):
    """Evidence rows extracted from documents or experiments."""

    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    source_document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_type: Mapped[FindingSourceType] = mapped_column(
        Enum(FindingSourceType, name="finding_source_type"),
        nullable=False,
    )
    source_title: Mapped[str] = mapped_column(String(512), nullable=False)
    citation: Mapped[str | None] = mapped_column(Text)
    year: Mapped[int | None] = mapped_column(Integer)
    tissue: Mapped[str | None] = mapped_column(String(255))
    modality: Mapped[str | None] = mapped_column(String(255))
    component_names_json: Mapped[list[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )
    candidate_names_json: Mapped[list[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )
    metric_type: Mapped[str | None] = mapped_column(String(255))
    metric_value: Mapped[float | None] = mapped_column(Float)
    metric_unit: Mapped[str | None] = mapped_column(String(64))
    conditions_json: Mapped[dict[str, object]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )
    statistics_json: Mapped[dict[str, object]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )
    tags_json: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    finding_summary: Mapped[str] = mapped_column(Text, nullable=False)
    search_text: Mapped[str | None] = mapped_column(Text)
    source_location: Mapped[str | None] = mapped_column(String(255))
    confidence: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    source_document: Mapped["Document | None"] = relationship(back_populates="findings")


class Hypothesis(Base):
    """Saved hypothesis drafts generated from Ask runs."""

    __tablename__ = "hypotheses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[HypothesisStatus] = mapped_column(
        Enum(HypothesisStatus, name="hypothesis_status"),
        default=HypothesisStatus.draft,
        nullable=False,
    )
    benchmark: Mapped[str | None] = mapped_column(String(255))
    target: Mapped[str | None] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_ids_json: Mapped[list[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )
    next_step: Mapped[str | None] = mapped_column(Text)
    source_prompt: Mapped[str | None] = mapped_column(Text)
    agent_profile: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="hypothesis",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


Index(
    "ix_document_chunks_document_chunk",
    DocumentChunk.document_id,
    DocumentChunk.chunk_index,
)
Index("ix_documents_doi", Document.doi)
Index("ix_replacement_index_class_name", ReplacementEntry.class_name)
Index("ix_findings_metric_type", Finding.metric_type)
Index("ix_findings_tissue", Finding.tissue)
Index("ix_findings_modality", Finding.modality)
Index("ix_findings_year", Finding.year)
Index("ix_hypotheses_status", Hypothesis.status)
Index("ix_hypotheses_benchmark", Hypothesis.benchmark)
