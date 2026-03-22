# Frontend Data

- Purpose: typed client-side contracts and data loaders only.
- Keep fetch and merge logic here, not inside page components.
- Preserve backend-owned writes; browser data modules should stay read-focused.
- When stream or dataset contracts change, update both the client and the matching server route.
