"""
PDF INGESTION ORCHESTRATION
===========================
Purpose

Coordinate PDF ingestion from upload through raw-text extraction, chunking, and
normalized knowledge persistence.

KEY CONCEPTS:
- the route layer stays thin
- persistence writes both raw and normalized records
- the extraction boundary is isolated for a future real LLM implementation

USAGE:
- call `ingest_pdf_document()` from the ingestion router

MEMORY REFERENCES:
- MEM-0001
"""

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import (
    CPAStructure,
    CPAStructureType,
    Document,
    DocumentChunk,
    DocumentSourceType,
    Finding,
    FindingSourceType,
    IngestionRun,
    IngestionStatus,
    ReplacementEntry,
    ReplacementEntryType,
)
from app.schemas.knowledge import (
    ExtractedFinding,
    ExtractedReplacement,
    ExtractedStructure,
)
from app.services.chunking import chunk_text
from app.services.extraction import mock_extract_knowledge
from app.services.pdf import extract_text_from_pdf


@dataclass
class IngestionResult:
    """Summary of a completed ingestion transaction."""

    document_id: UUID
    filename: str
    chunk_count: int
    structures_saved: int
    replacement_entries_saved: int
    findings_saved: int
    extraction_instruction: str | None


async def ingest_pdf_document(
    *,
    session: AsyncSession,
    filename: str,
    content_type: str | None,
    file_bytes: bytes,
    extraction_instruction: str | None,
) -> IngestionResult:
    """Persist a PDF document, its chunks, and mocked normalized knowledge."""
    raw_text = extract_text_from_pdf(file_bytes)
    chunks = chunk_text(
        text=raw_text,
        chunk_size=settings.chunk_size,
        overlap=settings.chunk_overlap,
    )
    if not chunks:
        raise ValueError("PDF text extraction produced no usable content.")

    document = Document(
        filename=filename,
        content_type=content_type,
        source_type=DocumentSourceType.upload,
        extraction_instruction=extraction_instruction,
        raw_text=raw_text,
    )
    session.add(document)
    await session.flush()

    session.add(
        IngestionRun(
            document_id=document.id,
            status=IngestionStatus.completed,
            extraction_instruction=extraction_instruction,
        )
    )

    for chunk_index, chunk in enumerate(chunks):
        session.add(
            DocumentChunk(
                document_id=document.id,
                chunk_index=chunk_index,
                content=chunk,
                embedding=None,
            )
        )

    payload = mock_extract_knowledge(
        text=raw_text,
        instruction=extraction_instruction,
        filename=filename,
    )

    structures_saved = await _persist_structures(
        session=session,
        source_document_id=document.id,
        structures=payload.cpa_structures,
    )
    replacements_saved = await _persist_replacements(
        session=session,
        source_document_id=document.id,
        replacements=payload.replacement_entries,
    )
    findings_saved = _persist_findings(
        session=session,
        source_document_id=document.id,
        findings=payload.findings,
    )

    await session.commit()

    return IngestionResult(
        document_id=document.id,
        filename=filename,
        chunk_count=len(chunks),
        structures_saved=structures_saved,
        replacement_entries_saved=replacements_saved,
        findings_saved=findings_saved,
        extraction_instruction=extraction_instruction,
    )


async def _persist_structures(
    *,
    session: AsyncSession,
    source_document_id: UUID,
    structures: list[ExtractedStructure],
) -> int:
    """Insert newly extracted structures by unique name."""
    inserted = 0
    for structure in structures:
        existing = await session.scalar(
            select(CPAStructure).where(CPAStructure.name == structure.name)
        )
        if existing is not None:
            continue
        session.add(
            CPAStructure(
                source_document_id=source_document_id,
                name=structure.name,
                structure_type=CPAStructureType(structure.structure_type),
                components_json=structure.components_json,
                component_roles_json=structure.component_roles_json,
                tissue_tags_json=structure.tissue_tags_json,
                notes=structure.notes,
            )
        )
        inserted += 1
    return inserted


async def _persist_replacements(
    *,
    session: AsyncSession,
    source_document_id: UUID,
    replacements: list[ExtractedReplacement],
) -> int:
    """Insert newly extracted replacement entries by unique name."""
    inserted = 0
    for replacement in replacements:
        existing = await session.scalar(
            select(ReplacementEntry).where(ReplacementEntry.name == replacement.name)
        )
        if existing is not None:
            continue
        session.add(
            ReplacementEntry(
                source_document_id=source_document_id,
                entry_type=ReplacementEntryType(replacement.entry_type),
                name=replacement.name,
                aliases_json=replacement.aliases_json,
                class_name=replacement.class_name,
                simple_descriptors_json=replacement.simple_descriptors_json,
                notes=replacement.notes,
            )
        )
        inserted += 1
    return inserted


def _persist_findings(
    *,
    session: AsyncSession,
    source_document_id: UUID,
    findings: list[ExtractedFinding],
) -> int:
    """Insert findings derived from the current document."""
    for finding in findings:
        session.add(
            Finding(
                source_document_id=source_document_id,
                source_type=FindingSourceType(finding.source_type),
                source_title=finding.source_title,
                citation=finding.citation,
                year=finding.year,
                tissue=finding.tissue,
                modality=finding.modality,
                component_names_json=finding.component_names_json,
                candidate_names_json=finding.candidate_names_json,
                metric_type=finding.metric_type,
                metric_value=finding.metric_value,
                metric_unit=finding.metric_unit,
                finding_summary=finding.finding_summary,
                source_location=finding.source_location,
                confidence=finding.confidence,
            )
        )
    return len(findings)

