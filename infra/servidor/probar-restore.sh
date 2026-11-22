#!/usr/bin/env bash
# ======================================================
# Prueba de restauración REAL del último backup, sin tocar la base de PRD:
# baja el snapshot de Google Drive, lo restaura en una base descartable
# (red_restore_prueba, en el mismo Postgres) y compara la cantidad de filas de
# cada tabla contra la base viva. Después borra todo lo que creó.
#
# Uso:  probar-restore.sh            Repetirla cada tanto (y siempre después de
#                                    cambiar algo del backup).
# ======================================================
set -euo pipefail
umask 077

REPO_DIR=/srv/red/repo
export RESTIC_REPOSITORY="rclone:gdrive:red-backups"
export RESTIC_PASSWORD_FILE=/srv/red/secretos/restic_password
DEST=/srv/red/restore-prueba
DB_PRUEBA=red_restore_prueba

cd "$REPO_DIR"
set -a; . infra/.env.prd; set +a
PG="${COMPOSE_PROJECT_NAME}_postgres"
psql_q() { docker exec -i "$PG" psql -U "$POSTGRES_USER" -v ON_ERROR_STOP=1 -tA "$@"; }

limpiar() {
  rm -rf "$DEST"
  psql_q -d postgres -c "DROP DATABASE IF EXISTS ${DB_PRUEBA};" >/dev/null 2>&1 || true
}
trap limpiar EXIT
limpiar

echo "== Snapshot a restaurar"
restic snapshots --latest 1 --compact | grep -E "^[0-9a-f]{8} " | tail -n 1
restic restore latest --target "$DEST" --quiet
STAGE=$(find "$DEST" -type d -name backup-stage | head -n 1)
ls -lA "$STAGE"

echo "== Restaurando red_prd.dump en ${DB_PRUEBA}"
psql_q -d postgres -c "CREATE DATABASE ${DB_PRUEBA} OWNER ${POSTGRES_USER};" >/dev/null
docker exec -i "$PG" pg_restore -U "$POSTGRES_USER" -d "$DB_PRUEBA" --no-owner < "$STAGE/red_prd.dump"

# Filas por tabla (exactas, no estimadas) en public y red_ai.
contar() {
  psql_q -d "$1" -c "
    SELECT format('SELECT %L || ''|'' || count(*) FROM %I.%I;', n.nspname || '.' || c.relname, n.nspname, c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname IN ('public', 'red_ai')
    ORDER BY 1" | psql_q -d "$1"
}
contar "$POSTGRES_DB" > "$DEST/vivo.txt"
contar "$DB_PRUEBA" > "$DEST/restaurado.txt"

tablas=$(wc -l < "$DEST/vivo.txt")
if diff -q "$DEST/vivo.txt" "$DEST/restaurado.txt" >/dev/null; then
  echo "OK: ${tablas} tablas, mismas filas que la base viva."
else
  echo "DIFERENCIAS (puede ser normal si hubo escrituras después del backup):"
  diff "$DEST/vivo.txt" "$DEST/restaurado.txt" || true
fi

echo "== n8n.dump legible"
docker exec -i "$PG" pg_restore --list < "$STAGE/n8n.dump" | grep -c "TABLE DATA" | sed 's/^/tablas con datos: /'
echo "== env files presentes: $(ls -A "$STAGE" | grep -c '^\.env')"
