#!/usr/bin/env bash
# ======================================================
# Backup de PRD en el servidor: restic (cifrado en el host) → Google Drive vía
# rclone (cuenta de Google dedicada, permiso drive.file).
#
# Qué guarda: dump de la base de RED, dump de la base de n8n (workflows y
# credenciales cifradas) y los env files (sin ellos no se reconstruye el host:
# contraseñas de las bases y N8N_ENCRYPTION_KEY). Todo viaja cifrado por restic;
# la clave (RESTIC_PASSWORD) está en /srv/red/secretos y en el gestor de
# contraseñas del titular. Sin esa clave los backups no se pueden abrir.
#
# Uso:  backup.sh [tag]      (tag por defecto: manual; el timer usa: diario)
# Lo corre el timer de systemd red-backup.timer todas las noches.
# ======================================================
set -euo pipefail
umask 077

REPO_DIR=/srv/red/repo
SECRETOS=/srv/red/secretos
STAGE=/srv/red/backup-stage
export RESTIC_REPOSITORY="rclone:gdrive:red-backups"
export RESTIC_PASSWORD_FILE="$SECRETOS/restic_password"
TAG="${1:-manual}"

log() { echo "[$(date '+%F %T')] $*"; }

cd "$REPO_DIR"
set -a; . infra/.env.prd; . infra/.env.n8n; set +a

# Ruta fija (no mktemp): restic compara contra el snapshot anterior por ruta, y
# así cada backup sube solo lo que cambió.
rm -rf "$STAGE"; install -d -m 700 "$STAGE"
trap 'rm -rf "$STAGE"' EXIT

log "Dump de la base de RED (${POSTGRES_DB})"
docker exec "${COMPOSE_PROJECT_NAME}_postgres" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$STAGE/red_prd.dump"

log "Dump de la base de n8n (${N8N_DB_NAME})"
docker exec "${COMPOSE_PROJECT_NAME}_postgres_n8n" pg_dump -U "$N8N_DB_USER" -d "$N8N_DB_NAME" -Fc > "$STAGE/n8n.dump"

cp infra/.env.prd infra/.env.n8n "$STAGE/"
git -C "$REPO_DIR" rev-parse --short HEAD > "$STAGE/commit_repo.txt"
echo "$RED_TAG" > "$STAGE/red_tag.txt"

log "Subiendo a ${RESTIC_REPOSITORY} (tag: ${TAG})"
restic backup --quiet --host "$(hostname)" --tag "$TAG" "$STAGE"

# 7 diarios, 4 semanales, 6 mensuales. --prune libera el espacio en Drive.
log "Retención"
restic forget --quiet --host "$(hostname)" --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune

# Los domingos, además de la estructura, se relee una parte de los datos: un
# backup que no se puede leer no es un backup.
if [ "$(date +%u)" = "7" ]; then
  log "Chequeo semanal (estructura + 1/10 de los datos)"
  restic check --quiet --read-data-subset=1/10
fi

log "OK. Último snapshot:"
restic snapshots --latest 1 --compact | tail -n +3 | head -n 1
