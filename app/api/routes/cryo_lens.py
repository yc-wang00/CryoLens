"""Live cryoLens dataset endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.schemas.cryo_lens import CryoLensDatasetResponse
from app.services.cryo_lens import fetch_cryo_lens_dataset

router = APIRouter(prefix="/api/v1/cryo-lens", tags=["cryo-lens"])


@router.get(
    "/dataset",
    response_model=CryoLensDatasetResponse,
    summary="Fetch the normalized live cryoLens frontend dataset",
)
async def get_dataset(
    session: AsyncSession = Depends(get_async_session),
) -> CryoLensDatasetResponse:
    """Return the normalized cryoLens dataset for the frontend."""
    return await fetch_cryo_lens_dataset(session=session)
