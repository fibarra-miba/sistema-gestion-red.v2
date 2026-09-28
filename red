#!/usr/bin/env bash

set -e

# ======================================================
# Sistema RED - Launcher (multi-ambiente)
#
# Uso:  ./red [dev|prd] <comando>
# Si se omite el ambiente, se asume dev (retrocompat: ./red up == ./red dev up).
#
# Aislamiento: cada ambiente tiene su propio env file, su COMPOSE_PROJECT_NAME,
# sus volúmenes y sus puertos. DEV corre con hot reload (override dev); PRD corre
# de imágenes construidas (código congelado).
# ======================================================

COMPOSE_FILE="infra/docker-compose.yml"
COMPOSE_DEV_FILE="infra/docker-compose.dev.yml"
COMPOSE_N8N_FILE="infra/docker-compose.n8n.yml"
ENV_N8N_FILE="infra/.env.n8n"

# --- Selección de ambiente (primer argumento opcional) ---
ENV="dev"
case "$1" in
  dev|prd) ENV="$1"; shift ;;
esac
ENV_FILE="infra/.env.${ENV}"

ensure_env() {
  if [ ! -f "$ENV_FILE" ]; then
    echo "No existe $ENV_FILE"
    echo ""
    echo "Crealo a partir de la plantilla:"
    echo "  cp infra/.env.${ENV}.example $ENV_FILE"
    [ "$ENV" = "prd" ] && echo "  # y reemplazá los secretos (passwords)"
    exit 1
  fi
}

ensure_n8n_env() {
  if [ ! -f "$ENV_N8N_FILE" ]; then
    echo "No existe $ENV_N8N_FILE"
    echo ""
    echo "Crealo ejecutando:"
    echo "  cp infra/.env.n8n.example infra/.env.n8n"
    echo ""
    echo "Luego revisá las variables, especialmente:"
    echo "  N8N_ENCRYPTION_KEY"
    exit 1
  fi
}

# Stack core del ambiente seleccionado. DEV suma el override de hot reload.
core_compose() {
  local files=(-f "$COMPOSE_FILE")
  [ "$ENV" = "dev" ] && files+=(-f "$COMPOSE_DEV_FILE")
  docker compose --env-file "$ENV_FILE" "${files[@]}" "$@"
}

# Core + addon n8n.
n8n_compose() {
  local files=(-f "$COMPOSE_FILE")
  [ "$ENV" = "dev" ] && files+=(-f "$COMPOSE_DEV_FILE")
  files+=(-f "$COMPOSE_N8N_FILE")
  docker compose --env-file "$ENV_FILE" --env-file "$ENV_N8N_FILE" "${files[@]}" "$@"
}

print_urls() {
  ( set -a; . "$ENV_FILE"
    echo "Frontend: http://localhost:${FRONT_PORT}"
    echo "API:      http://localhost:${API_PORT}"
    echo "Swagger:  http://localhost:${API_PORT}/docs"
    echo "pgAdmin:  http://localhost:${PGADMIN_PORT}" )
}

