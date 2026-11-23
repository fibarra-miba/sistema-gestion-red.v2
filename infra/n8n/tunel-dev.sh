#!/usr/bin/env bash
# Túnel temporal para el webhook de Telegram en el n8n de DEV (docs/asistente.md §6).
#
# La VM de DEV no recibe conexiones de afuera y el Telegram Trigger necesita una URL
# pública HTTPS. Esto abre un túnel rápido de cloudflared (URL aleatoria, sin
# cuenta), la escribe como WEBHOOK_URL en infra/.env.n8n y recrea n8n para que la
# use. Cada vez que se reinicia el túnel cambia la URL: hay que volver a correrlo y
# reactivar el workflow (al activarse, n8n registra el webhook nuevo en Telegram).
#
# Uso (desde la raíz del repo, en la VM):
#   infra/n8n/tunel-dev.sh          abre el túnel y deja n8n apuntando a él
#   infra/n8n/tunel-dev.sh cerrar   corta el túnel
#
# Solo para DEV: el túnel publica todo n8n (el editor pide login). Cerrarlo al
# terminar de probar.
set -euo pipefail

cd "$(dirname "$0")/../.."
ENV_N8N="infra/.env.n8n"
PIDFILE="infra/n8n/.tunel.pid"
LOG="infra/n8n/.tunel.log"
PUERTO="$(grep -E '^N8N_PORT=' "$ENV_N8N" | cut -d= -f2)"

cerrar() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    kill "$(cat "$PIDFILE")" && echo "Túnel cerrado."
  else
    echo "No había un túnel abierto."
  fi
  rm -f "$PIDFILE"
}

if [ "${1:-}" = "cerrar" ]; then
  cerrar
  exit 0
fi

[ "$(grep -E '^RED_MODO=' infra/.env.prd 2>/dev/null | cut -d= -f2)" = "servidor" ] \
  && { echo "Esto es solo para DEV."; exit 1; }
command -v cloudflared >/dev/null || { echo "Falta cloudflared (~/.local/bin)."; exit 1; }

cerrar >/dev/null
nohup cloudflared tunnel --no-autoupdate --url "http://localhost:${PUERTO}" >"$LOG" 2>&1 &
echo $! >"$PIDFILE"

URL=""
for _ in $(seq 1 30); do
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done
[ -n "$URL" ] || { echo "cloudflared no dio una URL (ver $LOG)."; cerrar; exit 1; }

sed -i "s|^WEBHOOK_URL=.*|WEBHOOK_URL=${URL}/|" "$ENV_N8N"
echo "Túnel: $URL"
./red up-n8n </dev/null >/dev/null
echo "n8n recreado con WEBHOOK_URL=${URL}/ — reactivá el workflow para registrar el webhook."
