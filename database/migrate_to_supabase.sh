#!/usr/bin/env bash
#
# Migrate local CryoLens database to a remote Postgres instance (Railway, etc).
#
# Re-runnable: drops and recreates all tables in the public schema.
#
# Usage:
#   ./database/migrate_to_supabase.sh "postgresql://user:pass@host:port/db"
#
# Or set the env var:
#   export REMOTE_DB_URL="postgresql://..."
#   ./database/migrate_to_supabase.sh

set -euo pipefail

REMOTE_URL="${1:-${REMOTE_DB_URL:-}}"

if [ -z "$REMOTE_URL" ]; then
    echo "Usage: $0 <connection-string>"
    echo "  or set REMOTE_DB_URL env var"
    exit 1
fi

LOCAL_DB="cryosight"
DUMP_FILE="/tmp/cryolens_dump.sql"

echo "=== Step 1: Dumping local database '${LOCAL_DB}' ==="
pg_dump "$LOCAL_DB" \
    --schema=public \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --no-comments \
    --format=plain \
    > "$DUMP_FILE"

echo "  Dump size: $(du -h "$DUMP_FILE" | cut -f1)"
echo "  Tables: $(grep -c '^CREATE TABLE' "$DUMP_FILE" || echo 0)"

echo ""
echo "=== Step 2: Restoring to remote ==="
psql "$REMOTE_URL" -f "$DUMP_FILE" 2>&1 | grep -v "^psql.*DROP SCHEMA\|^psql.*already exists" || true

echo ""
echo "=== Step 3: Verifying ==="
psql "$REMOTE_URL" -c "
    SELECT 'papers' AS tbl, COUNT(*) AS n FROM papers
    UNION ALL SELECT 'compounds', COUNT(*) FROM compounds
    UNION ALL SELECT 'findings', COUNT(*) FROM findings
    UNION ALL SELECT 'measurements', COUNT(*) FROM measurements
    UNION ALL SELECT 'formulations', COUNT(*) FROM formulations
    UNION ALL SELECT 'protocols', COUNT(*) FROM protocols
    ORDER BY tbl;
"

echo ""
echo "=== Migration complete ==="
echo "Set this in your environment:"
echo "  export CRYOLENS_DB_URL=\"${REMOTE_URL}\""

rm -f "$DUMP_FILE"
