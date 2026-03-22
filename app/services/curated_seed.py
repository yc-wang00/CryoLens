"""
CURATED SEED LOADER
===================
Purpose

Load a deterministic paper-derived bootstrap seed into the CryoSight database
before the full ingestion pipeline is ready.

KEY CONCEPTS:
- the seed keeps paper metadata separate from raw extracted PDF text
- chunk storage is populated now so embeddings can be added later
- findings preserve assay conditions and statistics for expert-facing review

USAGE:
- run `python -m app.services.curated_seed`
- call `seed_curated_knowledge()` from one-off operator scripts

MEMORY REFERENCES:
- MEM-0001
- MEM-0002
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

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
from app.db.session import SyncSessionLocal
from app.schemas.curated_seed import (
    CuratedSeedDocument,
    CuratedSeedFinding,
    CuratedSeedPayload,
    CuratedSeedReplacementEntry,
    CuratedSeedStructure,
)
from app.services.chunking import chunk_text
from app.services.pdf import extract_text_from_pdf

ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_CURATED_SEED_PATH = ROOT_DIR / "app" / "bootstrap_cpa_seed.json"
CURATED_SEED_INSTRUCTION = "manual curated bootstrap seed from CPA screening papers"


@dataclass(frozen=True)
class CuratedSeedResult:
    """Summary counts for a completed curated seed run."""

    documents_seeded: int
    chunks_seeded: int
    structures_seeded: int
    replacement_entries_seeded: int
    findings_seeded: int


def load_curated_seed(
    seed_path: Path = DEFAULT_CURATED_SEED_PATH,
) -> CuratedSeedPayload:
    """Read and validate the curated seed payload from disk."""
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    return CuratedSeedPayload.model_validate(payload)


def build_document_search_text(document: CuratedSeedDocument) -> str:
    """Build deterministic source-level search text for NLP and embeddings."""
    parts = [
        document.title,
        document.citation,
        f"doi {document.doi}",
        document.journal,
        str(document.year),
        "authors " + ", ".join(document.authors_json),
        document.abstract,
        "keywords " + ", ".join(document.keywords_json),
        document.notes or "",
    ]
    return _collapse_text(parts)


def build_structure_search_text(structure: CuratedSeedStructure) -> str:
    """Build deterministic structure-level search text."""
    component_text = ", ".join(
        _stringify_json_value(component) for component in structure.components_json
    )
    role_text = ", ".join(
        f"{name}:{role}"
        for name, role in sorted(structure.component_roles_json.items())
    )
    parts = [
        structure.name,
        structure.structure_type,
        component_text,
        role_text,
        ", ".join(structure.tissue_tags_json),
        structure.notes or "",
    ]
    return _collapse_text(parts)


def build_replacement_search_text(entry: CuratedSeedReplacementEntry) -> str:
    """Build deterministic replacement-entry search text."""
    descriptor_text = ", ".join(
        f"{key}={_stringify_json_value(value)}"
        for key, value in sorted(entry.simple_descriptors_json.items())
    )
    parts = [
        entry.name,
        ", ".join(entry.aliases_json),
        entry.class_name or "",
        descriptor_text,
        entry.notes or "",
        "sources " + ", ".join(entry.source_seed_keys),
    ]
    return _collapse_text(parts)


def build_finding_search_text(
    finding: CuratedSeedFinding,
    document: CuratedSeedDocument,
) -> str:
    """Build deterministic finding-level search text."""
    condition_text = ", ".join(
        f"{key}={_stringify_json_value(value)}"
        for key, value in sorted(finding.conditions_json.items())
    )
    statistics_text = ", ".join(
        f"{key}={_stringify_json_value(value)}"
        for key, value in sorted(finding.statistics_json.items())
    )
    metric_text = ""
    if finding.metric_type:
        metric_text = f"{finding.metric_type} {finding.metric_value}".strip()
        if finding.metric_unit:
            metric_text = f"{metric_text} {finding.metric_unit}"

    parts = [
        document.title,
        document.citation,
        finding.tissue or "",
        finding.modality or "",
        ", ".join(finding.component_names_json),
        ", ".join(finding.candidate_names_json),
        metric_text,
        condition_text,
        statistics_text,
        ", ".join(finding.tags_json),
        finding.finding_summary,
        finding.source_location or "",
    ]
    return _collapse_text(parts)


def seed_curated_knowledge(
    session: Session,
    payload: CuratedSeedPayload,
    repo_root: Path = ROOT_DIR,
) -> CuratedSeedResult:
    """Seed the database with curated documents and search-ready knowledge rows."""
    document_rows = _upsert_documents(
        session=session,
        payload=payload,
        repo_root=repo_root,
    )
    structures_seeded = _upsert_structures(
        session=session,
        structures=payload.cpa_structures,
        document_rows=document_rows,
    )
    replacement_entries_seeded = _upsert_replacement_entries(
        session=session,
        entries=payload.replacement_entries,
    )
    findings_seeded = _insert_findings(
        session=session,
        findings=payload.findings,
        document_rows=document_rows,
    )
    session.commit()

    return CuratedSeedResult(
        documents_seeded=len(document_rows),
        chunks_seeded=sum(row.chunk_count for row in document_rows.values()),
        structures_seeded=structures_seeded,
        replacement_entries_seeded=replacement_entries_seeded,
        findings_seeded=findings_seeded,
    )


@dataclass
class SeededDocumentRow:
    """In-memory handle for a seeded document row."""

    document: Document
    seed: CuratedSeedDocument
    chunk_count: int


def _upsert_documents(
    session: Session,
    payload: CuratedSeedPayload,
    repo_root: Path,
) -> dict[str, SeededDocumentRow]:
    rows_by_key: dict[str, SeededDocumentRow] = {}

    filenames = [document.filename for document in payload.documents]
    existing_documents = {
        document.filename: document
        for document in session.scalars(
            select(Document).where(Document.filename.in_(filenames))
        )
    }

    for seed_document in payload.documents:
        raw_text = _extract_seed_pdf_text(
            pdf_path=repo_root / seed_document.pdf_path,
        )
        search_text = build_document_search_text(seed_document)
        existing = existing_documents.get(seed_document.filename)

        if existing is None:
            existing = Document(
                filename=seed_document.filename,
                title=seed_document.title,
                citation=seed_document.citation,
                doi=seed_document.doi,
                journal=seed_document.journal,
                year=seed_document.year,
                authors_json=seed_document.authors_json,
                abstract=seed_document.abstract,
                keywords_json=seed_document.keywords_json,
                search_text=search_text,
                content_type="application/pdf",
                source_type=DocumentSourceType.upload,
                extraction_instruction=CURATED_SEED_INSTRUCTION,
                raw_text=raw_text,
            )
            session.add(existing)
            session.flush()
        else:
            _clear_document_knowledge(session=session, document_id=existing.id)
            existing.title = seed_document.title
            existing.citation = seed_document.citation
            existing.doi = seed_document.doi
            existing.journal = seed_document.journal
            existing.year = seed_document.year
            existing.authors_json = list(seed_document.authors_json)
            existing.abstract = seed_document.abstract
            existing.keywords_json = list(seed_document.keywords_json)
            existing.search_text = search_text
            existing.content_type = "application/pdf"
            existing.source_type = DocumentSourceType.upload
            existing.extraction_instruction = CURATED_SEED_INSTRUCTION
            existing.raw_text = raw_text

        chunks = chunk_text(
            text=raw_text,
            chunk_size=settings.chunk_size,
            overlap=settings.chunk_overlap,
        )
        for chunk_index, chunk in enumerate(chunks):
            session.add(
                DocumentChunk(
                    document_id=existing.id,
                    chunk_index=chunk_index,
                    content=chunk,
                )
            )

        session.add(
            IngestionRun(
                document_id=existing.id,
                status=IngestionStatus.completed,
                extraction_instruction=CURATED_SEED_INSTRUCTION,
            )
        )

        rows_by_key[seed_document.seed_key] = SeededDocumentRow(
            document=existing,
            seed=seed_document,
            chunk_count=len(chunks),
        )

    session.flush()
    return rows_by_key


def _upsert_structures(
    session: Session,
    structures: list[CuratedSeedStructure],
    document_rows: dict[str, SeededDocumentRow],
) -> int:
    for structure in structures:
        search_text = build_structure_search_text(structure)
        document_id = (
            document_rows[structure.source_seed_key].document.id
            if structure.source_seed_key
            else None
        )
        existing = session.scalar(
            select(CPAStructure).where(CPAStructure.name == structure.name)
        )

        if existing is None:
            existing = CPAStructure(
                source_document_id=document_id,
                name=structure.name,
                structure_type=CPAStructureType(structure.structure_type),
                components_json=structure.components_json,
                component_roles_json=structure.component_roles_json,
                tissue_tags_json=structure.tissue_tags_json,
                notes=structure.notes,
                search_text=search_text,
            )
            session.add(existing)
        else:
            existing.source_document_id = document_id
            existing.structure_type = CPAStructureType(structure.structure_type)
            existing.components_json = list(structure.components_json)
            existing.component_roles_json = dict(structure.component_roles_json)
            existing.tissue_tags_json = list(structure.tissue_tags_json)
            existing.notes = structure.notes
            existing.search_text = search_text

    session.flush()
    return len(structures)


def _upsert_replacement_entries(
    session: Session,
    entries: list[CuratedSeedReplacementEntry],
) -> int:
    for entry in entries:
        existing = session.scalar(
            select(ReplacementEntry).where(ReplacementEntry.name == entry.name)
        )
        descriptors = dict(entry.simple_descriptors_json)
        if entry.source_seed_keys:
            descriptors["source_seed_keys"] = list(entry.source_seed_keys)
        search_text = build_replacement_search_text(entry)

        if existing is None:
            existing = ReplacementEntry(
                entry_type=ReplacementEntryType(entry.entry_type),
                name=entry.name,
                aliases_json=entry.aliases_json,
                class_name=entry.class_name,
                simple_descriptors_json=descriptors,
                notes=entry.notes,
                search_text=search_text,
            )
            session.add(existing)
        else:
            existing.entry_type = ReplacementEntryType(entry.entry_type)
            existing.aliases_json = list(entry.aliases_json)
            existing.class_name = entry.class_name
            existing.simple_descriptors_json = descriptors
            existing.notes = entry.notes
            existing.search_text = search_text

    session.flush()
    return len(entries)


def _insert_findings(
    session: Session,
    findings: list[CuratedSeedFinding],
    document_rows: dict[str, SeededDocumentRow],
) -> int:
    for finding in findings:
        seeded_document = document_rows[finding.source_seed_key]
        session.add(
            Finding(
                source_document_id=seeded_document.document.id,
                source_type=FindingSourceType(finding.source_type),
                source_title=seeded_document.seed.title,
                citation=seeded_document.seed.citation,
                year=seeded_document.seed.year,
                tissue=finding.tissue,
                modality=finding.modality,
                component_names_json=finding.component_names_json,
                candidate_names_json=finding.candidate_names_json,
                metric_type=finding.metric_type,
                metric_value=finding.metric_value,
                metric_unit=finding.metric_unit,
                conditions_json=finding.conditions_json,
                statistics_json=finding.statistics_json,
                tags_json=finding.tags_json,
                finding_summary=finding.finding_summary,
                search_text=build_finding_search_text(finding, seeded_document.seed),
                source_location=finding.source_location,
                confidence=finding.confidence,
            )
        )

    session.flush()
    return len(findings)


def _clear_document_knowledge(session: Session, document_id: object) -> None:
    session.execute(delete(Finding).where(Finding.source_document_id == document_id))
    session.execute(
        delete(CPAStructure).where(CPAStructure.source_document_id == document_id)
    )
    session.execute(
        delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
    )
    session.execute(delete(IngestionRun).where(IngestionRun.document_id == document_id))


def _extract_seed_pdf_text(pdf_path: Path) -> str:
    if not pdf_path.exists():
        raise FileNotFoundError(f"Seed PDF not found: {pdf_path}")
    return extract_text_from_pdf(pdf_path.read_bytes())


def _stringify_json_value(value: object) -> str:
    if isinstance(value, dict):
        return ", ".join(
            f"{key}:{_stringify_json_value(inner_value)}"
            for key, inner_value in sorted(value.items())
        )
    if isinstance(value, list):
        return ", ".join(_stringify_json_value(item) for item in value)
    return str(value)


def _collapse_text(parts: list[str]) -> str:
    cleaned = [part.strip() for part in parts if part and part.strip()]
    return " | ".join(cleaned)


def main() -> None:
    """Seed the local Postgres database with the curated bootstrap payload."""
    parser = argparse.ArgumentParser(description="Seed curated CPA bootstrap data.")
    parser.add_argument(
        "--seed-path",
        default=str(DEFAULT_CURATED_SEED_PATH),
        help="Path to the curated seed JSON payload.",
    )
    args = parser.parse_args()

    payload = load_curated_seed(Path(args.seed_path))
    with SyncSessionLocal() as session:
        result = seed_curated_knowledge(session=session, payload=payload)

    print(
        "Seeded curated knowledge:",
        {
            "documents": result.documents_seeded,
            "chunks": result.chunks_seeded,
            "structures": result.structures_seeded,
            "replacement_entries": result.replacement_entries_seeded,
            "findings": result.findings_seeded,
        },
    )


if __name__ == "__main__":
    main()
