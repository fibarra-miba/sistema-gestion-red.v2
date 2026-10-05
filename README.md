# Sistema RED

ERP operativo para un ISP (clientes, contratos, instalaciones, pagos, stock).
Stack: **FastAPI + PostgreSQL** · **React + Vite + TypeScript + MUI** · **Docker Compose** · **pnpm** · **Pytest**.
Launcher unificado: **`./red`**.

Reglas de negocio y convenciones de carga de datos: **[docs/operacion.md](docs/operacion.md)**.

---

## Quickstart (desarrollo)

```bash
git clone <repo>
cd sistema-red-cloude
chmod +x red
cp infra/.env.dev.example infra/.env.dev      # primera vez
./red up                                       # = ./red dev up
```

Acceso DEV: Frontend http://localhost:5173 · Swagger http://localhost:8000/docs
Login demo: `admin` / `admin`.

---

## Ambientes: DEV y PRD

El sistema corre en **dos ambientes aislados en la misma máquina**, seleccionados como
primer argumento del launcher: `./red [dev|prd] <comando>` (sin ambiente = `dev`).

| | DEV | PRD |
|---|---|---|
| Para qué | desarrollo, hot reload, datos demo | datos reales, código congelado |
| Código | bind-mount del working tree (cambios en vivo) | imágenes construidas (congelado en el build) |
| Seed demo | sí (`RED_SEED=1`) | no — base limpia (`RED_SEED=0`) |
| Frontend | `vite dev` | bundle estático servido por nginx |
| Env file | `infra/.env.dev` | `infra/.env.prd` (secretos, gitignored; plantilla `infra/.env.prd.example`) |
| Proyecto Docker | `red_dev` (volumen `red_dev_pgdata`) | `red_prd` (volumen `red_prd_pgdata`) |
| Entrada | front http://localhost:5173 · API/Swagger http://localhost:8000 | **https://red.localhost** (Traefik, 80/443) |
| API | directa en `:8000` | mismo origen: `https://red.localhost/api/*` (`VITE_API_BASE_URL=/api`) |
| pgAdmin | http://localhost:5050 | — (solo DEV) |
| Postgres (host) | `5432` | **no publicado** (red `data` interna) |

**PRD se sirve detrás de Traefik** (`infra/docker-compose.proxy.yml`, config en `infra/proxy/`):
`/` va al frontend y `/api/*` al backend (StripPrefix, el backend sigue viendo `/auth/login`).
Solo publica 80/443; Postgres y la API no tienen puertos en el host. Certificado local
self-signed generado con `infra/proxy/make-local-cert.sh` (el navegador pide aceptarlo la
primera vez). Cookie de sesión `Secure` y rate limit en `/api/auth/login` (5/min, ráfaga 10).

Como usan puertos, volúmenes y cookie de sesión distintos, **DEV y PRD pueden correr a la vez sin pisarse**.

**Modelo de trabajo:** se desarrolla en DEV en vivo; cuando una incorporación está lista se
**promueve** a PRD reconstruyendo desde el código actual:

```bash
./red prd backup pre-deploy   # snapshot antes de tocar PRD
./red prd migrations          # ver migraciones pendientes
./red prd migrate             # aplica las pendientes (pide confirmación en PRD)
./red prd build && ./red prd up   # congela el código actual y lo levanta
```

Las migraciones van **antes** del `up` cuando el código nuevo depende de tablas nuevas.
**Nunca** `reset`/`down -v` en PRD: tiene datos reales; `build + up` conserva el volumen.

> **PRD nace con el usuario `admin` / `admin`** (viene en `005_catalogos_base.sql`).
> **Cambiá ese password antes de exponer PRD fuera de la máquina** — es una credencial por defecto.

---

## Comandos

`./red [dev|prd] <comando>` — sin ambiente, asume `dev`.

| Comando | Qué hace |
|---|---|
| `up` | Levanta el ambiente (build incluido) |
| `build` | Construye imágenes sin levantar (promoción a PRD) |
| `down` | Detiene sin borrar volúmenes |
| `restart` | Reinicia sin borrar datos |
| `rebuild` | Reconstruye sin cache |
| `logs` / `logs-api` / `logs-front` | Logs en vivo |
| `ps` | Estado de contenedores |
| `test` | Pytest contra `<POSTGRES_DB>_test` (base de test dedicada) |
| `backup [tag]` | Snapshot de la base → `infra/backups/<env>/` (tag def: `manual`) |
| `backups` | Lista los backups del ambiente |
| `restore <archivo>` | Restaura la base desde un `.dump` (**sobreescribe**) |
| `migrations` | Lista migraciones aplicadas / pendientes (ledger `schema_migrations`) |
| `migrate [--baseline]` | Aplica las pendientes; `--baseline` marca todas como aplicadas sin correrlas |
| `reset` / `nuke` | Borra volúmenes (y en `nuke`, imágenes) del ambiente — destructivo |
| `open` / `open-api` | Abre frontend / Swagger |
| `*-n8n` | Variantes para el addon n8n (`up-n8n`, `logs-n8n`, …) |

