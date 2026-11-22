#!/usr/bin/env bash
# Carga los dos secretos del despliegue SIN que pasen por chat, git ni la PC:
# se tipean (ocultos) en esta sesión SSH.
set -euo pipefail
umask 077
F=/srv/red/secretos/cf_dns_api_token

echo "== 1/2 Token de Cloudflare (solo editar DNS de fiba-soluciones.com.ar)"
read -rsp "Pegalo (no se ve) y Enter: " T; echo
[ -n "$T" ] || { echo "Vacío: no se guardó nada."; exit 1; }
estado=$(curl -fsS -H "Authorization: Bearer $T" https://api.cloudflare.com/client/v4/user/tokens/verify \
  | grep -o "\"status\":\"[a-z]*\"" | head -n 1 || true)
if [ "$estado" != "\"status\":\"active\"" ]; then
  unset T; echo "Cloudflare no lo reconoce como token activo ($estado). No se guardó."; exit 1
fi
printf "%s" "$T" > "$F"; unset T; chmod 600 "$F"
echo "Token válido y guardado en $F"

echo
echo "== 2/2 PAT clásico de GitHub con solo read:packages (login a GHCR)"
echo "Usuario: fibarra-miba. En Password pegá el PAT (no se ve)."
docker login ghcr.io -u fibarra-miba
chmod 600 ~/.docker/config.json
echo
echo "Listo. Ya podés cerrar esta sesión."
