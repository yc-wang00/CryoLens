# API Routes

- Purpose: thin FastAPI route layer over services and schemas.
- Keep routes declarative: validation, dependency wiring, response shape.
- Push normalization and persistence logic into `app/services/`.
- When adding a route, also update `app/main.py` and add route tests.
