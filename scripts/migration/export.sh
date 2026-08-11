#!/usr/bin/env bash
# Omnicraft migration - EXPORT
#
# Dumps every application table to CSV in dependency order, plus a row-count
# baseline used later by validate.sql.
#
# Run against the SOURCE database. On Lovable Cloud the PG* env vars are already
# set inside the agent sandbox; elsewhere export SOURCE_DB_URL first:
#   SOURCE_DB_URL="postgresql://..." ./scripts/migration/export.sh
#
# Output: ./migration-data/*.csv  and  ./migration-data/_counts.csv

set -euo pipefail

OUT="${OUT_DIR:-./migration-data}"
PSQL=(psql)
[ -n "${SOURCE_DB_URL:-}" ] && PSQL=(psql "$SOURCE_DB_URL")

mkdir -p "$OUT"

TABLES=$(node -e "console.log(require('./scripts/migration/manifest.json').tables.map(t=>t.name).join(' '))")

: > "$OUT/_counts.csv"
echo "table_name,row_count" >> "$OUT/_counts.csv"

for t in $TABLES; do
  echo "exporting $t ..."
  "${PSQL[@]}" -q -c "\copy (SELECT * FROM public.$t) TO '$OUT/$t.csv' WITH (FORMAT csv, HEADER true)"
  n=$("${PSQL[@]}" -tAc "SELECT count(*) FROM public.$t")
  echo "$t,$n" >> "$OUT/_counts.csv"
done

echo
echo "Export complete -> $OUT"
cat "$OUT/_counts.csv"
