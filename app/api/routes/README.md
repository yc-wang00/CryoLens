# API Routes

Purpose:
- Expose the CryoSight backend over FastAPI.

Entry points:
- `health.py`
- `cryo_lens.py`
- `hypotheses.py`
- `ingestion.py`

Pattern:
- validate request shape in the route
- inject dependencies with `Depends`
- call a service
- return a typed schema response

Minimal example:
```py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

router = APIRouter(prefix="/api/v1/example", tags=["example"])

@router.get("")
async def list_examples(session: AsyncSession = Depends(get_async_session)) -> dict[str, str]:
    return {"status": "ok"}
```

How to test:
- `uv run pytest tests/test_cryo_lens.py tests/test_hypotheses.py`
