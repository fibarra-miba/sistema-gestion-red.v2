# Estado del proyecto — Sistema RED

Punto de partida para cualquier sesión de trabajo: dónde estamos, qué se decidió y por qué, y qué
sigue. **Actualizar este archivo al cerrar cada sesión** que cambie el estado.

Última actualización: **2026-11-11**.

Leer también: [CLAUDE.md](../CLAUDE.md) (contrato y forma de trabajo) · [README](../README.md)
(comandos, ambientes, repos) · [operacion.md](operacion.md) (reglas de negocio y carga de datos
reales) · [secretos.md](secretos.md) (inventario, rotación, gitleaks) · [servidor.md](servidor.md)
(el host de PRD: acceso y configuración aplicada).

---

## 1. Dónde estamos

- **V1 completa y en uso:** backend + frontend de todos los módulos (ver CLAUDE.md §7). PRD tiene
  **datos reales** del ISP y facturación desde 10/2026.
- **Hoy todo corre en una VM Linux de desarrollo:** DEV (hot reload, datos demo) y PRD (imágenes
  congeladas, Traefik en `https://red.localhost`). Backup semanal automático de PRD (systemd timer),
  **guardado solo en el disco de la VM**: hoy no hay copia fuera del equipo.
- **Rumbo:** subir PRD a un servidor en la nube. El plan completo está en un documento aparte (plan de
  infraestructura del 30-08-2026, artifact "Infraestructura RED" en claude.ai). Quedó desactualizado
  en tres puntos: backups a Google Drive (no B2), proveedor Hostinger (no Lightsail) y 8 GB (no 16).
  Ver §3.
- **Servidor de PRD contratado y endurecido (2026-11-10)**, todavía sin el sistema: Hostinger KVM 2 en
  São Paulo, `red.fiba-soluciones.com.ar`. Detalle en [servidor.md](servidor.md).
