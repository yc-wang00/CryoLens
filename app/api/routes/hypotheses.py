"""Saved hypothesis draft endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.schemas.hypotheses import HypothesisCreateRequest, HypothesisResponse
from app.services.hypotheses import create_hypothesis, list_hypothesis_cards

router = APIRouter(prefix="/api/v1/hypotheses", tags=["hypotheses"])


@router.get(
    "",
    response_model=list[HypothesisResponse],
    summary="List saved hypothesis drafts",
)
async def list_hypotheses(
    session: AsyncSession = Depends(get_async_session),
) -> list[HypothesisResponse]:
    """Return saved hypothesis drafts for the Hypotheses page."""
    return await list_hypothesis_cards(session)


@router.post(
    "",
    response_model=HypothesisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a saved hypothesis draft",
)
async def save_hypothesis(
    payload: HypothesisCreateRequest,
    session: AsyncSession = Depends(get_async_session),
) -> HypothesisResponse:
    """Persist a new hypothesis draft generated from Ask."""
    return await create_hypothesis(session, payload)
