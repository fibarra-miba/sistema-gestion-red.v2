#!/usr/bin/env bash

set -e

COMPOSE_FILE="infra/docker-compose.yml"
COMPOSE_N8N_FILE="infra/docker-compose.n8n.yml"
ENV_N8N_FILE="infra/.env.n8n"

compose_core() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

compose_with_n8n() {
  docker compose \
    -f "$COMPOSE_FILE" \
    -f "$COMPOSE_N8N_FILE" \
    --env-file "$ENV_N8N_FILE" \
    "$@"
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

case "$1" in
  up)
    echo "Levantando Sistema RED..."
    compose_core up -d --build
    echo "Sistema RED levantado."
    echo "Frontend: http://localhost:5173"
    echo "API:      http://localhost:8000"
    echo "Swagger:  http://localhost:8000/docs"
    echo "pgAdmin:  http://localhost:5050"
    ;;

  up-n8n)
    ensure_n8n_env
    echo "Levantando Sistema RED + n8n..."
    compose_with_n8n up -d --build
    echo "Sistema RED + n8n levantado."
    echo "Frontend: http://localhost:5173"
    echo "API:      http://localhost:8000"
    echo "Swagger:  http://localhost:8000/docs"
    echo "pgAdmin:  http://localhost:5050"
    echo "n8n:      http://localhost:5678"
    ;;

  down)
    echo "Deteniendo Sistema RED..."
    compose_core down
    echo "Sistema RED detenido."
    ;;

  down-n8n)
    ensure_n8n_env
    echo "Deteniendo Sistema RED + n8n..."
    compose_with_n8n down
    echo "Sistema RED + n8n detenido."
    echo "Los volúmenes se conservaron."
    ;;

  restart)
    echo "Reiniciando Sistema RED..."
    compose_core restart
    echo "Sistema RED reiniciado."
    ;;

  restart-n8n)
    ensure_n8n_env
    echo "Reiniciando n8n sin borrar datos..."
    compose_with_n8n restart n8n
    echo "n8n reiniciado."
    echo "Los workflows, credenciales y volúmenes se conservaron."
    ;;

  logs)
    compose_core logs -f
    ;;

  logs-api)
    compose_core logs -f api
    ;;

  logs-front)
    compose_core logs -f frontend
    ;;

  logs-n8n)
    ensure_n8n_env
    compose_with_n8n logs -f n8n
    ;;

  logs-postgres-n8n)
    ensure_n8n_env
    compose_with_n8n logs -f postgres_n8n
    ;;

  ps)
    compose_core ps
    ;;

  ps-n8n)
    ensure_n8n_env
    compose_with_n8n ps
    ;;

  reset)
    echo "ATENCIÓN: esto borra contenedores y volúmenes del core de Sistema RED."
    echo ""
    echo "Esto puede borrar la base PostgreSQL principal del proyecto."
    echo "No afecta n8n si fue levantado con el compose opcional y volúmenes separados."
    echo ""
    read -r -p "Confirmar reset del core? [s/N]: " confirm

    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      compose_core down -v --remove-orphans
      echo "Reset del core completo."
    else
      echo "Reset cancelado."
    fi
    ;;

  reset-n8n)
    ensure_n8n_env
    echo "ATENCIÓN: esto borra contenedores y VOLÚMENES de n8n."
    echo ""
    echo "Esto puede borrar:"
    echo "  - workflows creados en n8n"
    echo "  - credenciales guardadas"
    echo "  - historial de ejecuciones"
    echo "  - configuración interna de n8n"
    echo "  - base PostgreSQL interna de n8n"
    echo ""
    echo "Uso normal recomendado:"
    echo "  ./red restart-n8n"
    echo ""
    echo "Usá reset-n8n solo si querés dejar n8n desde cero."
    echo ""
    read -r -p "Confirmar reset destructivo de n8n? [s/N]: " confirm

    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      read -r -p "Última confirmación. Escribí RESET-N8N para continuar: " confirm_text

      if [ "$confirm_text" = "RESET-N8N" ]; then
        compose_with_n8n down -v --remove-orphans
        echo "Reset de n8n completo."
      else
        echo "Reset de n8n cancelado."
      fi
    else
      echo "Reset de n8n cancelado."
    fi
    ;;

  rebuild)
    echo "Reconstruyendo Sistema RED sin cache..."
    compose_core down --remove-orphans
    compose_core build --no-cache
    compose_core up -d
    echo "Rebuild completo."
    echo "Frontend: http://localhost:5173"
    echo "API:      http://localhost:8000"
    echo "Swagger:  http://localhost:8000/docs"
    echo "pgAdmin:  http://localhost:5050"
    ;;

  rebuild-n8n)
    ensure_n8n_env
    echo "Reconstruyendo Sistema RED + n8n sin cache..."
    echo "Los volúmenes se conservarán."
    compose_with_n8n down --remove-orphans
    compose_with_n8n build --no-cache
    compose_with_n8n up -d
    echo "Rebuild completo."
    echo "Frontend: http://localhost:5173"
    echo "API:      http://localhost:8000"
    echo "Swagger:  http://localhost:8000/docs"
    echo "pgAdmin:  http://localhost:5050"
    echo "n8n:      http://localhost:5678"
    ;;

  nuke)
    echo "ATENCIÓN: esto borra contenedores, volúmenes e imágenes del core de Sistema RED."
    echo ""
    echo "No afecta n8n si fue levantado con el compose opcional y volúmenes separados."
    echo ""
    read -r -p "Confirmar limpieza nuclear del core? [s/N]: " confirm

    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      compose_core down --rmi all -v --remove-orphans
      echo "Nuke del core completo."
    else
      echo "Nuke cancelado."
    fi
    ;;

  nuke-n8n)
    ensure_n8n_env
    echo "ATENCIÓN: esto borra contenedores, volúmenes e imágenes de Sistema RED + n8n."
    echo ""
    echo "Esto puede borrar:"
    echo "  - base principal del core"
    echo "  - workflows de n8n"
    echo "  - credenciales de n8n"
    echo "  - historial de ejecuciones de n8n"
    echo "  - imágenes locales construidas o descargadas para este stack"
    echo ""
    read -r -p "Confirmar limpieza nuclear total con n8n? [s/N]: " confirm

    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      read -r -p "Última confirmación. Escribí NUKE-N8N para continuar: " confirm_text

      if [ "$confirm_text" = "NUKE-N8N" ]; then
        compose_with_n8n down --rmi all -v --remove-orphans
        echo "Nuke con n8n completo."
      else
        echo "Nuke con n8n cancelado."
      fi
    else
      echo "Nuke cancelado."
    fi
    ;;

  test)
    # La suite recrea el schema (destructivo), así que NUNCA debe correr contra
    # la base real (mi_base). Se usa una base de test dedicada (mi_base_test):
    # se crea si no existe y se le pasa a pytest vía DATABASE_URL.
    echo "Asegurando base de test (mi_base_test)..."
    compose_core exec -T postgres psql -U admin -d postgres -tc \
      "SELECT 1 FROM pg_database WHERE datname='mi_base_test'" | grep -q 1 \
      || compose_core exec -T postgres psql -U admin -d postgres \
           -c "CREATE DATABASE mi_base_test OWNER admin;"
    echo "Corriendo suite contra mi_base_test..."
    compose_core exec api sh -c 'DATABASE_URL="$DATABASE_URL_TEST" pytest -v'
    ;;

  open)
    xdg-open "http://localhost:5173" >/dev/null 2>&1 || echo "Abrí: http://localhost:5173"
    ;;

  open-api)
    xdg-open "http://localhost:8000/docs" >/dev/null 2>&1 || echo "Abrí: http://localhost:8000/docs"
    ;;

  open-n8n)
    xdg-open "http://localhost:5678" >/dev/null 2>&1 || echo "Abrí: http://localhost:5678"
    ;;

  help|--help|-h|"")
    echo "Sistema RED - Launcher"
    echo ""
    echo "Uso:"
    echo "  ./red up                  Levanta el core de Sistema RED"
    echo "  ./red up-n8n              Levanta Sistema RED + addon n8n"
    echo ""
    echo "  ./red down                Detiene el core de Sistema RED"
    echo "  ./red down-n8n            Detiene Sistema RED + n8n sin borrar volúmenes"
    echo ""
    echo "  ./red restart             Reinicia los servicios del core sin borrar datos"
    echo "  ./red restart-n8n         Reinicia n8n sin borrar workflows ni credenciales"
    echo ""
    echo "  ./red logs                Muestra logs en vivo del core"
    echo "  ./red logs-api            Muestra logs en vivo de la API"
    echo "  ./red logs-front          Muestra logs en vivo del frontend"
    echo "  ./red logs-n8n            Muestra logs en vivo de n8n"
    echo "  ./red logs-postgres-n8n   Muestra logs en vivo del PostgreSQL de n8n"
    echo ""
    echo "  ./red ps                  Muestra contenedores del core"
    echo "  ./red ps-n8n              Muestra contenedores del core + n8n"
    echo ""
    echo "  ./red reset               Borra contenedores y volúmenes del core"
    echo "  ./red reset-n8n           Borra contenedores y volúmenes de n8n"
    echo "                            ATENCIÓN: puede borrar workflows y credenciales"
    echo ""
    echo "  ./red rebuild             Reconstruye el core sin cache sin borrar imágenes externas"
    echo "  ./red rebuild-n8n         Reconstruye core + n8n sin cache conservando volúmenes"
    echo ""
    echo "  ./red nuke                Borra contenedores, volúmenes e imágenes del core"
    echo "  ./red nuke-n8n            Borra contenedores, volúmenes e imágenes de core + n8n"
    echo "                            ATENCIÓN: puede borrar workflows y credenciales"
    echo ""
    echo "  ./red test                Ejecuta pytest en la API"
    echo ""
    echo "  ./red open                Abre el frontend"
    echo "  ./red open-api            Abre Swagger"
    echo "  ./red open-n8n            Abre n8n"
    echo ""
    echo "URLs:"
    echo "  Frontend: http://localhost:5173"
    echo "  API:      http://localhost:8000"
    echo "  Swagger:  http://localhost:8000/docs"
    echo "  pgAdmin:  http://localhost:5050"
    echo "  n8n:      http://localhost:5678"
    echo ""
    echo "Notas n8n:"
    echo "  - n8n es un addon opcional."
    echo "  - n8n no gobierna reglas de negocio."
    echo "  - Los workflows y credenciales viven en los volúmenes de n8n."
    echo "  - Para reiniciar n8n sin perder datos, usar:"
    echo "      ./red restart-n8n"
    echo "  - Para resetear n8n desde cero, usar:"
    echo "      ./red reset-n8n"
    ;;

  *)
    echo "Comando desconocido: $1"
    echo "Usá: ./red help"
    exit 1
    ;;
esac
