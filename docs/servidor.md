# Servidor de PRD — Sistema RED

Qué servidor tiene PRD, cómo se llega a él y qué configuración tiene aplicada. Sirve para revisar el
host y para rehacerlo desde cero si hiciera falta. **Ningún secreto va acá**: solo dónde vive cada
uno (ver [secretos.md](secretos.md)).

Estado: **host listo, sin el sistema desplegado** (2026-11-10). Todavía no sirve nada.

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
- El agente **no trabaja dentro del servidor**: los comandos los corre el titular por SSH.

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
seguridad para cambios grandes, no un backup. Hay una `base-endurecida` del 2026-11-10 (vence el
2026-11-11): antes de cada etapa grande se saca una nueva.

## 5. Lo que falta en el host

Se arma con la adaptación del proyecto (ver [estado.md](estado.md) §3):

- Estructura de directorios (`/srv/...`) y clon del repo con una **deploy key de solo lectura**.
- Env file de PRD (`600`), token de lectura de GHCR, token de Cloudflare para el certificado.
- Traefik con certificado real de Let's Encrypt por DNS-01; `docker-socket-proxy` delante.
- Backups: restic + rclone a Google Drive, timer diario y prueba de restauración.
- n8n: editor sin exponer (Cloudflare Tunnel + Access), solo `/webhook/*` público.
- Monitoreo externo de uptime.
