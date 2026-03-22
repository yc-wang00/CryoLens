"""PDF ingestion endpoints."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.schemas.ingestion import IngestionResponse
from app.services.ingestion import ingest_pdf_document

router = APIRouter(prefix="/api/v1/ingestion", tags=["ingestion"])


@router.post(
    "/pdf",
    response_model=IngestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a PDF document",
)
async def ingest_pdf(
    file: UploadFile = File(...),
    extraction_instruction: str | None = Form(default=None),
    session: AsyncSession = Depends(get_async_session),
) -> IngestionResponse:
    """Extract PDF text, chunk it, and normalize mocked knowledge rows."""
    filename = file.filename or "upload.pdf"
    is_pdf = filename.lower().endswith(".pdf") or file.content_type == "application/pdf"
    if not is_pdf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF uploads are supported in the current scaffold.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        result = await ingest_pdf_document(
            session=session,
            filename=filename,
            content_type=file.content_type,
            file_bytes=file_bytes,
            extraction_instruction=extraction_instruction,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return IngestionResponse(
        document_id=result.document_id,
        filename=result.filename,
        chunk_count=result.chunk_count,
        structures_saved=result.structures_saved,
        replacement_entries_saved=result.replacement_entries_saved,
        findings_saved=result.findings_saved,
        extraction_instruction=result.extraction_instruction,
    )

