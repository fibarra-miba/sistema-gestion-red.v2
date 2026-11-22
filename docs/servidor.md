# Servidor de PRD — Sistema RED

Qué servidor tiene PRD, cómo se llega a él y qué configuración tiene aplicada. Sirve para revisar el
host y para rehacerlo desde cero si hiciera falta. **Ningún secreto va acá**: solo dónde vive cada
uno (ver [secretos.md](secretos.md)).

Estado: **infraestructura desplegada y probada; la app está BAJADA hasta el corte** (2026-11-22).
Corren Traefik (certificado real de Let's Encrypt, se renueva solo), n8n y la base con los datos de
prueba; `api` y `frontend` se sacaron a propósito para no publicar datos de demo, así que el sitio
responde 404. Se vuelven a levantar en el corte con `./red prd up-n8n`, ya con los datos reales
(estado.md §3).

---

## 1. Ficha

| | |
|---|---|
| Proveedor | Hostinger, VPS **KVM 2**, contratado el 2026-11-10 por 24 meses (pago en pesos; renueva a precio de lista) |
| Ubicación | Brasil (São Paulo) |
| Recursos | 2 vCPU · 8 GB RAM · 96 GB NVMe · swap de 2 GB |
| Sistema | Ubuntu 24.04 LTS (soporte hasta 2029). **No** pasar a 26.04 sin planificarlo con backup |
| IP pública | `187.53.102.246` |
| Hostname del proveedor | `srv2148733` |
| Nombre del sistema | `red.fiba-soluciones.com.ar` → registro `A` en Cloudflare, modo **solo DNS** |
| Latencia medida desde AR | ~58 ms |
| Extras del proveedor | Ninguno: sin backups pagos, sin escáner de malware, sin Docker manager |

**Por qué Hostinger** (2026-11-10): se compararon proveedores con región en Sudamérica, con precios
verificados ese día y latencia medida. São Paulo frente a Europa: ~60 ms contra ~275 ms. Dentro de
São Paulo la latencia empataba entre proveedores; Lightsail 8 GB salía US$ 44/mes, Vultr 8 GB
US$ 40–48/mes (reseñas con suspensiones de cuentas nuevas), Akamai +40 % por la región. Hostinger KVM 2
costó ~ARS 415.000 por 24 meses, en pesos y en cuotas, con 30 días de devolución. El riesgo de un
proveedor más chico se compensa con la arquitectura: backup cifrado fuera del proveedor y despliegue
desde imágenes, así que mudarse es cuestión de horas. **Plan B: AWS Lightsail 8 GB en São Paulo.**

**Por qué 8 GB y no 16**: el plan de infraestructura del 30-08 pedía 16 GB por la IA local, que está
en pausa. Sin IA, RED con n8n necesita ~4,5–5,5 GB.

## 2. Acceso

- Solo por SSH con clave, usuario **`fiba`** (con sudo). Root y contraseñas deshabilitados.
- Clave: `red_prd` (ed25519, con passphrase) en la PC Windows del titular, `%USERPROFILE%\.ssh\`.
- Acceso corto configurado en `%USERPROFILE%\.ssh\config`:

  ```
  Host red-prd
      HostName 187.53.102.246
      User fiba
      IdentityFile ~/.ssh/red_prd
      IdentitiesOnly yes
  ```

  `ssh red-prd`. `IdentitiesOnly` evita que el cliente ofrezca otras claves y agote los 3 intentos.
- Consola de emergencia: panel de Hostinger (sirve aunque SSH no responda).
- El agente **no trabaja dentro del servidor**: corre comandos puntuales por SSH desde la PC, cada uno
  aprobado por el titular. Cómo se habilita sin que la passphrase pase por el agente (2026-11-22):
  1. El agente levanta un `ssh-agent` de Git para Windows con socket fijo:
     `ssh-agent -a /c/Users/facun/.ssh/agent.sock -t 4h` (no necesita ningún secreto).
  2. El titular, en CMD: `set "SSH_AUTH_SOCK=/c/Users/facun/.ssh/agent.sock"` y
     `"C:\Program Files\Git\usr\bin\ssh-add.exe" /c/Users/facun/.ssh/red_prd` (pide la passphrase).
  3. La clave queda en memoria 4 h y se borra sola.

  Lo que no funcionó, para no repetirlo: el agente de Windows está deshabilitado (habilitarlo pide
  administrador) y el `ControlMaster` del SSH de Git para Windows abre la conexión pero no la puede
  reutilizar (`mux_client_request_session ... Connection reset`).
- Lo que necesita `sudo` (contraseña de `fiba`) lo corre el titular:
  `ssh -t red-prd "sudo ..."`.

## 3. Configuración aplicada

Todo esto se hizo el 2026-11-10 y se verificó en el momento.

**Sistema**
- `apt full-upgrade` al recibirlo.
- Zona horaria `America/Argentina/Buenos_Aires`.
- Swap: `/swapfile` de 2 GB en `/etc/fstab`, `vm.swappiness=10` en `/etc/sysctl.d/99-swap.conf`.

**Usuario**
- `adduser fiba` + grupo `sudo` + grupo `docker`.
- `/home/fiba/.ssh/authorized_keys` con la clave pública `red_prd` (copiada de la de root).

**SSH** — `/etc/ssh/sshd_config.d/00-endurecimiento.conf`:

```
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowUsers fiba
MaxAuthTries 3
X11Forwarding no
```

El prefijo `00-` importa: en sshd gana el primer valor leído, y la imagen del proveedor trae un
`50-cloud-init.conf` que habilita contraseñas. Verificación: `sudo sshd -T`.

**Firewall (UFW)**: entrada denegada por defecto, salida permitida, abiertos solo `22/tcp`,
`80/tcp` y `443/tcp` (IPv4 e IPv6).

> Docker escribe sus reglas de iptables **por debajo** de UFW: un `ports:` publicado en un compose
> atraviesa el firewall. La única defensa es no publicar puertos; en el stack de RED solo Traefik
> publica 80/443.

**fail2ban** — `/etc/fail2ban/jail.local`: jail `sshd` con `backend = systemd`, bloqueo de 1 h
tras 5 fallos en 10 min (`fail2ban-client status sshd`).

**Actualizaciones de seguridad**: `unattended-upgrades` activo
(`/etc/apt/apt.conf.d/20auto-upgrades`). **No reinicia solo**: cuando un parche pide reinicio
(`/var/run/reboot-required`), se reinicia a mano en un momento tranquilo.

**Docker**: desde el repositorio oficial (`download.docker.com`), Docker 29.9 y compose 5.7.
Rotación de logs por defecto en `/etc/docker/daemon.json` (`json-file`, `max-size 10m`,
`max-file 3`).

## 4. Snapshots

El panel de Hostinger guarda **una** snapshot por vez y **vence** a los pocos días. Es una red de
seguridad para cambios grandes, no un backup. Antes de cada etapa grande se saca una nueva. Última:
2026-11-22 19:07, antes del primer despliegue (vence el 2026-11-23).

## 5. Despliegue del sistema (2026-11-22)

Hecho en este orden, y así se rehace desde cero:

1. Snapshot en el panel y reinicio pendiente aplicado (`sudo reboot`, kernel `6.8.0-149`).
2. `sudo install -d -o fiba -g fiba -m 755 /srv/red` (lo corre el titular: pide `sudo`).
3. **Deploy key** generada en el servidor (`~/.ssh/red_plataforma_deploy`, ed25519 sin passphrase:
   la usa el `git pull` sin nadie delante) y registrada en `red-plataforma` como **solo lectura**
   (huella `SHA256:Da+tsM+p41xlchePsVPyV3vV7Ifv73T4FpPpFqqnshY`). Alias `github-red-plataforma` en
   `~/.ssh/config`. Clave de host de `github.com` verificada contra la huella publicada por GitHub.
4. Clon en `/srv/red/repo` (`git@github-red-plataforma:fibarra-miba/red-plataforma.git`).
5. `infra/.env.prd` e `infra/.env.n8n` desde las plantillas `.servidor.example`, con contraseñas y
   clave de cifrado de n8n generadas en el servidor (`openssl rand`), `600`. `/srv/red/secretos` en
   `700`.
6. Secretos que tipea el titular, ocultos, en una sesión SSH:
   `ssh -t red-prd /srv/red/repo/infra/servidor/cargar-secretos.sh`. Guarda el token de Cloudflare
   (lo valida contra su API antes) y hace `docker login ghcr.io` con el PAT.
7. `./red prd up-n8n` con `LETSENCRYPT_CA=acme-staging-v02` → certificado de prueba en ~70 s →
   `acme-v02` y `./red prd up-n8n` → certificado real (renueva Traefik solo).
8. `./red prd migrate --baseline` (la base nace del init con todas las migraciones).

Verificado desde Internet: HTTP→HTTPS, certificado válido, front y API, HSTS, rate limit del login,
webhook ruteado a n8n; 5678, 5432, 8000 y 2375 cerrados hacia afuera. Uso de RAM con todo arriba:
~1,1 GB de 7,8 GB.

**Incidente del primer despliegue (2026-11-22):** los datos de prueba se cargaron con `RED_SEED=1`,
y el seed demo crea `admin`/`admin` sin obligación de cambio. Quedó expuesto unos minutos; se
desactivó (activo=false y hash inutilizable), **sin ningún login registrado** (`ultimo_login` vacío,
sin sesiones). Desde entonces el launcher se niega a levantar en modo servidor con `RED_SEED=1`.

## 6. Lo que falta en el host

- Credencial OAuth propia para rclone (ver §7) y alertas si un backup falla.
- n8n: migrar los workflows de la VM. El editor no se expone: túnel SSH
  (`ssh -L 5678:127.0.0.1:5678 red-prd`); Cloudflare Tunnel + Access queda como opción.
- Monitoreo externo de uptime.

## 7. Backups (2026-11-22)

restic cifra en el servidor y sube con rclone a la cuenta de Google **dedicada** a backups
(permiso `drive.file`: rclone solo ve lo que él crea), carpeta `red-backups`.

| | |
|---|---|
| Qué guarda | dump de la base de RED, dump de la base de n8n, `infra/.env.prd` e `infra/.env.n8n`, commit y `RED_TAG` desplegados |
| Script | `infra/servidor/backup.sh [tag]` (ruta fija de staging, para que restic suba solo lo que cambió) |
| Cuándo | timer de systemd **de usuario** `red-backup.timer`, todos los días 03:30 (+ hasta 10 min al azar), `Persistent=true`. Requiere `loginctl enable-linger fiba` (hecho) |
| Retención | 7 diarios, 4 semanales, 6 mensuales (`restic forget --prune`) |
| Verificación | los domingos `restic check --read-data-subset=1/10`; restauración completa con `infra/servidor/probar-restore.sh` (base descartable, compara filas contra la viva) |
| Clave | `RESTIC_PASSWORD` en `/srv/red/secretos/restic_password` (`600`, generada en el servidor) **y en el gestor de contraseñas del titular**. Sin ella los backups no se pueden abrir |
| Versiones | restic 0.16.4 y rclone 1.60.1 de Ubuntu (reciben parches por `unattended-upgrades`) |

Comandos útiles (en el servidor):

```bash
systemctl --user list-timers red-backup.timer           # próxima corrida
journalctl --user -u red-backup.service -o cat | tail   # log de la última
/srv/red/repo/infra/servidor/backup.sh manual           # backup a mano
/srv/red/repo/infra/servidor/probar-restore.sh          # prueba de restauración
```

**Cómo se conectó rclone** (si hay que rehacerlo): en la PC, `rclone authorize "drive"
"eyJzY29wZSI6ImRyaXZlLmZpbGUifQ"` (base64 **sin** padding de `{"scope":"drive.file"}`), iniciar
sesión con la cuenta de backups, y pegar el bloque que imprime en
`ssh -t red-prd /srv/red/repo/infra/servidor/configurar-rclone.sh` (acepta el JSON viejo o el
base64 de rclone ≥ 1.56).

**Cupo de Google:** sin credencial propia, rclone usa la aplicación OAuth compartida por todos sus
usuarios, y el 2026-11-22 dio `403 rateLimitExceeded` en varios pedidos (los reintentos lo
resolvieron; un backup de 180 KB tardó ~4 min). Lo definitivo es una credencial OAuth propia
(proyecto en Google Cloud con la cuenta de backups, Drive API habilitada, cliente "Desktop",
pantalla de consentimiento **publicada**: en modo prueba el token vence a los 7 días) y repetir la
autorización con `rclone authorize "drive" <client_id> <client_secret>`.
