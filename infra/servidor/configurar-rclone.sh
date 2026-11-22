#!/usr/bin/env bash
# ======================================================
# Conecta rclone del servidor con la cuenta de Google DEDICADA a backups.
#
# El servidor no tiene navegador: la autorización se hace en la PC con
#   rclone authorize drive <config base64 con scope drive.file>
# (el comando exacto está en docs/servidor.md §7), que imprime un token JSON.
# Ese token se pega acá, oculto. Nunca por chat ni git.
#
# Permiso drive.file: rclone solo ve los archivos que él mismo crea, no el Drive
# entero de la cuenta.
# ======================================================
set -euo pipefail
umask 077

echo "Pegá lo que imprimió 'rclone authorize' en la PC, entre '--->' y '<---End paste'."
echo "No se ve al pegar."
read -rsp "Token: " ENTRADA; echo

# Dos formatos posibles según la versión de rclone de la PC:
# - JSON del token ({"access_token":...}), versiones viejas;
# - base64 (sin padding) de un mapa de configuración cuyo campo "token" es ese
#   JSON (rclone >= 1.56 cuando se llama con la config en base64, como acá).
token_json=$(ENTRADA="$ENTRADA" python3 - <<'PY'
import base64, json, os, sys
e = os.environ["ENTRADA"].strip()
def es_token(s):
    try:
        return "access_token" in json.loads(s)
    except Exception:
        return False
if es_token(e):
    print(e); sys.exit(0)
try:
    m = json.loads(base64.urlsafe_b64decode(e + "=" * (-len(e) % 4)))
    t = m.get("token", "") if isinstance(m, dict) else ""
    if es_token(t):
        print(t); sys.exit(0)
except Exception:
    pass
sys.exit(1)
PY
) || { unset ENTRADA; echo "No se reconoce como token de rclone. No se guardó nada."; exit 1; }
unset ENTRADA

rclone config create gdrive drive scope drive.file token "$token_json" --non-interactive >/dev/null
unset token_json
chmod 600 ~/.config/rclone/rclone.conf

rclone mkdir gdrive:red-backups
rclone lsd gdrive: | grep -q red-backups && echo "OK: rclone conectado a Google Drive (carpeta red-backups)."
