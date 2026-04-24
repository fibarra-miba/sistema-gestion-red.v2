#!/usr/bin/env bash

set -e

COMPOSE_FILE="infra/docker-compose.yml"

case "$1" in
  up)
    echo "Levantando Sistema RED..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    echo "Sistema RED levantado."
    echo "Frontend: http://localhost:5173"
    echo "API:      http://localhost:8000"
    echo "Swagger:  http://localhost:8000/docs"
    echo "pgAdmin:  http://localhost:5050"
    ;;

  down)
    echo "Deteniendo Sistema RED..."
    docker compose -f "$COMPOSE_FILE" down
    echo "Sistema RED detenido."
    ;;

  logs)
    docker compose -f "$COMPOSE_FILE" logs -f
    ;;

  logs-api)
    docker compose -f "$COMPOSE_FILE" logs -f api
    ;;

  logs-front)
    docker compose -f "$COMPOSE_FILE" logs -f frontend
    ;;

  ps)
    docker compose -f "$COMPOSE_FILE" ps
    ;;

  reset)
    echo "ATENCIÓN: esto borra contenedores y volúmenes del proyecto."
    read -r -p "Confirmar reset total? [s/N]: " confirm

    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      docker compose -f "$COMPOSE_FILE" down -v --remove-orphans
      echo "Reset completo."
    else
      echo "Reset cancelado."
    fi
    ;;

  rebuild)
    echo "Reconstruyendo Sistema RED sin cache..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans
    docker compose -f "$COMPOSE_FILE" build --no-cache
    docker compose -f "$COMPOSE_FILE" up -d
    echo "Rebuild completo."
    echo "Frontend: http://localhost:5173"
    echo "API:      http://localhost:8000"
    echo "Swagger:  http://localhost:8000/docs"
    echo "pgAdmin:  http://localhost:5050"
    ;;
    
  nuke)
    echo "ATENCIÓN: esto borra contenedores, volúmenes e imágenes del proyecto."
    read -r -p "Confirmar limpieza nuclear total? [s/N]: " confirm

    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
      docker compose -f "$COMPOSE_FILE" down --rmi all -v --remove-orphans
      echo "Nuke completo."
    else
      echo "Nuke cancelado."
    fi
    ;;

  test)
    docker compose -f "$COMPOSE_FILE" exec api pytest -v
    ;;

  open)
    xdg-open "http://localhost:5173" >/dev/null 2>&1 || echo "Abrí: http://localhost:5173"
    ;;

  open-api)
    xdg-open "http://localhost:8000/docs" >/dev/null 2>&1 || echo "Abrí: http://localhost:8000/docs"
    ;;

  help|--help|-h|"")
    echo "Sistema RED - Launcher"
    echo ""
    echo "Uso:"
    echo "  ./red up          Levanta todo el sistema"
    echo "  ./red down        Detiene el sistema"
    echo "  ./red logs        Muestra logs en vivo"
    echo "  ./red logs-api    Muestra logs de la API"
    echo "  ./red logs-front  Muestra logs del frontend"
    echo "  ./red ps          Muestra contenedores"
    echo "  ./red reset       Borra contenedores y volúmenes"
    echo "  ./red rebuild     Reconstruye sin cache sin borrar imágenes externas"
    echo "  ./red nuke        Borra contenedores, volúmenes e imágenes"
    echo "  ./red test        Ejecuta pytest"
    echo "  ./red open        Abre frontend"
    echo "  ./red open-api    Abre Swagger"
    ;;

  *)
    echo "Comando desconocido: $1"
    echo "Usá: ./red help"
    exit 1
    ;;
esac
