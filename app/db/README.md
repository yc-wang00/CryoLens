# DB Layer

Purpose:
- define CryoSight persistence models and database session helpers.

Key files:
- `models.py`
- `session.py`
- `base.py`

Minimal example:
```py
from app.db.models import Hypothesis
from app.db.session import AsyncSessionLocal
```

How to test:
- `uv run alembic upgrade head`
- `uv run pytest`
