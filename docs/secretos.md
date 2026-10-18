# Secretos — Sistema RED

Qué secretos tiene el sistema, dónde viven, cómo se generan y cómo se rotan. **Ningún valor real va
en este documento ni en git**: acá solo se describe dónde está cada cosa.

Regla general: un secreto vive en **un solo lugar** (archivo del host con permisos `600`, o la base
como hash) y nunca se copia a código, docs, chats ni tickets. Si un secreto llega a un commit, no
alcanza con borrarlo: **se rota**.

---

## 1. Inventario

### Secretos de infraestructura (archivos env, gitignored, permisos `600`)

| Secreto | Archivo | Para qué | Generar con |
|---|---|---|---|
| `POSTGRES_PASSWORD` | `infra/.env.dev` / `infra/.env.prd` | Usuario dueño de la base del ambiente | `openssl rand -hex 16` |
| `PGADMIN_PASSWORD` | `infra/.env.dev` (PRD no levanta pgAdmin) | Login de pgAdmin | `openssl rand -hex 16` |
| `N8N_ENCRYPTION_KEY` | `infra/.env.n8n` | Cifra las credenciales guardadas en n8n | `openssl rand -hex 32` |
| `N8N_DB_PASSWORD` | `infra/.env.n8n` | Base interna de n8n | `openssl rand -hex 16` |
| Clave TLS local | `infra/proxy/certs/local.key` | Certificado self-signed de `red.localhost` | `infra/proxy/make-local-cert.sh` |

Las plantillas (`infra/.env.*.example`, versionadas) traen `CHANGE_ME` en cada secreto. El launcher
**no levanta** un ambiente mientras quede un `CHANGE_ME` en su env file, y **avisa** si el archivo
tiene permisos más abiertos que `600`.

Alta de un env file:

```bash
cp infra/.env.prd.example infra/.env.prd && chmod 600 infra/.env.prd
# reemplazar cada CHANGE_ME con un valor generado (tabla de arriba)
```

### Secretos de la aplicación (en la base, nunca en texto plano)

| Qué | Dónde | Cómo se guarda |
|---|---|---|
| Contraseñas de usuarios | `usuarios.password_hash_usuario` | hash scrypt con salt (`app/core/security.py`) |
| Tokens de sesión | `sesiones_usuarios` | solo el SHA-256; el token viaja en cookie httpOnly |

- **Primer ADMIN de un ambiente sin seed (PRD):** `./red prd create-admin`. Pide la contraseña en la
  terminal (no se muestra ni queda en archivos ni en el historial del shell) y marca cambio
  obligatorio en el primer ingreso. También sirve para recuperar el acceso si nadie puede entrar
  como ADMIN (pide confirmación si ya existe uno activo). Queda auditado (`CREAR_ADMIN_CLI`).
- **Reseteo de contraseña (UI de Usuarios, solo ADMIN):** genera una contraseña temporal aleatoria
  que se muestra **una sola vez** al ADMIN que la generó, cierra las sesiones abiertas del usuario y
  obliga a cambiarla en el siguiente ingreso. Entregarla por un canal seguro (en persona o por
  teléfono), nunca por un chat que quede guardado.
- **DEV:** el seed demo (`010_seed.sql`, `RED_SEED=1`) crea un `admin` de prueba con contraseña
  conocida. Solo existe en DEV; PRD nace sin usuarios.

### Datos sensibles que no son "secretos" pero se protegen igual

| Qué | Dónde | Protección |
|---|---|---|
| Backups de la base | `infra/backups/<env>/*.dump` | permisos `600` / carpeta `700`; contienen datos personales y hashes |
| Auditoría | tabla `auditoria_eventos` | nunca registra contraseñas (ni temporales) |

### Secretos que suma el bloque C (todavía no existen)

| Secreto | Para qué | Alcance mínimo |
|---|---|---|
| Token de API de Cloudflare | Certificado real por DNS-01 (Traefik) | `Zone:DNS:Edit` solo sobre la zona del dominio |
| `B2_ACCOUNT_ID` / `B2_ACCOUNT_KEY` | restic → Backblaze B2 | Application key limitada a **un** bucket |
| `RESTIC_PASSWORD` | Cifra el repositorio de backups | Si se pierde, **los backups no se pueden restaurar** |
| Token de GHCR | El host descarga las imágenes (si GHCR es privado) | PAT con solo `read:packages` |

En el CI de GitHub las imágenes se publican con el `GITHUB_TOKEN` del workflow (no hace falta
crear un secreto para eso).

---

## 2. Rotación

Antes de rotar algo en PRD: `./red prd backup pre-rotacion`.

