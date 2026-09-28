# Sistema RED

ERP operativo para un ISP (clientes, contratos, instalaciones, pagos, stock).
Stack: **FastAPI + PostgreSQL** · **React + Vite + TypeScript + MUI** · **Docker Compose** · **pnpm** · **Pytest**.
Launcher unificado: **`./red`**.

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
| Env file | `infra/.env.dev` | `infra/.env.prd` (secretos, gitignored) |
| Proyecto Docker | `red_dev` (volumen `red_dev_pgdata`) | `red_prd` (volumen `red_prd_pgdata`) |
| Frontend | http://localhost:5173 | http://localhost:5273 |
| API / Swagger | http://localhost:8000 | http://localhost:8100 |
| pgAdmin | http://localhost:5050 | http://localhost:5150 |
| Postgres (host) | `5432` | `5433` |

Como usan puertos, volúmenes y cookie de sesión distintos, **DEV y PRD pueden correr a la vez sin pisarse**.

**Modelo de trabajo:** se desarrolla en DEV en vivo; cuando una incorporación está lista se
**promueve** a PRD reconstruyendo desde el código actual:

```bash
./red prd build      # congela el código actual en la imagen de PRD
./red prd up          # levanta PRD con esa versión (estable hasta la próxima promoción)
```

> **PRD nace con el usuario `admin` / `admin`** (viene en `005_catalogos_base.sql`).
> **Cambiá ese password apenas entres** — es una credencial por defecto.

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

---

## Gestor de paquetes (frontend)

El frontend usa **pnpm** (no npm). Lockfile: `frontend/pnpm-lock.yaml`. En Docker se instala vía
corepack. Para trabajar el front fuera de Docker: `cd frontend && pnpm install && pnpm dev`.

---

## Troubleshooting

**Puerto ocupado** — DEV usa 5173/8000/5432/5050, PRD usa 5273/8100/5433/5150. Si alguno está
tomado por otro stack, liberarlo (`docker ps`) antes de levantar.

**Reconstrucción limpia de un ambiente:**

```bash
./red dev down
./red dev rebuild
```

**Empezar un ambiente de cero (borra su base):** `./red dev reset` (en PRD pide escribir `RESET-PRD`).

---

Desarrollado para proyecto Sistema RED.