case "$1" in
  up)
    ensure_env
    echo "[${ENV}] Levantando Sistema RED..."
    core_compose up -d --build
    echo "[${ENV}] Sistema RED levantado."
    print_urls
    ;;

  up-n8n)
    ensure_env
    ensure_n8n_env
    echo "[${ENV}] Levantando Sistema RED + n8n..."
    n8n_compose up -d --build
    echo "[${ENV}] Sistema RED + n8n levantado."
    print_urls
    ( set -a; . "$ENV_N8N_FILE"; echo "n8n:      http://localhost:${N8N_PORT}" )
    ;;

  build)
    ensure_env
    echo "[${ENV}] Construyendo imágenes (código congelado en el build)..."
    core_compose build
    echo "[${ENV}] Build completo. Promové con: ./red ${ENV} up"
    ;;

  down)
    ensure_env
    echo "[${ENV}] Deteniendo Sistema RED..."
    core_compose down
    echo "[${ENV}] Sistema RED detenido. Los volúmenes se conservaron."
    ;;

  down-n8n)
    ensure_env
    ensure_n8n_env
    echo "[${ENV}] Deteniendo Sistema RED + n8n..."
    n8n_compose down
    echo "[${ENV}] Detenido. Los volúmenes se conservaron."
    ;;

  restart)
    ensure_env
    echo "[${ENV}] Reiniciando Sistema RED..."
    core_compose restart
    echo "[${ENV}] Reiniciado."
    ;;

  restart-n8n)
    ensure_env
    ensure_n8n_env
    echo "[${ENV}] Reiniciando n8n sin borrar datos..."
    n8n_compose restart n8n
    echo "[${ENV}] n8n reiniciado. Workflows y credenciales conservados."
    ;;

  logs)        ensure_env; core_compose logs -f ;;
  logs-api)    ensure_env; core_compose logs -f api ;;
  logs-front)  ensure_env; core_compose logs -f frontend ;;
  logs-n8n)            ensure_env; ensure_n8n_env; n8n_compose logs -f n8n ;;
  logs-postgres-n8n)  ensure_env; ensure_n8n_env; n8n_compose logs -f postgres_n8n ;;

  ps)      ensure_env; core_compose ps ;;
  ps-n8n)  ensure_env; ensure_n8n_env; n8n_compose ps ;;

  reset)
    ensure_env
    echo "ATENCIÓN: esto borra contenedores y volúmenes del ambiente [${ENV}]."
    echo ""
    [ "$ENV" = "prd" ] && echo ">>> ESTÁS EN PRD: esto BORRA LA BASE CON DATOS REALES. <<<" && echo ""
    echo "No afecta n8n si fue levantado con volúmenes separados."
    echo ""
    read -r -p "Confirmar reset de [${ENV}]? [s/N]: " confirm
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      if [ "$ENV" = "prd" ]; then
        read -r -p "Última confirmación. Escribí RESET-PRD para continuar: " confirm_text
        [ "$confirm_text" != "RESET-PRD" ] && echo "Reset cancelado." && exit 0
      fi
      core_compose down -v --remove-orphans
      echo "[${ENV}] Reset completo."
    else
      echo "Reset cancelado."
    fi
    ;;

  reset-n8n)
    ensure_env
    ensure_n8n_env
    echo "ATENCIÓN: esto borra contenedores y VOLÚMENES de n8n."
    echo ""
    echo "Esto puede borrar workflows, credenciales, historial y la base interna de n8n."
    echo ""
    echo "Uso normal recomendado:  ./red ${ENV} restart-n8n"
    echo ""
    read -r -p "Confirmar reset destructivo de n8n? [s/N]: " confirm
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      read -r -p "Última confirmación. Escribí RESET-N8N para continuar: " confirm_text
      if [ "$confirm_text" = "RESET-N8N" ]; then
        n8n_compose down -v --remove-orphans
        echo "Reset de n8n completo."
      else
        echo "Reset de n8n cancelado."
      fi
    else
      echo "Reset de n8n cancelado."
    fi
    ;;

  rebuild)
    ensure_env
    echo "[${ENV}] Reconstruyendo sin cache..."
    core_compose down --remove-orphans
    core_compose build --no-cache
    core_compose up -d
    echo "[${ENV}] Rebuild completo."
    print_urls
    ;;

  nuke)
    ensure_env
    echo "ATENCIÓN: esto borra contenedores, volúmenes e imágenes del ambiente [${ENV}]."
    echo ""
    [ "$ENV" = "prd" ] && echo ">>> ESTÁS EN PRD: esto BORRA LA BASE CON DATOS REALES. <<<" && echo ""
    read -r -p "Confirmar limpieza nuclear de [${ENV}]? [s/N]: " confirm
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      if [ "$ENV" = "prd" ]; then
        read -r -p "Última confirmación. Escribí NUKE-PRD para continuar: " confirm_text
        [ "$confirm_text" != "NUKE-PRD" ] && echo "Nuke cancelado." && exit 0
      fi
      core_compose down --rmi all -v --remove-orphans
      echo "[${ENV}] Nuke completo."
    else
      echo "Nuke cancelado."
    fi
    ;;

  test)
    ensure_env
    # La suite recrea el schema (destructivo): corre SIEMPRE contra una base de
    # test dedicada (<POSTGRES_DB>_test), nunca contra la base real del ambiente.
    set -a; . "$ENV_FILE"; set +a
    TEST_DB="${POSTGRES_DB}_test"
    echo "[${ENV}] Asegurando base de test (${TEST_DB})..."
    core_compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -tc \
      "SELECT 1 FROM pg_database WHERE datname='${TEST_DB}'" | grep -q 1 \
      || core_compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres \
           -c "CREATE DATABASE ${TEST_DB} OWNER ${POSTGRES_USER};"
    echo "[${ENV}] Corriendo suite contra ${TEST_DB}..."
    core_compose exec api sh -c 'DATABASE_URL="$DATABASE_URL_TEST" pytest -v'
    ;;

  backup)
    ensure_env
    # Snapshot lógico de la base del ambiente (pg_dump -Fc, formato custom).
    # Uso: ./red [env] backup [tag]   (tag por defecto: manual; cron usa: auto)
    set -a; . "$ENV_FILE"; set +a
    TAG="${2:-manual}"
    DIR="infra/backups/${ENV}"
    mkdir -p "$DIR"
    TS=$(date +%Y%m%d_%H%M%S)
    FILE="${DIR}/red_${ENV}_${TS}_${TAG}.dump"
    echo "[${ENV}] Backup de '${POSTGRES_DB}' -> ${FILE}"
    if core_compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$FILE"; then
      # Retención: poda TODOS los backups (auto y manual) de más de 180 días.
      find "$DIR" -name "*.dump" -type f -mtime +180 -delete 2>/dev/null || true
      echo "[${ENV}] Backup OK ($(du -h "$FILE" | cut -f1)). Total en ${DIR}: $(ls -1 "$DIR"/*.dump 2>/dev/null | wc -l) archivos."
      echo "  Recordá copiar los backups a OTRO disco/ubicación: viven en el mismo disco que la base."
    else
      rm -f "$FILE"
      echo "[${ENV}] Backup FALLÓ (¿está levantado el ambiente? ./red ${ENV} up)"
      exit 1
    fi
    ;;

  backups)
    ensure_env
    DIR="infra/backups/${ENV}"
    echo "[${ENV}] Backups en ${DIR}:"
    ls -lh "$DIR"/*.dump 2>/dev/null || echo "  (todavía no hay backups)"
    ;;

  restore)
    ensure_env
    set -a; . "$ENV_FILE"; set +a
    FILE="$2"
    [ -z "$FILE" ] && echo "Uso: ./red ${ENV} restore <archivo.dump>" && echo "Ver disponibles: ./red ${ENV} backups" && exit 1
    [ ! -f "$FILE" ] && echo "No existe el archivo: $FILE" && exit 1
    echo "ATENCIÓN: restaurar SOBREESCRIBE la base de [${ENV}] con el contenido de:"
    echo "  $FILE"
    echo ""
    [ "$ENV" = "prd" ] && echo ">>> ESTÁS EN PRD: se reemplazan los DATOS REALES actuales. <<<" && echo ""
    read -r -p "Confirmar restore en [${ENV}]? [s/N]: " confirm
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      if [ "$ENV" = "prd" ]; then
        read -r -p "Última confirmación. Escribí RESTORE-PRD para continuar: " confirm_text
        [ "$confirm_text" != "RESTORE-PRD" ] && echo "Restore cancelado." && exit 0
      fi
      echo "[${ENV}] Restaurando..."
      core_compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --clean --if-exists --no-owner < "$FILE"
      echo "[${ENV}] Restore completo."
    else
      echo "Restore cancelado."
    fi
    ;;

  open)      ensure_env; ( set -a; . "$ENV_FILE"; xdg-open "http://localhost:${FRONT_PORT}" >/dev/null 2>&1 || echo "Abrí: http://localhost:${FRONT_PORT}" ) ;;
  open-api)  ensure_env; ( set -a; . "$ENV_FILE"; xdg-open "http://localhost:${API_PORT}/docs" >/dev/null 2>&1 || echo "Abrí: http://localhost:${API_PORT}/docs" ) ;;
  open-n8n)  ensure_n8n_env; ( set -a; . "$ENV_N8N_FILE"; xdg-open "http://localhost:${N8N_PORT}" >/dev/null 2>&1 || echo "Abrí: http://localhost:${N8N_PORT}" ) ;;

  help|--help|-h|"")
    echo "Sistema RED - Launcher (multi-ambiente)"
    echo ""
    echo "Uso:  ./red [dev|prd] <comando>     (sin ambiente = dev)"
    echo ""
    echo "  up                  Levanta el ambiente (build incluido)"
    echo "  up-n8n              Levanta el ambiente + addon n8n"
    echo "  build               Construye imágenes sin levantar (promoción a PRD)"
    echo ""
    echo "  down                Detiene el ambiente sin borrar volúmenes"
    echo "  down-n8n            Detiene ambiente + n8n sin borrar volúmenes"
    echo ""
    echo "  restart             Reinicia sin borrar datos"
    echo "  restart-n8n         Reinicia n8n sin borrar workflows ni credenciales"
    echo ""
    echo "  logs | logs-api | logs-front | logs-n8n | logs-postgres-n8n"
    echo "  ps | ps-n8n"
    echo ""
    echo "  reset               Borra contenedores y volúmenes del ambiente"
    echo "  reset-n8n           Borra contenedores y volúmenes de n8n"
    echo "  rebuild             Reconstruye sin cache"
    echo "  nuke                Borra contenedores, volúmenes e imágenes del ambiente"
    echo ""
    echo "  test                Ejecuta pytest contra <POSTGRES_DB>_test"
    echo ""
    echo "  backup [tag]        Snapshot de la base -> infra/backups/<env>/ (tag def: manual)"
    echo "  backups             Lista los backups del ambiente"
    echo "  restore <archivo>   Restaura la base desde un .dump (SOBREESCRIBE)"
    echo ""
    echo "  open | open-api | open-n8n"
    echo ""
    echo "Ejemplos:"
    echo "  ./red up                 # DEV (hot reload, datos demo)"
    echo "  ./red dev up             # idem"
    echo "  ./red prd build          # construye PRD desde el código actual"
    echo "  ./red prd up             # levanta PRD (código congelado, base limpia)"
    echo ""
    echo "Notas:"
    echo "  - DEV y PRD usan puertos, volúmenes y cookie de sesión distintos:"
    echo "    se pueden correr a la vez sin pisarse."
    echo "  - PRD nace sin seed demo (RED_SEED=0). Los datos reales los cargás vos."
    echo "  - n8n no gobierna reglas de negocio; sus workflows viven en su volumen."
    ;;

  *)
    echo "Comando desconocido: $1"
    echo "Usá: ./red help"
    exit 1
    ;;
esac
