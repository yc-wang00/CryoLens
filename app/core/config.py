"""Application settings."""

from functools import cached_property

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly typed application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "CryoLens API"
    app_env: str = "development"
    database_url: str = "postgresql://localhost:5432/cryosight"
    sql_echo: bool = False
    vector_dimensions: int = 768
    chunk_size: int = 1200
    chunk_overlap: int = 200
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:4173",
            "http://localhost:4174",
            "http://localhost:4175",
            "http://localhost:5173",
            "http://localhost:8000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
            "http://127.0.0.1:4173",
            "http://127.0.0.1:4174",
            "http://127.0.0.1:4175",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8000",
        ]
    )

    @cached_property
    def async_database_url(self) -> str:
        """Return the async SQLAlchemy database URL."""
        if self.database_url.startswith("postgresql+asyncpg://"):
            return self.database_url
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace(
                "postgresql://",
                "postgresql+asyncpg://",
                1,
            )
        return self.database_url

    @cached_property
    def sync_database_url(self) -> str:
        """Return the sync SQLAlchemy database URL."""
        if self.database_url.startswith("postgresql+psycopg://"):
            return self.database_url
        if self.database_url.startswith("postgresql+asyncpg://"):
            return self.database_url.replace(
                "postgresql+asyncpg://",
                "postgresql+psycopg://",
                1,
            )
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )
        return self.database_url


settings = Settings()
