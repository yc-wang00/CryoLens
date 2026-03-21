"""Database connection pool for CryoSight MCP server.

Provides two asyncpg pools:
- Primary pool: used by all tools
- Read-only pool: used by query_database (defense-in-depth)

Supabase-compatible: disables prepared statement caching for
transaction-mode connection poolers (Supavisor/PgBouncer).
"""

import logging
import os
import ssl as ssl_module
from urllib.parse import urlparse

import asyncpg

logger = logging.getLogger("cryosight.db")

# Sanitize connection URLs in logs
def _sanitize_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.password:
        return url.replace(parsed.password, "***")
    return url


def _needs_ssl(url: str) -> ssl_module.SSLContext | bool:
    """Return SSL context if connecting to a remote host (e.g. Supabase)."""
    parsed = urlparse(url)
    host = parsed.hostname or ""
    if host in ("localhost", "127.0.0.1", "::1", ""):
        return False
    ctx = ssl_module.create_default_context()
    return ctx


async def create_pool(
    dsn: str,
    *,
    min_size: int = 1,
    max_size: int = 5,
) -> asyncpg.Pool:
    """Create an asyncpg connection pool with Supabase compatibility."""
    ssl = _needs_ssl(dsn)
    pool = await asyncpg.create_pool(
        dsn,
        min_size=min_size,
        max_size=max_size,
        # Disable prepared statement cache for Supavisor/PgBouncer compatibility
        statement_cache_size=0,
        ssl=ssl,
    )
    logger.info("Connected to %s (pool %d-%d)", _sanitize_url(dsn), min_size, max_size)
    return pool


async def fetch_all(pool: asyncpg.Pool, query: str, *args: object) -> list[dict]:
    """Execute a parameterized query and return rows as dicts."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(r) for r in rows]


async def fetch_one(pool: asyncpg.Pool, query: str, *args: object) -> dict | None:
    """Execute a parameterized query and return a single row as dict."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


# SQL safety for query_database tool
_FORBIDDEN_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
    "TRUNCATE", "GRANT", "REVOKE", "COPY", "EXECUTE", "CALL",
}


def validate_readonly_sql(sql: str) -> str | None:
    """Validate SQL is read-only. Returns error message or None if safe."""
    stripped = sql.strip().rstrip(";").strip()
    if not stripped:
        return "Empty query"
    # Tokenize by whitespace and check for forbidden keywords
    tokens = stripped.upper().split()
    for token in tokens:
        if token in _FORBIDDEN_KEYWORDS:
            return f"Forbidden keyword: {token}. Only SELECT queries are allowed."
    if not tokens[0].startswith("SELECT") and not tokens[0].startswith("WITH"):
        return "Query must start with SELECT or WITH"
    return None


def get_dsn() -> str:
    return os.environ.get(
        "CRYOSIGHT_DB_URL",
        "postgresql://localhost/cryosight",
    )


def get_readonly_dsn() -> str:
    return os.environ.get("CRYOSIGHT_DB_READONLY_URL", get_dsn())
