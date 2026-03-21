FROM python:3.12-slim AS base

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install dependencies first (cached layer)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy application code
COPY engine/ engine/

# Non-root user
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# Railway sets $PORT; default to 8000
CMD ["uv", "run", "uvicorn", "engine.asgi:app", "--host", "0.0.0.0", "--port", "8000"]
