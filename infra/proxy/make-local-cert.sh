#!/usr/bin/env bash
# ======================================================
# Genera el certificado self-signed que Traefik usa en LOCAL.
#
# Sirve para ensayar la forma de producción completa (HTTPS, cookie Secure,
# redirección de :80) sin tener todavía dominio ni host contratado. El navegador
# va a advertir por el emisor desconocido: es esperado y correcto.
#
# En el servidor esto se reemplaza por un certificado real de Let's Encrypt
# emitido por DNS-01, que no requiere exponer ningún puerto.
#
# Uso:  infra/proxy/make-local-cert.sh [host]        (host por defecto: red.localhost)
# ======================================================
set -e

HOST="${1:-red.localhost}"
DIR="$(cd "$(dirname "$0")" && pwd)/certs"

mkdir -p "$DIR"

openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
  -keyout "$DIR/local.key" \
  -out "$DIR/local.crt" \
  -subj "/CN=${HOST}" \
  -addext "subjectAltName=DNS:${HOST},DNS:*.${HOST},DNS:localhost,IP:127.0.0.1" \
  2>/dev/null

chmod 600 "$DIR/local.key"
chmod 644 "$DIR/local.crt"

echo "Certificado local generado en infra/proxy/certs/ para: ${HOST}"
echo "  válido hasta: $(openssl x509 -enddate -noout -in "$DIR/local.crt" | cut -d= -f2)"
echo ""
echo "Falta que ${HOST} resuelva a 127.0.0.1. Los navegadores resuelven"
echo "*.localhost solo; para otros hosts, agregar a /etc/hosts:"
echo "  127.0.0.1  ${HOST}"
