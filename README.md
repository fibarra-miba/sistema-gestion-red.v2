# Sistema RED

## Quickstart

```bash
git clone <repo>
cd sistema-red
chmod +x red
./red up
```

Acceso:

- Frontend: http://localhost:5173
- API: http://localhost:8000/docs

Login demo:

user: admin  
pass: admin

---

## ¿Qué es Sistema RED?

Sistema de gestión para proveedor de internet (ISP) desarrollado con:

- FastAPI + PostgreSQL
- React + Vite + TypeScript
- Docker Compose
- Pytest
- Launcher unificado `./red`

---

# Requisitos

Tener instalado:

- Docker
- Docker Compose (plugin moderno)
- Bash/Linux (Ubuntu recomendado)

Verificar:

```bash
docker --version
docker compose version
```

---

# Inicio rápido (1 comando)

Levantar todo el entorno:

```bash
./red up
```

Servicios:

| Servicio | URL |
|---------|-----|
Frontend | http://localhost:5173 |
API | http://localhost:8000 |
Swagger | http://localhost:8000/docs |
pgAdmin | http://localhost:5050 |

---

# Login demo

Usuario inicial:

```text
user: admin
pass: admin
```

Dataset demo incluido:

- Cliente con instalación completada
- Cliente con instalación programada
- Cliente sin contrato

---

# Comandos disponibles

## Levantar entorno

```bash
./red up
```

---

## Detener entorno

```bash
./red down
```

---

## Reiniciar desde cero (recomendado)

```bash
./red reset
```

Borra contenedores + volumen de base de datos y recrea todo.

---

## Reconstruir imágenes

```bash
./red rebuild
```

Reconstruye sin borrar imágenes externas.

---

## Ver logs

Todos:

```bash
./red logs
```

API:

```bash
./red logs-api
```

Frontend:

```bash
./red logs-front
```

---

## Ver estado

```bash
./red ps
```

---

## Abrir frontend

```bash
./red open
```

Abrir Swagger:

```bash
./red open-api
```

---

# Base de datos inicial

Se cargan automáticamente:

```text
001_schema.sql
002_constraints.sql
003_indexes.sql
005_catalogos_base.sql
010_seed.sql
```

Incluye:

- catálogos
- usuario admin
- planes demo
- contratos demo
- instalaciones demo

---

# Ejecutar tests

API tests:

```bash
docker compose exec api pytest -v
```

o módulo puntual:

```bash
docker compose exec api pytest test/test_auth.py -v
```

---

# Estructura del proyecto

```text
backend/
frontend/
infra/
  docker-compose.yml
  sql/
red
README.md
```

---

# Flujo recomendado de uso

Primera vez:

```bash
./red up
```

Trabajo diario:

```bash
./red up
./red down
```

Si algo se rompe:

```bash
./red reset
```

---

# Troubleshooting

## Puerto ocupado

Si 5173, 8000 o 5050 están ocupados:

```bash
./red down
docker ps
```

Liberar puertos o detener contenedores conflictivos.

---

## Reconstrucción limpia

```bash
./red down -v
./red rebuild
./red up
```

---

# Futuro

Posible comando nuclear:

```bash
./red nuke
```

(no habilitado por defecto)

---

Desarrollado para proyecto Sistema RED.
