# VM de desarrollo — Sistema RED (y las otras aplicaciones personales)

Ambiente **DEV** de las aplicaciones personales desde la Fase 1 (2026-11-23). Se maneja desde la PC
Windows del titular (app de Claude). **No tiene ni va a tener datos reales**: PRD vive en el servidor
([servidor.md](servidor.md)). La hoja de ruta está en [estado.md](estado.md) §1.

## 1. Ficha

| Qué | Valor |
|---|---|
| Host | VirtualBox 7.2 en la PC Windows del titular, VM **`Ubuntu`** (`C:\Users\facun\VirtualBox VMs\Ubuntu`) |
| Recursos | 3 vCPU, 8 GB de RAM (de 15,9 de la PC), disco de 59 GB (64% usado tras la limpieza) |
| SO | Ubuntu 24.04.3, Docker 29.1 / compose 5.0 |
| Red | Adaptador 1 **NAT** (salida a Internet, `10.0.2.15`) + adaptador 2 **solo-anfitrión** con IP fija **`192.168.56.11`** (perfil `solo-anfitrion` de NetworkManager; el DHCP de VirtualBox reparte de `.101` a `.254`). **No está en la LAN**: solo la ve la PC (`192.168.56.1`) |
| Usuario | `admin`, con `sudo` sin contraseña (`/etc/sudoers.d/90-admin-nopasswd`) y en el grupo `docker` |
| SSH | Solo clave (`/etc/ssh/sshd_config.d/10-solo-clave.conf`: sin contraseña, sin root) |
| Claude Code | 2.1.330 en `~/.local/bin` (en el `PATH` también sin login, por el principio de `~/.bashrc`), sesión iniciada |

**Por qué solo-anfitrión y no puente:** con el adaptador en puente, los puertos que publica Docker
quedaban abiertos a toda la LAN (Docker pasa por encima de UFW) y la IP dependía del DHCP del
router. Con NAT + solo-anfitrión la VM tiene IP fija sin tocar el router y nada de la LAN la alcanza,
sin cambiar el compose de ningún proyecto.

## 1bis. Quién hace qué (desde 2026-11-23)

| Lugar | Rol | Qué hay |
|---|---|---|
| **PC Windows**, carpeta `D:\Documentos\Chamba\Personal` | **Centro de control**: consultas de estado, entrada a la VM, operación del servidor | Sin código ni stacks. Memorias de la app con una ficha general por proyecto (`~/.claude/projects/D--Documentos-Chamba-Personal/memory/`) y las claves SSH |
| **VM** | **Taller**: desarrollo de todos los proyectos, commits, `./red sync-plataforma` | Clones, stacks DEV, memorias detalladas de cada proyecto |
| **Servidor** | PRD de RED | Datos reales. Se opera desde la PC con `ssh red-prd`, comando por comando. La clave `red_prd` **nunca va a la VM**, porque ahí el agente tiene autonomía total |

El detalle fino de un proyecto se lee en vivo desde la VM
(`ssh red-vm cat ~/projects/<proyecto>/docs/...`). No hay clones en la PC: los de `D:\` se
retiraron el 2026-11-23. Cuando una sesión en la VM cambie algo de fondo, se actualiza la ficha del
proyecto en el centro de control.

## 2. Acceso desde la PC

`%USERPROFILE%\.ssh\config`:

```
Host red-vm
    HostName 192.168.56.11
    User admin
    IdentityFile ~/.ssh/red_vm_app
    IdentityFile ~/.ssh/red_vm
    IdentitiesOnly yes
```

- **`red_vm_app`** (ed25519, **sin passphrase**): la usan la app de Claude y el agente. Aceptable
  porque la VM no tiene datos sensibles y solo es alcanzable desde la PC.
- `red_vm` (con passphrase): respaldo.
- **Consola de emergencia:** VirtualBox → `Ubuntu` → Mostrar (la VM arranca sin ventana:
  `VBoxManage startvm Ubuntu --type headless`).
- **Sesiones de Claude Code en la VM:** desde la app, conexión SSH `red-vm` y carpeta
  `/home/admin/projects/<proyecto>`. El agente trabaja ahí con autonomía; los snapshots son la red de
  seguridad.
- **Navegador de la PC hacia DEV:** los proyectos usan `localhost` en CORS y en la URL del API, así
  que se entra por túnel al mismo puerto, por ejemplo para RED:
  `ssh -N -L 5173:localhost:5173 -L 8000:localhost:8000 red-vm` y abrir `http://localhost:5173`.
  Desde la IP (`http://192.168.56.11:5173`) la página carga, pero las llamadas al API fallan.

