# Services

- Purpose: keep business logic, normalization, and persistence out of routes.
- Services may call Supabase, local Postgres, or pure transforms.
- Prefer small exported functions with explicit inputs and outputs.
- Route code should not duplicate service logic.
