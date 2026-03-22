"""Database session factories."""

from collections.abc import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

async_engine = create_async_engine(
    settings.async_database_url,
    echo=settings.sql_echo,
    pool_pre_ping=True,
)
sync_engine = create_engine(
    settings.sync_database_url,
    echo=settings.sql_echo,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
SyncSessionLocal = sessionmaker(bind=sync_engine, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session for request handling."""
    async with AsyncSessionLocal() as session:
        yield session