- **DEV pasa a la PC Windows del usuario** (WSL2 + Docker, repo dentro del disco de WSL, no en `D:\`:
  sobre `/mnt/d` el hot reload no anda, el `chmod 600` de los env no aplica y `node_modules` se
  rompe). La VM se retira después del corte de PRD.

## 2. Repos y modelo de trabajo

| Repo | Remoto local | Para qué |
|---|---|---|
| `sistema-gestion-red.v2` | `origin` | Repo de trabajo, historial completo |
| `red-plataforma` (privado) | `plataforma` | Repo de despliegue: CI, imágenes de GHCR y servidor. Nació sin historial |

- Se trabaja en `main`; `./red sync-plataforma` lleva los commits nuevos a `plataforma-main`
  (cherry-pick `-x`) y verifica que el código quede idéntico. Detalle en README §Repositorios.
- **Modelo acordado (2026-11-07):** el agente trabaja desde una máquina de desarrollo (Windows con
  WSL2/Docker Desktop, la VM, o Claude Code web sobre el repo), **nunca dentro del servidor de PRD**.
  El servidor solo corre el sistema y recibe imágenes del CI. **Por qué:** el servidor tiene los
  datos reales y todos los secretos; un error de comando de un agente ahí cae directo sobre PRD.
- Git es la única fuente de verdad: una sesión por vez, `pull` al empezar, `push` al terminar.
- **Se mantienen los dos repos** (decidido 2026-11-11): `red-plataforma` es el repo de PRD y v2 sigue
  siendo el de trabajo.
- **Clones en la PC Windows** (con `core.autocrlf=false` para que `red` y los hooks queden con LF):
  `D:\Documentos\Chamba\Personal\SistemaRED-prd` (`red-plataforma`) y `...\SistemaRED-v2` (v2, sin el
  remoto `plataforma`: el sync se corre desde la VM). La sesión de infraestructura trabaja ahí.
- **Commits hechos directo en `red-plataforma`** (pasó el 2026-11-10 con `fca2887`): desde
  `c3850da` el sync los tolera. Hace `fetch`, los detecta y frena pidiendo el `git cherry-pick -x`
  a correr en `main`; después se vuelve a correr el sync. Nunca fuerza el push. Igual conviene
  commitear en v2 y dejar que el sync lo lleve. Detalle en README §Repositorios.

## 3. Plan de infraestructura

Orden original: C → ajuste de datos reales → host. **Cambió el 2026-11-10 por pedido del usuario:
primero se dejó el host listo** (dominio, servidor, endurecimiento) y ahora sigue adaptar el proyecto
para desplegarlo. La revisión de los datos de PRD con el usuario sigue siendo **antes del corte**.

**Bloque A — cerrado.** Backup de PRD con restauración verificada; repo reproducible desde un clon
limpio; ledger de migraciones (`./red [env] migrations | migrate`).

**Bloque B — cerrado.** PRD detrás de Traefik con un solo origen (`/` front, `/api/*` backend),
Postgres sin puertos publicados (red interna), cookie `Secure`, rate limit en el login, healthchecks
y límites de memoria.

**Seguridad de credenciales — cerrado (2026-10-19).** Sin credenciales por defecto en el código:
PRD nace sin usuarios (`./red prd create-admin`), reseteo con contraseña temporal aleatoria,
plantillas con `CHANGE_ME`, gitleaks en pre-commit y CI. Ver secretos.md.

**Bloque C — en curso.**

| Tema | Decisión | Por qué |
|---|---|---|
| Dominio | `fiba-soluciones.com.ar` en NIC Argentina, titular el usuario (persona, clave fiscal ARCA). **Registrado el 2026-11-10, vence el 2027-11-10** (renovación anual en nic.ar) | Local, se paga en pesos; no hace falta empresa constituida |
| DNS | Cloudflare (plan Free), delegado a `kim.ns.cloudflare.com` y `lewis.ns.cloudflare.com`. Registros en modo **solo DNS** al principio | El rate limit de Traefik necesita la IP real del usuario; el proxy de Cloudflare se evalúa después |
| Subdominio del sistema | **`red.fiba-soluciones.com.ar`** → `A 187.53.102.246`, solo DNS | Decidido el 2026-11-10. El dominio pelado y `www` quedan sin registros (no hay sitio institucional) |
| Servidor | **Hostinger KVM 2** (2 vCPU, 8 GB, 96 GB) en São Paulo, 24 meses. Plan B: AWS Lightsail 8 GB São Paulo | Comparación del 2026-11-10 con precios verificados y latencia medida; detalle y motivos en [servidor.md](servidor.md) §1 |
| n8n | **Va a PRD** (decidido 2026-11-10) | — |
| Certificado | Let's Encrypt por **DNS-01** con token de Cloudflare de alcance mínimo (editar DNS de esa zona) | No hace falta abrir el puerto 80 para emitirlo; se prueba primero contra el staging de Let's Encrypt |
| Backups fuera del equipo | restic → **Google Drive** vía rclone, con una **cuenta de Google dedicada** (no personal) y permiso `drive.file` | El usuario ya tiene el espacio; cuenta dedicada para que una credencial filtrada del servidor no exponga un Drive personal. Se pierde la inmutabilidad que daba B2: compensar con pruebas periódicas de restauración |
| CI | GitHub Actions en `red-plataforma` construye las imágenes y las publica en **GHCR privado**, con limpieza automática de versiones viejas | Privado por defecto; la cuota gratuita de paquetes es chica. El servidor no compila |

**Hecho el 2026-11-10:**
- Dominio registrado y delegado; zona activa en Cloudflare; cuenta de Cloudflare con contraseña propia
  y 2FA por app (códigos de recuperación guardados); el Gmail del titular con verificación en 2 pasos.
- Servidor contratado, endurecido y con Docker: usuario `fiba` con clave SSH, root y contraseñas
  bloqueados, UFW (22/80/443), fail2ban, parches de seguridad automáticos, zona horaria, swap, rotación
  de logs de Docker. Todo en [servidor.md](servidor.md).
- Opcional, sin hacer: comprar `fiba-soluciones.com` (está libre) en Cloudflare Registrar para proteger
  la marca. El dominio gratis que ofrece Hostinger no incluye `.com` y no se reclamó.

**Hecho el 2026-11-11:** git reconciliado con la VM (v2 `c3850da`, `red-plataforma` `2c178b7`, árboles
idénticos), sync tolerante a commits directos e inventario de la VM (abajo).

**Próximos pasos, en orden (adaptar el proyecto):**
1. ~~Reconciliar git con la VM y decidir el modelo de repos~~ (hecho 2026-11-11).
2. CI en `red-plataforma`: build de imágenes → GHCR privado, limpieza de versiones, token de solo
   lectura para el servidor.
3. Compose de servidor: imágenes de GHCR en vez de `build:`, red `edge` externa, Traefik con
   certificado real por DNS-01 (token de Cloudflare cargado directo en el env del servidor, nunca por
   chat ni git), `docker-socket-proxy`. Probar con el staging de Let's Encrypt primero. Postgres con
   imagen **pgvector** (el init aplica `red_ai`, ver §5) y **todas las imágenes con versión fija**:
   hoy `pgvector/pgvector:pg16`, `postgres:16` y n8n `:stable` son tags flotantes (Traefik ya está
   fijo en `v3.7.13`).
4. Despliegue en el servidor: clon con deploy key de solo lectura, env file `600`, sistema levantado
   **con un dump de prueba**, no con los datos reales.
5. Backups: restic + rclone a la cuenta de Google dedicada, retención, timer diario, **prueba de
   restauración real** y custodia de `RESTIC_PASSWORD`.
6. n8n en el servidor: editor detrás de Cloudflare Tunnel + Access, solo `/webhook/*` público.
7. **Revisión de los datos de PRD con el usuario** (pedido explícito; backup etiquetado antes).
8. Corte: escritura congelada en la VM, dump final que viaja **directo de la VM al servidor** (nunca
   por la PC Windows ni por chat), restore, verificación y monitoreo externo. La VM queda apagada un
   tiempo como respaldo.
9. DEV en la PC Windows (WSL2) y retiro de la VM.

**Inventario de la VM (2026-11-11, solo nombres, sin valores):**

| Qué | Estado |
|---|---|
| Env files | `infra/.env.dev`, `infra/.env.prd` (= `.env.prd.example`), `infra/.env.n8n`, todos `600`. `frontend/.env` sin secretos |
| Base de PRD | Postgres 16.14 (`pgvector/pgvector:pg16`; extensiones `btree_gist` y `vector`), **15 MB**. Volumen `red_prd_pgdata` 73 MB |
| Backups de PRD | 22 dumps (6,9 MB) en `infra/backups/prd/`, el primero del 2026-06-29. **Hueco del 2026-10-18 al 2026-11-10** (VM apagada: `Persistent=true` recupera una sola corrida) |
| Timer | `red-backup-prd.timer` de usuario (domingos 03:00, linger activo), retención 180 días en el script |
| n8n | 2.19.4 (tag `:stable`), base Postgres 16.13 propia. Workflows: "Telegram" (activo: Telegram Trigger → If → mensaje) y "Gmail" (inactivo, sin credencial). Una credencial (`telegramApi`). Sin exports en git |
| Fuera del repo | Cert local autofirmado (no sirve para el servidor), gitleaks en `~/.local/bin`, `~/.claude/` (CLAUDE.md global, memorias, agentes y skills) |
| Versiones | Docker 29.1 / compose 5.0 en la VM; el servidor tiene 29.9 / 5.7 (compatible) |

**Hallazgos que cambian el plan:**
- **n8n en la práctica no hace nada productivo:** el único workflow activo recibe por un túnel ngrok
  gratuito (`WEBHOOK_URL`) que solo funciona levantado a mano. En el servidor el webhook pasa a
  `red.fiba-soluciones.com.ar` y hay que volver a registrarlo en Telegram. Migrarlo es chico: 2
  workflows, 1 credencial y la `N8N_ENCRYPTION_KEY`.
- **`red_ai` sí está aplicado** (ver §5): la imagen de Postgres del servidor tiene que ser pgvector.
- **Los backups no tienen copia fuera de la VM** hasta el paso 5. Si se demora, sacar una copia
  manual cifrada.

**Para el corte y el retiro de la VM:**
- Lo que viaja: el dump final de PRD (directo de la VM al servidor), el export de n8n (workflows y
  credenciales) y su `N8N_ENCRYPTION_KEY` (sin ella las credenciales guardadas no se abren). El resto
  de los secretos se **generan de nuevo** para el servidor, no se copian.
- **Volumen `infra_pgdata` (615 MB, del 2026-04-24, sin contenedor):** parece la base de RED anterior
  a la separación DEV/PRD. Revisar el contenido con el usuario antes de decidir; no borrar a ciegas.
- **Ramas solo locales en la VM** `backup/main-pre-limpieza` y `backup/plataforma-pre-limpieza`:
  pueden tener el historial previo a la limpieza de credenciales por defecto. Decidir si se archivan
  (fuera de GitHub) o se borran.
- `~/.claude/` de la VM (memorias, agentes, skills) para el DEV en Windows.
- La VM aloja **otros stacks que no son de RED** (SaludConecta, Gestión Stock, agente_vendedor, un
  volumen del hackatón): resolverlos antes de apagarla.
- **Dónde se prueba la adaptación:** la PC Windows no tiene Docker todavía; los cambios de compose y
  CI se prueban en la VM o en el servidor nuevo antes de que tenga datos reales.

## 4. Pendientes de datos y negocio (PRD)

Se resuelven con el usuario, nunca por iniciativa propia (ver operacion.md para el procedimiento):

- 4 clientes con apellido `S/D` a completar.
- Una garantía de un cliente dado de baja: el plazo para reclamar el depósito venció el 05/11/2026;
  confirmar con el usuario si pasa a `RETENIDA` (o `DEVUELTA` si se reclamó).
- Contraseña de `admin` en PRD: la cambia el usuario desde la UI; confirmar si ya se hizo.
- Decidir si COBRANZAS puede ver la ficha del cliente en solo lectura.
- Producto: una garantía `RETENIDA` todavía no genera el ingreso en facturación; el plazo de reclamo
  de garantías se controla a mano.

## 5. Después del servidor (siguientes versiones)

- **Monitoreo de red con el MikroTik del ISP** (próxima versión, análisis hecho, sin implementar):
  colector por túnel WireGuard (nunca exponer el MikroTik a Internet); tres capas — estado de conexión
  por contrato (el 80% del valor), series de consumo con retención y agregados, NetFlow descartado;
  falta en el modelo una identidad de red por contrato (IP/MAC/PPPoE/ONU) en un schema aparte
  (`red_net`); el caso de negocio grande es el corte y la reconexión automáticos por mora, con un
  usuario de RouterOS de permisos mínimos y todo auditado.
- **Capa de IA (`red_ai`)** — en pausa por decisión del usuario. El schema (`infra/sql/red_ai/`)
  **está aplicado en DEV y PRD** (29 tablas vacías + extensión `vector`, lo crea `infra/sql/00_init.sql`
  al crear la base; corregido el 2026-11-11, antes decía que no), así que Postgres necesita la imagen
  con pgvector y los dumps lo incluyen. Al retomar hay tres
  decisiones abiertas: primer caso de uso (recomendado: asistente sobre el core sin RAG), cómo aplicar
  la infraestructura y arquitectura de integración. Requisito duro: el acceso del asistente se limita
  por la identidad de quien pregunta (un cliente solo ve lo suyo).

## 6. Notas técnicas que conviene saber

- **Commits de base de datos:** `get_db` se usa siempre como `Depends(get_db, scope="function")`
  para confirmar antes de responder (con el scope por defecto, FastAPI ≥0.118 confirma después y el
  cliente puede leer datos viejos o recibir OK de algo que terminó en rollback). Lo vigila
  `test_db_scope.py`.
- **Esquema en dos lugares:** `infra/sql/core` y `backend/test/sql` (001–006 idénticos,
  `./red check-schema`); los datos difieren a propósito (`010_seed` demo DEV vs `010_fixtures` de la
  suite). Todo cambio de esquema lleva además una migración idempotente.
- **Typecheck del frontend:** `tsc -b` dentro del contenedor DEV (`tsc --noEmit` da falso verde).
- **`POSTGRES_PASSWORD`** solo se aplica al crear la base: rotarla requiere `\password` en psql.
- **Suite de tests:** ~260 tests, 11–35 min según la carga de la máquina (recrea el esquema por test).
  Si corre en paralelo con mucha carga puede dar timeouts de conexión que no son fallos de código.
- **Deuda conocida:** algunos schemas de pagos devuelven montos como string (`Money`) mientras el
  front los tipa `number`; 5 warnings de lint (`react-refresh/only-export-components`) preexistentes.
