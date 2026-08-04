#!/usr/bin/env bash
# Omnicraft migration - ONE-SHOT IMPORT into your own Supabase project.
#
#   export TARGET_DB_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
#   ./scripts/migration/run-import.sh
#
# Expects ./migration-data/*.csv (from export.sh or the pre-built export bundle)
# and that the schema has already been applied.

set -euo pipefail

: "${TARGET_DB_URL:?Set TARGET_DB_URL to your Supabase connection string}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

[ -d migration-data ] || { echo "migration-data/ not found - run export.sh first"; exit 1; }

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

step "1/4 Applying schema (idempotent)"
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f docs/migration/omnicraft_full_schema.sql

step "2/4 Importing auth users (preserving UUIDs)"
if [ -f migration-data/auth_users.sql ]; then
  psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f migration-data/auth_users.sql
else
  echo "SKIPPED - no migration-data/auth_users.sql. See AUTH_USERS.md (re-signup flow)."
fi

step "3/4 Importing application data"
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f scripts/migration/import.sql

step "4/4 Validating"
psql "$TARGET_DB_URL" -f scripts/migration/validate.sql

printf '\n\033[1mDone.\033[0m Review the MISMATCH rows and dangling references above.\n'
