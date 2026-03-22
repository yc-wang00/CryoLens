# Services

Purpose:
- house CryoSight domain logic, dataset normalization, and persistence helpers.

Current entry points:
- `cryo_lens.py`: live cryoLens normalization
- `hypotheses.py`: saved hypothesis persistence
- `ingestion.py`: PDF ingestion flow
- `knowledge_queries.py`: local Postgres query helpers

Minimal example:
```py
from sqlalchemy.ext.asyncio import AsyncSession

async def list_records(session: AsyncSession) -> list[str]:
    return []
```

How to test:
- `uv run pytest tests/test_cryo_lens.py tests/test_hypotheses.py`
