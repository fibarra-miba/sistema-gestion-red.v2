# Estado del proyecto — Sistema RED

Punto de partida para cualquier sesión de trabajo: dónde estamos, qué se decidió y por qué, y qué
sigue. **Actualizar este archivo al cerrar cada sesión** que cambie el estado.

Última actualización: **2026-11-07**.

Leer también: [CLAUDE.md](../CLAUDE.md) (contrato y forma de trabajo) · [README](../README.md)
(comandos, ambientes, repos) · [operacion.md](operacion.md) (reglas de negocio y carga de datos
reales) · [secretos.md](secretos.md) (inventario, rotación, gitleaks).

---

## 1. Dónde estamos

- **V1 completa y en uso:** backend + frontend de todos los módulos (ver CLAUDE.md §7). PRD tiene
  **datos reales** del ISP y facturación desde 10/2026.
- **Hoy todo corre en una VM Linux de desarrollo:** DEV (hot reload, datos demo) y PRD (imágenes
  congeladas, Traefik en `https://red.localhost`). Backup semanal automático de PRD (systemd timer).
- **Rumbo:** subir PRD a un servidor en la nube. El plan completo está en un documento aparte (plan de
  infraestructura del 30-08-2026, en claude.ai); ojo: en la parte de backups todavía dice Backblaze
  B2, que se reemplazó por Google Drive (ver §3).

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

## 3. Plan de infraestructura

El orden importa y lo pidió el usuario: **C → ajuste de datos reales → host. El host es el último
paso**; todo lo anterior se ensaya en local.

**Bloque A — cerrado.** Backup de PRD con restauración verificada; repo reproducible desde un clon
limpio; ledger de migraciones (`./red [env] migrations | migrate`).

**Bloque B — cerrado.** PRD detrás de Traefik con un solo origen (`/` front, `/api/*` backend),
Postgres sin puertos publicados (red interna), cookie `Secure`, rate limit en el login, healthchecks
y límites de memoria.

**Seguridad de credenciales — cerrado (2026-10-19).** Sin credenciales por defecto en el código:
PRD nace sin usuarios (`./red prd create-admin`), reseteo con contraseña temporal aleatoria,
plantillas con `CHANGE_ME`, gitleaks en pre-commit y CI. Ver secretos.md.

**Bloque C — en curso.** Nada de esto necesita el servidor.

| Tema | Decisión | Por qué |
|---|---|---|
| Dominio | `fiba-soluciones.com.ar` en NIC Argentina, titular el usuario (persona, clave fiscal ARCA) | Local, se paga en pesos; no hace falta empresa constituida |
| DNS | Cloudflare (plan Free), registros en modo **solo DNS** al principio | El rate limit de Traefik necesita la IP real del usuario; el proxy de Cloudflare se evalúa después |
| Certificado | Let's Encrypt por **DNS-01** con token de Cloudflare de alcance mínimo (editar DNS de esa zona) | Se emite y prueba sin tener el servidor y sin abrir el puerto 80 |
| Subdominio del sistema | Por definir: `red.` (recomendado) o `app.` | — |
| Backups fuera del equipo | restic → **Google Drive** vía rclone, con una **cuenta de Google dedicada** (no personal) y permiso `drive.file` | El usuario ya tiene el espacio; cuenta dedicada para que una credencial filtrada del servidor no exponga un Drive personal. Se pierde la inmutabilidad que daba B2: compensar con pruebas periódicas de restauración |
| CI | GitHub Actions en `red-plataforma` construye las imágenes y las publica en **GHCR privado**, con limpieza automática de versiones viejas | Privado por defecto; la cuota gratuita de paquetes es chica |

**Estado concreto del bloque C (2026-11-07):**
- La zona `fiba-soluciones.com.ar` está creada en Cloudflare (0 registros) y el usuario tiene los dos
  servidores DNS.
- **Bloqueante:** el dominio **no figura activo** en NIC Argentina (el DNS público responde NXDOMAIN
  para `.com.ar`); el pago no se había podido completar. Hay que confirmarlo en nic.ar y pagar.

**Próximos pasos, en orden:**
1. *(Usuario)* Pagar/activar el dominio en nic.ar y delegar los dos servidores DNS de Cloudflare.
2. Verificar la delegación (`dig NS fiba-soluciones.com.ar`) y que Cloudflare marque la zona activa.
3. *(Usuario)* Elegir el subdominio del sistema.
4. Certificado real por DNS-01 en Traefik: token de Cloudflare creado por el usuario y cargado directo
   en el env del ambiente (nunca por chat ni git); probar con el staging de Let's Encrypt primero.
5. Backups: restic + rclone a la cuenta de Google dedicada, retención, **prueba de restauración real**
   y decidir dónde se custodia `RESTIC_PASSWORD` (si se pierde, los backups no se abren).
6. CI en `red-plataforma`: build de imágenes → GHCR privado, limpieza de versiones, y token de solo
   lectura para el servidor.

**Después de C y antes de contratar el servidor:** frenar y hacer **juntos** la revisión de los datos de
PRD para que reflejen la realidad del negocio (pedido explícito del usuario). Backup etiquetado antes
de tocar nada.

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
- **Capa de IA (`red_ai`)** — en pausa por decisión del usuario. El schema existe en
  `infra/sql/red_ai/` pero no está aplicado (requiere imagen con pgvector). Al retomar hay tres
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
