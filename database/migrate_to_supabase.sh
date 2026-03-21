#!/usr/bin/env bash
#
# Migrate local CryoLens database to Supabase.
#
# Re-runnable: drops and recreates all tables in the public schema.
# Safe because Supabase MCP server is read-only — no data originates there.
#
# Usage:
#   ./database/migrate_to_supabase.sh "postgresql://postgres.[ref]:[pass]@aws-[n]-[region].pooler.supabase.com:5432/postgres"
#
# Or set the env var:
#   export SUPABASE_DB_URL="postgresql://..."
#   ./database/migrate_to_supabase.sh

set -euo pipefail

SUPABASE_URL="${1:-${SUPABASE_DB_URL:-}}"

if [ -z "$SUPABASE_URL" ]; then
    echo "Usage: $0 <supabase-connection-string>"
    echo "  or set SUPABASE_DB_URL env var"
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
echo "=== Step 2: Restoring to Supabase ==="
# Use session mode pooler (port 5432). Supabase won't let us drop/recreate
# the public schema, so those errors are expected and harmless.
psql "$SUPABASE_URL" -f "$DUMP_FILE" 2>&1 | grep -v "^psql.*DROP SCHEMA\|^psql.*already exists" || true

echo ""
echo "=== Step 3: Verifying ==="
psql "$SUPABASE_URL" -c "
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
# Swap to pooler URL (port 6543) for the MCP server
POOLER_URL=$(echo "$SUPABASE_URL" | sed 's/:5432/:6543/')
echo "  export CRYOLENS_DB_URL=\"${POOLER_URL}\""

rm -f "$DUMP_FILE"
