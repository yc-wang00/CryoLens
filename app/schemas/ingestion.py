"""Request and response schemas for ingestion routes."""

from uuid import UUID

from pydantic import BaseModel


class IngestionResponse(BaseModel):
    """Summary of a completed PDF ingestion request."""

    document_id: UUID
    filename: str
    chunk_count: int
    structures_saved: int
    replacement_entries_saved: int
    findings_saved: int
    extraction_instruction: str | None = None

