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

echo "Pegá el token que imprimió 'rclone authorize' en la PC"
echo "(la línea completa que empieza con {\"access_token\":...). No se ve al pegar."
read -rsp "Token: " TOKEN; echo
case "$TOKEN" in
  "{"*"access_token"*"}") ;;
  *) unset TOKEN; echo "No parece el token de rclone. No se guardó nada."; exit 1 ;;
esac

rclone config create gdrive drive scope drive.file token "$TOKEN" --non-interactive >/dev/null
unset TOKEN
chmod 600 ~/.config/rclone/rclone.conf

rclone mkdir gdrive:red-backups
rclone lsd gdrive: | grep -q red-backups && echo "OK: rclone conectado a Google Drive (carpeta red-backups)."
