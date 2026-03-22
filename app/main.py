"""CryoLens FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import compounds, findings, formulations, health, papers, stats
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="CryoLens cryopreservation knowledge base API.",
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
app.include_router(papers.router)
app.include_router(compounds.router)
app.include_router(findings.router)
app.include_router(formulations.router)
app.include_router(stats.router)
