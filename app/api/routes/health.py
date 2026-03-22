"""Health endpoints."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/", summary="Root endpoint")
async def root() -> dict[str, str]:
    """Return the API identity."""
    return {"message": "CryoLens API", "version": "0.1.0"}


@router.get("/health", summary="Health check")
async def health_check() -> dict[str, str]:
    """Return a basic process health response."""
    return {"status": "healthy"}

