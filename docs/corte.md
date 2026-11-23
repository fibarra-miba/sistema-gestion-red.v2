# Corte de PRD: VM → servidor — Sistema RED

Guion del paso 8 de la Fase 0 ([estado.md](estado.md) §3): llevar PRD con los datos reales de la VM
(`192.168.10.11`) al servidor (`red.fiba-soluciones.com.ar`). Escrito el 2026-11-22 a partir de un
relevamiento de solo lectura de los dos hosts (abajo). Cada paso tiene **comando exacto**,
**verificación** y **cómo volver atrás**. No se avanza al paso siguiente si la verificación falla.

> **Ejecutado el 2026-11-22** (22:04–22:50). Resultado y lecciones al final, en
> [Ejecución](#ejecución-2026-11-22). Si se reusa este guion (p. ej. para mudar de proveedor),
> leer primero esa sección: tiene tres correcciones a los comandos de abajo.

**Decisión del titular:** PRD viaja **exactamente como está** (sin cambios desde el 2026-10-05). Las
correcciones de datos se hacen después del corte, en el servidor.

**Reglas durante el corte**
- Cada comando en la VM o el servidor lo aprueba el titular. Lo interactivo (contraseñas, navegador)
  lo hace él.
- PRD tiene datos reales: **nunca** `reset`, `nuke`, `down -v` ni `restore` del launcher sobre la VM.
- El dump real y el export de n8n viajan **directo VM → servidor** (agente SSH reenviado). Nunca
  pasan por la PC ni por el chat. El export de credenciales está **en claro**: se borra apenas se
  importa.
- No correr el corte entre las 03:00 y las 04:00 (timer de la VM los domingos 03:00, timer del
  servidor 03:30).

**Corte de servicio:** del paso C al paso H (~30–45 min). n8n de la VM no hace nada productivo hoy
(su webhook apunta a un túnel ngrok que no está levantado), así que no se pierde nada por ese lado.

---

## Relevamiento previo (2026-11-22, solo lectura)

| | VM | Servidor |
|---|---|---|
| Repo | `~/projects/sistema-red-cloude`, `7c0791f` | `/srv/red/repo`, `be2c307` |
| PRD | `red_prd_{postgres,api,frontend,proxy}` arriba, proyecto `red_prd` | `red_prd_{postgres,proxy,socket_proxy,n8n,postgres_n8n}` arriba; **api y frontend bajados** |
| Base | `red_prd` / usuario `red_prd`, `pgvector/pgvector:pg16` | `red_prd` / usuario `red_prd`, `pgvector 0.8.7-pg16-bookworm`, **datos de prueba** |
| Migraciones | 8 aplicadas, 0 pendientes | 8 aplicadas, 0 pendientes (el dump trae su propio ledger) |
| n8n | 2.19.4, contenedores `n8n_local` y `postgres_n8n_local`, **proyecto compose `infra`** (no `red_prd`), `restart: always` | 2.48.7, `red_prd_n8n`; **sin cuenta de dueño** (`showSetupOnFirstLoad: true`) |
| Env | `RED_SEED=0` | `RED_MODO=servidor`, `RED_TAG=sha-4642713`, `RED_SEED=0`, `acme-v02` |
| Clave de host del servidor | **ausente** en `~/.ssh/known_hosts` de `admin` | ED25519 `SHA256:eWhkJFoefoyypwkfbOVZlP0ysrGmfQFwz7h0km9evAg` (la misma que tiene la PC en su `known_hosts`) |
| Herramientas | `jq`, `sha256sum`, `scp` | **sin `jq`**: lo que procesa JSON corre con `node` dentro del contenedor de n8n |
| Backups | timer `red-backup-prd.timer` (domingos 03:00) | timer `red-backup.timer` (diario 03:30) |

Todos los comandos se corren **desde Git Bash en la PC** (no PowerShell: rompe las comillas). Los
bloques de varias líneas van por `bash -s <<'EOF'` para que nada se expanda en la PC. Al principio
de cada sesión de Git Bash:

```bash
export SSH_AUTH_SOCK=/c/Users/facun/.ssh/agent.sock
ssh-add -l        # deben figurar red-prd y red_vm, en ese orden
```

Si el agente no responde: `ssh-agent -a /c/Users/facun/.ssh/agent.sock -t 4h` y el titular carga
las claves en su CMD (servidor.md §2). El orden importa en el paso E: el agente reenviado ofrece
primero `red_prd` y el servidor admite 3 intentos.

---

## A. Red de seguridad (antes de tocar nada)

1. **Snapshot en Hostinger** (panel → VPS → Snapshots). Reemplaza la del 2026-11-22 19:07. El
   titular confirma en el chat la fecha y hora de la nueva.
2. **Copia de claves al gestor de contraseñas** (pendiente de secretos.md). El titular, en **su**
   CMD (no en el panel de la app), y copia el valor a mano al gestor:

   ```bat
   set "SSH_AUTH_SOCK=/c/Users/facun/.ssh/agent.sock"
   "C:\Program Files\Git\usr\bin\ssh.exe" -t red-prd "grep ^N8N_ENCRYPTION_KEY= /srv/red/repo/infra/.env.n8n; cat /srv/red/secretos/restic_password"
   ```

   Después confirma en el chat "claves copiadas" (sin pegar nada).
3. **Backup etiquetado de PRD en la VM** (con la app todavía arriba):

   ```bash
   ssh -o BatchMode=yes red-vm 'cd ~/projects/sistema-red-cloude && ./red prd backup pre-corte && ls -l infra/backups/prd | tail -3'
   ```

**Verificación:** snapshot con fecha de hoy; claves copiadas; `Backup OK` y el archivo
`red_prd_<fecha>_pre-corte.dump` con tamaño parecido a los anteriores (~300 KB).
**Volver atrás:** no hay nada que deshacer.

## B. Cuenta de dueño en n8n del servidor

El editor solo escucha en `127.0.0.1` del servidor. El titular abre el túnel en **su** CMD y lo
deja abierto hasta el paso H:

```bat
set "SSH_AUTH_SOCK=/c/Users/facun/.ssh/agent.sock"
"C:\Program Files\Git\usr\bin\ssh.exe" -N -L 5678:127.0.0.1:5678 red-prd
```

En CMD, `ssh` a secas es el OpenSSH de Windows: no lee el socket del agente de Git y pide la
passphrase. Por eso va la ruta completa del de Git (igual en A2).

En el navegador, `http://localhost:5678` → pantalla de alta del dueño: mail y contraseña del
titular (contraseña nueva, al gestor). Si ofrece registrar la licencia gratuita, es opcional.

**Verificación:** desde la PC

```bash
ssh -o BatchMode=yes red-prd 'curl -s 127.0.0.1:5678/rest/settings | grep -o "\"showSetupOnFirstLoad\":[a-z]*"'
```

debe dar `false`. **Volver atrás:** no hace falta; la base de n8n del servidor no tiene nada más.

## C. Congelar PRD en la VM

Baja api y frontend; la base queda viva para el dump. `restart=no` evita que vuelvan solos si la VM
o Docker se reinician (con `restart: always`, un `docker stop` se deshace al reiniciar el demonio).

```bash
ssh -o BatchMode=yes red-vm bash -s <<'EOF'
set -euo pipefail
docker update --restart=no red_prd_api red_prd_frontend >/dev/null
docker stop red_prd_api red_prd_frontend
docker ps -a --filter name=red_prd --format '{{.Names}}\t{{.Status}}'
echo "front: $(curl -sk -o /dev/null -w '%{http_code}' --resolve red.localhost:443:127.0.0.1 https://red.localhost/)"
echo "api:   $(curl -sk -o /dev/null -w '%{http_code}' --resolve red.localhost:443:127.0.0.1 https://red.localhost/api/health)"
EOF
```

**Verificación:** `red_prd_api` y `red_prd_frontend` en `Exited`, `red_prd_postgres` `Up (healthy)`,
front y api con código distinto de 200 (404/502/503).
**Volver atrás:**
`ssh red-vm 'docker update --restart=always red_prd_api red_prd_frontend && docker start red_prd_api red_prd_frontend'`.

## D. Dump final y export de n8n en la VM

```bash
ssh -o BatchMode=yes red-vm bash -s <<'EOF'
set -euo pipefail
cd ~/projects/sistema-red-cloude
./red prd backup corte-final
ls -l infra/backups/prd/*_corte-final.dump

# Export de n8n: workflows y credencial DESCIFRADA (se borra en el paso G).
umask 077
rm -rf ~/corte-n8n && mkdir -m 700 ~/corte-n8n
docker exec n8n_local sh -c 'rm -rf /tmp/corte && mkdir -p /tmp/corte \
  && n8n export:workflow --all --output=/tmp/corte/workflows.json \
  && n8n export:credentials --all --decrypted --output=/tmp/corte/credenciales.json' >/dev/null
docker cp n8n_local:/tmp/corte/workflows.json ~/corte-n8n/
docker cp n8n_local:/tmp/corte/credenciales.json ~/corte-n8n/
docker exec n8n_local rm -rf /tmp/corte
chmod 600 ~/corte-n8n/*

# Resumen sin secretos.
jq -r '.[] | "workflow:   \(.name) | activo: \(.active) | id: \(.id)"' ~/corte-n8n/workflows.json
jq -r '.[] | "credencial: \(.name) | tipo: \(.type) | id: \(.id)"' ~/corte-n8n/credenciales.json

# n8n de la VM queda apagado y sin reinicio automático: si volviera a arrancar con el
# workflow activo, re-registraría el webhook de Telegram hacia la VM.
docker update --restart=no n8n_local postgres_n8n_local >/dev/null
docker stop n8n_local postgres_n8n_local
EOF
```

**Verificación:** `Backup OK`; 2 workflows ("Telegram" activo, "Gmail" inactivo) y 1 credencial
`telegramApi`; `n8n_local` y `postgres_n8n_local` detenidos.
**Volver atrás:** `ssh red-vm 'rm -rf ~/corte-n8n; docker update --restart=always n8n_local postgres_n8n_local && docker start postgres_n8n_local n8n_local'`
(y el "volver atrás" de C). El dump `corte-final` puede quedar: es un backup más.

## E. Copia directa VM → servidor

**E1. Clave de host del servidor en la VM**, verificada contra la huella conocida (la del
relevamiento, que coincide con la de la PC). Solo se agrega si coincide:

```bash
ssh -o BatchMode=yes red-vm bash -s <<'EOF'
set -euo pipefail
ESPERADA=SHA256:eWhkJFoefoyypwkfbOVZlP0ysrGmfQFwz7h0km9evAg
ssh-keyscan -t ed25519 187.53.102.246 2>/dev/null > /tmp/srv.key
OBTENIDA=$(ssh-keygen -lf /tmp/srv.key | awk '{print $2}')
echo "obtenida: $OBTENIDA"
if [ "$OBTENIDA" = "$ESPERADA" ]; then
  cat /tmp/srv.key >> ~/.ssh/known_hosts; rm -f /tmp/srv.key; echo "OK: agregada a known_hosts"
else
  rm -f /tmp/srv.key; echo "NO COINCIDE: no se agrega"; exit 1
fi
EOF
```

**E2. Copia con el agente reenviado** (`-A`: la VM usa la clave `red_prd` de la PC sin tenerla):

```bash
ssh -A -o BatchMode=yes red-vm bash -s <<'EOF'
set -euo pipefail
SRV=fiba@187.53.102.246
SSHO="-o BatchMode=yes -o StrictHostKeyChecking=yes"
DUMP=$(ls -1t ~/projects/sistema-red-cloude/infra/backups/prd/*_corte-final.dump | head -n 1)
echo "dump: $(basename "$DUMP")"
ssh $SSHO $SRV 'install -d -m 700 /srv/red/corte'
scp -q $SSHO "$DUMP" $SRV:/srv/red/corte/red_prd.dump
scp -q $SSHO ~/corte-n8n/workflows.json ~/corte-n8n/credenciales.json $SRV:/srv/red/corte/
echo "== sha256 en la VM";      sha256sum "$DUMP" ~/corte-n8n/workflows.json ~/corte-n8n/credenciales.json | awk '{print $1}'
echo "== sha256 en el servidor"; ssh $SSHO $SRV 'cd /srv/red/corte && chmod 600 * && sha256sum red_prd.dump workflows.json credenciales.json' | awk '{print $1}'
EOF
```

**Verificación:** las tres sumas iguales en el mismo orden. **Volver atrás:**
`ssh red-prd 'rm -rf /srv/red/corte'` (y opcionalmente sacar la línea del servidor de
`~/.ssh/known_hosts` de la VM con `ssh-keygen -R 187.53.102.246`).

## F. Restore en el servidor y comparación de filas

**F1. Base limpia + restore.** La base del servidor tiene solo datos de prueba: se descarta entera
(`DROP DATABASE` + `CREATE DATABASE` en el mismo volumen; el init no se vuelve a correr). El restore
va en **una transacción** y frena ante el primer error: o entra todo o no entra nada.

```bash
ssh -o BatchMode=yes red-prd bash -s <<'EOF'
set -euo pipefail
cd /srv/red/repo
set -a; . infra/.env.prd; set +a
if docker ps --format '{{.Names}}' | grep -qE '^red_prd_(api|frontend)$'; then
  echo "api o frontend están arriba: no se toca la base"; exit 1
fi
docker exec -i red_prd_postgres psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE \"$POSTGRES_DB\" WITH (FORCE);" \
  -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"
docker exec -i red_prd_postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --no-owner --exit-on-error --single-transaction < /srv/red/corte/red_prd.dump
echo "restore OK"
./red prd migrations | tail -n 2
EOF
```

**F2. Comparación tabla por tabla** (misma consulta que `infra/servidor/probar-restore.sh`, en los
dos hosts; la salida son solo nombres de tabla y cantidades):

```bash
CONTAR=$(cat <<'EOF'
q() { docker exec -i red_prd_postgres psql -U red_prd -d red_prd -v ON_ERROR_STOP=1 -tA "$@"; }
q -c "SELECT format('SELECT %L || ''|'' || count(*) FROM %I.%I;', n.nspname || '.' || c.relname, n.nspname, c.relname)
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r' AND n.nspname IN ('public', 'red_ai') ORDER BY 1" | q
EOF
)
mkdir -p /tmp/corte-red
ssh -o BatchMode=yes red-vm  bash -s <<<"$CONTAR" > /tmp/corte-red/filas_vm.txt
ssh -o BatchMode=yes red-prd bash -s <<<"$CONTAR" > /tmp/corte-red/filas_servidor.txt
wc -l /tmp/corte-red/filas_*.txt
diff /tmp/corte-red/filas_vm.txt /tmp/corte-red/filas_servidor.txt && echo "OK: mismas filas en todas las tablas"
grep -E '^public\.(clientes|contratos|pagos)\|' /tmp/corte-red/filas_servidor.txt
```

**Verificación:** `restore OK`; `Pendientes: 0`; la misma cantidad de líneas en los dos archivos (la prueba de
restore del servidor dio 84 tablas); `diff` sin
diferencias; clientes 26, contratos 26, pagos 25 (estado.md §3 paso 7; si los nombres de tabla
difieren, alcanza con el `diff`).
**Volver atrás:** la VM sigue intacta. En el servidor, repetir F1 (es idempotente) o restaurar la
snapshot de Hostinger del paso A.

## G. Levantar todo en el servidor e importar n8n

**G1. Levantar** (RED_SEED=0 ya está; el launcher igual se niega con 1):

```bash
ssh -o BatchMode=yes red-prd bash -s <<'EOF'
set -euo pipefail
cd /srv/red/repo
grep -qE '^RED_SEED=0' infra/.env.prd || { echo "RED_SEED no es 0"; exit 1; }
./red prd up-n8n
sleep 40
docker ps --format '{{.Names}}\t{{.Status}}' | sort
EOF
curl -s -o /dev/null -w 'front %{http_code}\n' https://red.fiba-soluciones.com.ar/
curl -s -w '\n' https://red.fiba-soluciones.com.ar/api/health
```

**Verificación:** los 7 contenedores `red_prd_*` arriba (api y frontend `healthy`), front 200,
health OK.

**G2. Import de n8n y borrado del export en claro** (en los dos hosts):

```bash
ssh -o BatchMode=yes red-prd bash -s <<'EOF'
set -euo pipefail
N=red_prd_n8n
docker exec $N sh -c 'rm -rf /tmp/corte && mkdir -p /tmp/corte'
docker cp /srv/red/corte/credenciales.json $N:/tmp/corte/
docker cp /srv/red/corte/workflows.json    $N:/tmp/corte/
docker exec $N n8n import:credentials --input=/tmp/corte/credenciales.json
docker exec $N n8n import:workflow    --input=/tmp/corte/workflows.json
docker exec $N rm -rf /tmp/corte
shred -u /srv/red/corte/credenciales.json /srv/red/corte/workflows.json
docker exec $N n8n list:workflow
ls -la /srv/red/corte
EOF
ssh -o BatchMode=yes red-vm 'shred -u ~/corte-n8n/* && rmdir ~/corte-n8n && echo "export borrado en la VM"'
```

**Verificación:** `list:workflow` muestra los 2 workflows; en `/srv/red/corte` solo queda
`red_prd.dump`; en la VM ya no existe `~/corte-n8n`.

**G3. Activar el workflow de Telegram.** El import los deja **inactivos**. El titular, en
`http://localhost:5678` (túnel del paso B): abrir "Telegram", revisar que el nodo use la credencial
importada, y activarlo (en n8n 2.x: **Publish** / interruptor de activo). "Gmail" queda inactivo.

**G4. Verificar que Telegram registró el webhook nuevo.** Pregunta a Telegram (`getWebhookInfo`)
con el token de la credencial, que se lee y se usa dentro del contenedor sin imprimirse:

```bash
ssh -o BatchMode=yes red-prd bash -s <<'EOF'
docker exec red_prd_n8n sh -c 'n8n export:credentials --all --decrypted --output=/tmp/c.json >/dev/null 2>&1; node -e "
const c=require(\"/tmp/c.json\").find(x=>x.type===\"telegramApi\");
fetch(\"https://api.telegram.org/bot\"+c.data.accessToken+\"/getWebhookInfo\").then(r=>r.json())
 .then(j=>console.log(JSON.stringify({url:j.result.url,pendientes:j.result.pending_update_count,ultimo_error:j.result.last_error_message||null})))
 .catch(e=>console.log(\"error:\",(e.cause&&e.cause.code)||e.name))"; rm -f /tmp/c.json'
EOF
```

**Verificación:** `url` empieza con `https://red.fiba-soluciones.com.ar/webhook/` (ya no ngrok) y
`ultimo_error` es `null`. Si Telegram tenía mensajes encolados de antes, pueden llegar ahora (el
workflow solo responde un mensaje).
**Volver atrás (G):** `ssh red-prd 'docker stop red_prd_api red_prd_frontend'` deja el sitio en 404
otra vez y se vuelve a la VM con el "volver atrás" de C y D. n8n del servidor puede quedar como
está (el de la VM conserva todo).

## H. Prueba del titular

1. `https://red.fiba-soluciones.com.ar` → entrar con **su usuario real de PRD** (el de la VM; las
   contraseñas viajaron como hash en el dump).
2. Recorrer: clientes (26, los 4 `S/D`), contratos, pagos y la última actividad (cobros y recibos de
   garantías), facturación de 10/2026, auditoría.
3. Telegram: mandar un mensaje al bot → responde. En el editor de n8n, la ejecución aparece en
   verde. Repetir G4: `pendientes` 0 y sin error.
4. Cerrar el túnel del paso B (Ctrl+C en su CMD).

**Verificación:** el titular dice "OK" en el chat. Si algo de datos no cierra, se anota para las
correcciones post-corte; si algo **no anda**, "volver atrás" de G.

**A partir de acá el servidor es PRD.** Si hay que volver a la VM después de que se cargaron datos
nuevos en el servidor, primero `./red prd backup vuelta-a-vm` en el servidor y llevar ese dump a la
VM por el mismo camino del paso E, en sentido inverso.

## I. Backup inmediato y monitoreo externo

```bash
ssh -o BatchMode=yes red-prd '/srv/red/repo/infra/servidor/backup.sh corte'
```

Puede tardar unos minutos (cupo compartido de rclone, servidor.md §7). **Verificación:** termina con
`OK. Último snapshot:` y una línea con el tag `corte`. Recién entonces se borra el dump de
transferencia:

```bash
ssh -o BatchMode=yes red-prd 'shred -u /srv/red/corte/red_prd.dump && rmdir /srv/red/corte && ls /srv/red'
```

**Monitoreo externo** (cuenta del titular, la crea él; p. ej. UptimeRobot o Better Stack, plan
gratuito, con 2FA):
- Monitor HTTPS a `https://red.fiba-soluciones.com.ar/api/health`, cada 5 min, alerta por mail (y
  Telegram si lo ofrece).
- Aviso de vencimiento del certificado, si el servicio lo tiene.
- Probarlo: `ssh red-prd 'docker stop red_prd_api'`, esperar la alerta, `./red prd up-n8n` en
  `/srv/red/repo` para levantarlo de nuevo. (Opcional; corta el servicio unos minutos.)

Esto **no** cubre las alertas de backup fallido (sigue pendiente).

## J. La VM queda apagada como respaldo

PRD de la VM apagado **sin borrar nada** (contenedores, volumen `red_prd_pgdata`, imágenes y
backups quedan), sin reinicio automático, y su timer de backup desactivado:

```bash
ssh -o BatchMode=yes red-vm bash -s <<'EOF'
set -euo pipefail
systemctl --user disable --now red-backup-prd.timer
docker update --restart=no red_prd_postgres red_prd_proxy >/dev/null
docker stop red_prd_proxy red_prd_postgres
docker ps -a --filter name=red_prd --filter name=n8n_local --format '{{.Names}}\t{{.Status}}'
docker volume ls --format '{{.Name}}' | grep -E '^red_prd_|^infra_'
systemctl --user is-enabled red-backup-prd.timer || true
EOF
```

**Verificación:** los 4 `red_prd_*` y los 2 de n8n en `Exited`; `red_prd_pgdata` y los volúmenes
`infra_*` de n8n presentes; timer `disabled`. DEV y los otros stacks de la VM no se tocan.
**Volver atrás:**

```bash
ssh red-vm 'docker update --restart=always red_prd_postgres red_prd_proxy red_prd_api red_prd_frontend \
  && docker start red_prd_postgres red_prd_proxy red_prd_api red_prd_frontend \
  && systemctl --user enable --now red-backup-prd.timer'
```

Cuánto tiempo queda así y cuándo se libera (Fase 1) lo decide el titular.

## Al terminar

- estado.md: Fase 0 cerrada, pasos 6 y 8 hechos, PRD en el servidor; la VM con PRD apagado.
- servidor.md: estado "en producción", n8n con dueño y workflows migrados, snapshot nueva,
  monitoreo externo, el webhook de Telegram.
- secretos.md: claves copiadas al gestor; cuenta del monitoreo externo; cuenta de dueño de n8n.
- Commit en v2, `./red sync-plataforma` y push a los dos repos (con permiso del titular).

---

## Ejecución (2026-11-22)

| Paso | Hora | Resultado |
|---|---|---|
| A | 22:04 | Snapshot de Hostinger nueva, `N8N_ENCRYPTION_KEY` y `RESTIC_PASSWORD` en el gestor, backup `pre-corte` en la VM (340491 bytes, igual a los anteriores: la base no había cambiado) |
| B | 22:20 | Dueño de n8n creado (`showSetupOnFirstLoad: false`) |
| C | 22:23 | VM congelada (front y api 404) |
| D | 22:23 | Dump `red_prd_20261122_222353_corte-final.dump`; 2 workflows ("Telegram" activo, "Gmail" inactivo) y 1 credencial `telegramApi`; n8n de la VM apagado |
| E | 22:25 | Huella del servidor verificada; las 3 sumas sha256 iguales en los dos hosts |
| F | 22:25 | Restore en una transacción, 0 migraciones pendientes; **84 tablas con las mismas filas** (831 en total: 26 clientes, 26 contratos, 25 pagos, 1 usuario) |
| G | 22:26–22:29 | Todo arriba (front 200, health ok); import de n8n (el import desactiva los workflows); export en claro borrado con `shred` en los dos hosts; Telegram activado y webhook registrado en `https://red.fiba-soluciones.com.ar/webhook/…` sin errores |
| — | 22:31–22:44 | **Incidente `admin`/`admin`** (abajo). Sitio bajado, `admin` bloqueado, ADMIN personal del titular |
| H | 22:44 | El titular recorrió los datos con su usuario; Telegram respondió (ejecución en verde) |
| I | 22:43–22:47 | Backup `corte` a Google Drive con restic (snapshot `f0cc0aa4`); dump de transferencia borrado con `shred` del servidor. Monitoreo externo: a cargo del titular |
| J | 22:46 | PRD y n8n de la VM detenidos con `restart=no`, volúmenes intactos, `red-backup-prd.timer` deshabilitado. DEV de la VM sigue |

Corte de servicio real: 22:23 → 22:44.

### Incidente: `admin`/`admin` en PRD real

La PRD de la VM tenía **un solo usuario, `admin`, con la contraseña de fábrica**: era un pendiente
anotado (operacion.md, estado.md §4) que nunca se resolvió, y en la VM no se notaba porque solo era
accesible desde la LAN. El guion no lo cubría (falla del guion: debió revisarse antes de exponer el
sitio). El admin propio que el titular había creado en el servidor estaba en la base de prueba,
descartada en F.

- Expuesto en Internet de 22:26 a 22:31. **Un solo ingreso**, el del titular (22:30:43, 2 intentos
  fallidos antes), según `sesiones_usuarios`, `auditoria_eventos` y el log de la API.
- 22:31: `docker stop` de api y frontend con `restart=no` (sitio 404).
- 22:40: backup `pre-bloqueo-admin` y, en una transacción, hash de `admin` inutilizable, sus 15
  sesiones revocadas (ninguna vigente) y evento `CORRECCION_DATOS` (auditoría 307).
- 22:41: api y frontend arriba; `admin`/`admin` da 401. El titular creó su ADMIN `fibarra` con
  `./red prd create-admin`, cambió la contraseña y desactivó `admin` desde la UI.

**Lección:** antes de exponer una base, listar sus usuarios y confirmar que ninguno tiene una
contraseña conocida. Pendiente aparte: la API registra la IP de Traefik y no la del cliente.

### Correcciones a los comandos del guion

1. **`./red prd backup` dentro de `ssh … bash -s <<'EOF'` se come el resto del script** (usa
   `docker compose exec -T`, que lee stdin). En D cortó el script después del dump sin error. Todo
   comando que lea stdin (`docker compose exec`, `docker exec -i`, `ssh`) va con `</dev/null` o
   `ssh -n` dentro de esos bloques.
2. **Túnel al editor de n8n:** en CMD, `ssh` es el OpenSSH de Windows (no usa el agente de Git y
   pide la passphrase); hay que usar `"C:\Program Files\Git\usr\bin\ssh.exe"`. Aun así el túnel del
   titular se cayó sin aviso; lo que funcionó fue abrirlo desde Git Bash en segundo plano con
   `ssh -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -N -L 127.0.0.1:5678:127.0.0.1:5678 red-prd`
   y abrir **`http://127.0.0.1:5678`**: Chrome resuelve `localhost` primero a `::1` y el túnel
   escucha solo en IPv4.
3. **`./red prd up-n8n` recreó `red_prd_postgres`** (los datos están en el volumen; se verificó con
   un conteo después). No es un problema, pero no sorprenderse.

Observado al importar: n8n 2.48.7 avisa que **Postgres 16 está fuera del rango soportado** ("Upgrade
to Postgres 17 or newer"); por ahora es compatibilidad. Planificar la subida de la base de n8n.
