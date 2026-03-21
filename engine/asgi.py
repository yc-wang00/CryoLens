"""ASGI entrypoint for HTTP deployment (Railway, Fly.io, etc).

Wraps the FastMCP streamable-http app with:
- GET /health — health check for Railway deploy probes
- Bearer token auth on /mcp — optional, enabled via CRYOLENS_API_KEY env var

Usage:
    uvicorn engine.asgi:app --host 0.0.0.0 --port $PORT
"""

import contextlib
import os

from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route

from engine.mcp_server import mcp

API_KEY = os.environ.get("CRYOLENS_API_KEY")


class BearerAuthMiddleware(BaseHTTPMiddleware):
    """Reject requests to /mcp without a valid Bearer token."""

    async def dispatch(self, request: Request, call_next) -> Response:
        if not API_KEY:
            return await call_next(request)

        if request.url.path == "/health":
            return await call_next(request)

        auth = request.headers.get("Authorization", "")
        if auth == f"Bearer {API_KEY}":
            return await call_next(request)

        return JSONResponse(
            {"error": "Unauthorized. Provide Authorization: Bearer <key>"},
            status_code=401,
        )


async def health_check(request: Request) -> JSONResponse:
    """Health check for Railway deploy probes."""
    from engine.db import create_pool, get_dsn
    try:
        pool = await create_pool(get_dsn(), min_size=1, max_size=1)
        async with pool.acquire() as conn:
            result = await conn.fetchval("SELECT COUNT(*) FROM papers")
        await pool.close()
        return JSONResponse({
            "status": "healthy",
            "papers_in_db": result,
        })
    except Exception as e:
        return JSONResponse(
            {"status": "unhealthy", "error": str(e)},
            status_code=503,
        )


mcp.settings.stateless_http = True


@contextlib.asynccontextmanager
async def lifespan(app: Starlette):
    async with mcp.session_manager.run():
        yield


app = Starlette(
    routes=[
        Route("/health", health_check, methods=["GET"]),
        Mount("/", app=mcp.streamable_http_app()),
    ],
    lifespan=lifespan,
    middleware=[Middleware(BearerAuthMiddleware)],
)