| Secreto | Procedimiento | Ojo con |
|---|---|---|
| `POSTGRES_PASSWORD` | 1) `docker exec -it red_prd_postgres psql -U <POSTGRES_USER> -d <POSTGRES_DB>` → `\password <POSTGRES_USER>` 2) actualizar `infra/.env.prd` 3) `./red prd up` (recrea la API con la URL nueva) | Editar solo el env **no cambia nada**: Postgres aplica `POSTGRES_PASSWORD` únicamente al crear la base. `\password` la pide sin eco y no la deja en el historial de psql |
| `PGADMIN_PASSWORD` | Cambiarla desde pgAdmin (o recrear su volumen en DEV) | Igual que Postgres: el env solo aplica al primer arranque |
| `N8N_ENCRYPTION_KEY` | **No rotar** salvo compromiso. Si hay que hacerlo: exportar credenciales de n8n, cambiar la clave, reimportar | Cambiarla deja inutilizables las credenciales guardadas |
| `N8N_DB_PASSWORD` | Igual que `POSTGRES_PASSWORD`, en el contenedor `postgres_n8n_local` | — |
| Contraseña de un usuario | El usuario: "Cambiar contraseña". Un ADMIN: reseteo desde Usuarios | — |
| Todas las sesiones de un usuario | Reseteo de su contraseña, o que el usuario cambie la suya (el cambio cierra todas sus sesiones) | — |
| Clave TLS local | `infra/proxy/make-local-cert.sh` + `./red prd up` | Con el certificado real (bloque C) esto lo hace Traefik solo |

**Ante una filtración** (un secreto apareció en un commit, un chat, una captura): rotarlo primero,
después limpiar donde quedó. Reescribir el historial de git no sirve si el secreto sigue vigente.

---

## 3. Escaneo de secretos (gitleaks)

- **Config:** `.gitleaks.toml` = reglas por defecto de gitleaks + dos propias: hashes scrypt de la app
  (único permitido: el `admin` del seed DEV) y asignaciones `*PASSWORD=`/`*SECRET=`/`*TOKEN=`/... con
  valor real en archivos env (se permiten `CHANGE_ME` y `${VAR}`).
- **Pre-commit:** `.githooks/pre-commit` escanea lo que está en stage. Se activa **una vez por clon**:
  `git config core.hooksPath .githooks`. Si encuentra algo, el commit no se hace.
- **CI:** `.github/workflows/gitleaks.yml` escanea todo el historial en cada push y PR, con la misma
  versión del binario.
- **`.gitleaksignore`:** solo los hallazgos **históricos** aceptados (valores por defecto que ya no
  sirven: el admin de fábrica y las contraseñas de plantilla viejas). No se agregan hallazgos nuevos
  ahí: un secreto nuevo se saca del commit y se rota.
- **Instalación local** (binario único, sin dependencias; versión fijada igual que en el CI):

  ```bash
  V=8.30.1
  curl -fsSLO https://github.com/gitleaks/gitleaks/releases/download/v$V/gitleaks_${V}_linux_x64.tar.gz
  curl -fsSLO https://github.com/gitleaks/gitleaks/releases/download/v$V/gitleaks_${V}_checksums.txt
  grep linux_x64.tar.gz gitleaks_${V}_checksums.txt | sha256sum -c -
  tar xzf gitleaks_${V}_linux_x64.tar.gz gitleaks && install -m 755 gitleaks ~/.local/bin/
  ```

- **Escaneo manual:** `gitleaks git --redact .` (historial) · `gitleaks git --pre-commit --staged --redact .` (stage).

---

## 4. Historial

Auditoría del 2026-10-05, confirmada con gitleaks el 2026-10-17: **ningún secreto real de PRD estuvo
nunca en git**. El historial sí contiene valores por defecto (el hash de `admin`/`admin` en el
bootstrap, la contraseña de reseteo fija y las contraseñas de las plantillas de DEV/n8n). Se decidió
**no reescribir el historial**: esos valores dejaron de servir (el admin ya no viene en el bootstrap,
el reseteo es aleatorio y las plantillas usan `CHANGE_ME`). El repo de despliegue (`red-plataforma`)
arranca sin historial, así que tampoco los contiene.

---

## 5. Pendiente de decidir

1. **Dónde viven los secretos en el host de la nube.** Opciones: env file `600` en el host (como hoy;
   simple, pero el respaldo del archivo queda a mano), cifrados en el repo con sops + age (versionados,
   la clave age es lo único a custodiar), o un gestor de contraseñas como fuente de verdad.
2. **Custodia de `RESTIC_PASSWORD` y del acceso de recuperación.** Perder esa contraseña es perder
   los backups. Definir dónde queda una copia fuera del host y quién más puede acceder si el titular
   no está disponible.
3. **Política de rotación periódica** (p. ej. anual para infraestructura, inmediata ante una baja de
   personal con acceso).
4. **Segundo factor (MFA) para los usuarios ADMIN** (código por SMS o Google Authenticator / TOTP):
   anotado como mejora futura.
