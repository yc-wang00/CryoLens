"""CryoLens FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import cryo_lens, health, hypotheses, ingestion
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="CryoLens PDF ingestion and knowledge normalization backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ingestion.router)
app.include_router(cryo_lens.router)
app.include_router(hypotheses.router)