## 3. Proyectos en la VM

| Carpeta (`~/projects/`) | Repo | Stack | Estado |
|---|---|---|---|
| `sistema-red-cloude` | `sistema-gestion-red.v2` (+ remoto `plataforma`) | `red_dev` | Arriba. El sync a `red-plataforma` se corre desde acá cuando se retiren los clones de la PC |
| `gestion-stock-almacen` | `sistema-gesti-n-almac-n` | solo la base (`gestion_stock_db`) | 97 cambios sin commitear desde 2026-07: llevarlos a git al retomarlo |
| `NoaInnova/SaludConecta` (+ `NoaInnova/bot-modulo`) | `SaludConecta` / `bot-modulo` | `saludconecta` (7) | Arriba |
| `hackaton-saltadev` | `hackaton-saltadev` | InformeClaro | Detenido; volumen de datos demo conservado |
| `VenderIA` | **sin repo** | `agente_vendedor` (4) | Detenido. Al retomarlo: `git init` + repo privado, y reasignar postgres 5442 y api 8000, que chocan con Gestión Stock y RED |
| `sistema-gestion-medica` | sin repo (4 documentos) | — | Ideas del hackatón |

El registro de puertos de la VM está en su `~/.claude/CLAUDE.md`.

## 4. Snapshots (VirtualBox, en la PC)

| Nombre | Fecha | Qué es |
|---|---|---|
| `pre-fase1` | 2026-11-23 | La VM tal como estaba antes de la Fase 1 (red puente, sin limpiar). Se puede borrar cuando `base-dev` esté probado un tiempo |
| `base-dev` | 2026-11-23 | Fin de la Fase 1: estado base del ambiente DEV |

Se sacan con la VM apagada (Postgres consistente):
`VBoxManage controlvm Ubuntu acpipowerbutton` → esperar `VMState="poweroff"` **y que no quede
`SessionName`** (si no, `modifyvm`/`snapshot` fallan con "already locked") →
`VBoxManage snapshot Ubuntu take <nombre>` → `VBoxManage startvm Ubuntu --type headless`.

## 5. Fase 1: qué se hizo (2026-11-23)

1. Snapshot `pre-fase1`.
2. `sudo` sin contraseña para `admin` (validado con `visudo -cf` antes de instalarlo) y clave
   `red_vm_app`.
3. Limpieza: volumen `infra_pgdata` (615 MB, la base de RED de abril a junio: `mi_base` y
   `mi_base_test`, solo datos demo y de tests), binario viejo de Claude (226 MB), el traslado de
   `~/.claude` a la PC, temporales, el clon de la v1 (`red-servicio-internet`) y un resto vacío de
   root en `~/projects/SaludConecta`. Resguardos en **`~/archivo/`** de la VM (ver `LEEME.txt`):
   bundle de las ramas `backup/*-pre-limpieza` (historial previo a sacar las credenciales por
   defecto: **no subir a GitHub**), patch y tar de los cambios sin commitear de la v1, y el
   `~/.claude` de la VM antes de unificarlo.
4. Repo de RED al día (`main` y `plataforma-main` en `974657f`/`709e5d2`) y `./red up`: Postgres
   pasa a la imagen fija `pgvector/pgvector:0.8.7-pg16-bookworm` (16.16, mismo volumen).
5. Red NAT + solo-anfitrión. Verificado: desde la PC, `192.168.10.11` ya no responde en 22, 5173
   ni 8000 y `192.168.56.11` sí; la VM sale a Internet; los 12 contenedores volvieron solos.
6. SSH solo con clave (verificado: el ingreso por contraseña da `Permission denied (publickey)`).
7. Claude Code actualizado; `~/.claude` unificado con la PC: el CLAUDE.md global propio de la VM
   (sin las reglas de SAP, con el registro de puertos de la VM), la memoria de RED de la PC (más
   nueva) y la de SaludConecta movida a la ruta real del proyecto. Agentes y skills ya eran iguales.
8. En la PC: DEV de WSL retirado (`wsl --unregister Ubuntu-24.04`; solo tenía material de prueba,
   ya commiteado).

**Lecciones:** PowerShell 5.1 rompe las comillas al pasarle un comando remoto a `ssh.exe` (llegó
partido y solo corrió el `echo` final, con un "OK" falso): los comandos remotos van en un script
dentro de la VM, o por Git Bash. Después de apagar la VM, VirtualBox tarda unos segundos en soltar
la sesión.