Ejemplos:

```bash
./red up                 # DEV (hot reload, datos demo)
./red prd up             # PRD (código congelado, base real)
./red prd backup          # snapshot manual de PRD ahora mismo
./red test               # tests contra mi_base_test
```

---

## Backups

- **Manual on-demand:** `./red prd backup` → deja una "foto" (`pg_dump -Fc`) en `infra/backups/prd/`
  con timestamp y tag `manual`. Útil antes de tocar datos importantes.
- **Automático semanal:** un **systemd timer de usuario** (`red-backup-prd.timer`) corre
  `./red prd backup auto` los **domingos 03:00**. Tiene `Persistent=true`: si la PC estaba
  apagada a esa hora, la corrida perdida se ejecuta en el próximo arranque (no se saltea).
  Estado: `systemctl --user list-timers red-backup-prd.timer`.
- **Retención:** se podan **todos** los backups (auto y manual) de más de **180 días**
  (semanales → ~26 conservados).
- **Restaurar:** `./red prd restore infra/backups/prd/<archivo>.dump` (pide doble confirmación en PRD).

> Los backups viven en el **mismo disco** que la base. Para protección real ante fallo de disco,
> copialos periódicamente a otra ubicación/medio.

---

## Base de datos inicial

El init (`infra/sql/00_init.sql`) carga el esquema `public` (core) y el esquema `red_ai`:

```text
core/001_schema · 002_constraints · 003_indexes · 005_catalogos_base · 006_post_seed
red_ai/001..006
core/010_seed   <- SOLO si RED_SEED=1 (DEV). PRD lo omite.
```

`005_catalogos_base` ya incluye catálogos + el usuario `admin`. El `010_seed` es **dataset demo**
(planes/clientes/contratos de ejemplo) y por eso solo se carga en DEV.

### Cambios de schema

El schema vive en **dos lugares que deben quedar idénticos**: `infra/sql/core/` (bases nuevas)
y `backend/test/sql/` (la suite reconstruye la base de test desde ahí). Todo cambio lleva además
una **migración idempotente** en `infra/sql/migrations/` (con su propio `BEGIN/COMMIT`), que es lo
que llega a las bases ya levantadas vía `./red [env] migrate`. Una migración ya aplicada **no se
edita**: se agrega una nueva.

---

## Gestor de paquetes (frontend)

El frontend usa **pnpm** (no npm). Lockfile: `frontend/pnpm-lock.yaml`. En Docker se instala vía
corepack.

> En DEV `frontend/node_modules` lo instala el contenedor (como root, en el bind-mount). **No corras
> pnpm en el host** sobre ese árbol: lo deja a medias. Typecheck y lint, dentro del contenedor:
>
> ```bash
> docker exec red_dev_frontend sh -c "cd /app && pnpm exec tsc -b && pnpm lint"
> ```
>
> (`tsc --noEmit` da falso verde con el tsconfig de soluciones; usar `tsc -b`.)

---

## Troubleshooting

**Puerto ocupado** — DEV usa 5173/8000/5432/5050, PRD usa 80/443 (Traefik). En esta máquina
conviven otros proyectos en rangos propios: **no mates un puerto de otro stack**; si choca, se
mueve el rango del que llega.

**`node_modules` roto en DEV** (`vite: not found` en loop) — se reinstala desde el lockfile:

```bash
docker stop red_dev_frontend
docker run --rm -e CI=true -v "$PWD/frontend:/app" -w /app node:22 \
  sh -c "rm -rf node_modules && corepack enable && pnpm install --no-frozen-lockfile"
docker start red_dev_frontend
```

**Pruebas contra PRD** — no hagas pruebas de humo de login contra `https://red.localhost` con
usuarios inventados: cada intento queda en la auditoría real (`LOGIN_FAILURE`). Probar en DEV.

**Reconstrucción limpia de un ambiente:**

```bash
./red dev down
./red dev rebuild
```

**Empezar un ambiente de cero (borra su base):** `./red dev reset` (en PRD pide escribir `RESET-PRD`).

---

Desarrollado para proyecto Sistema RED.
