# Asistente de RED por Telegram (voz y texto)

Diseño acordado el 2026-11-23. El titular le habla al sistema por Telegram, con texto o audio: le
pregunta cosas y, más adelante, le pide altas (clientes, contratos, instalaciones, cobros).

**Decisiones del titular:** el modelo es **Gemini** (entiende audio directamente: un solo llamado
transcribe y razona) y **n8n orquesta**: arma el contexto, llama al backend y devuelve la respuesta.
**El backend ejecuta todo**: n8n nunca toca la base. El bot que ya existe pasa a ser el de **DEV**;
para PRD se crea uno nuevo.

## 1. Flujo

```
Telegram (texto o audio)
  → n8n · workflow "Asistente RED"
      1. Comandos y botones sin modelo (/start, /id, /ayuda, Confirmar/Cancelar)
      2. ¿Vinculado?  POST /asistente/sesion  → sesión de su usuario de RED (30 min)
      3. Si es audio: se baja de Telegram y lo transcribe un modelo liviano (Flash-Lite)
      4. Agente de IA (Gemini Flash) + herramientas HTTP → /asistente/* del backend
      5. Gemini redacta con lo que devolvió el backend
  → Telegram: texto (más adelante, también audio)
```

## 2. Seguridad

- **Vinculación Telegram ↔ usuario de RED** (tabla `usuarios_telegram`). La hace un ADMIN con
  `./red [env] vincular-telegram <usuario> <telegram_id>`. El ID lo informa el bot con `/id`. Cualquier
  cuenta de Telegram sin vincular recibe solo su ID y nada más.
- **El bot actúa como el usuario vinculado.** `POST /asistente/sesion` crea una sesión normal de ese
  usuario y desde ahí n8n llama con esa cookie. Aplican **sus permisos por rol** y la auditoría
  registra a ese usuario. El canal queda en `user_agent_auditoria` (`RED-Asistente/telegram`).
- **`/asistente/sesion` es solo para la red interna:**
  - exige el header `X-Asistente-Secreto` (`ASISTENTE_SECRETO` en el env del api, comparado en
    tiempo constante);
  - **rechaza cualquier pedido con `X-Forwarded-For`**, es decir, todo lo que entra por Traefik.
    n8n llama al api por la red interna de Docker, sin proxy en el medio;
  - si `ASISTENTE_SECRETO` no está definido, el endpoint queda apagado (503).
- **Escrituras (Fase B): siempre con confirmación humana.** El agente no ejecuta altas: crea una
  *propuesta* en el backend (`/asistente/propuestas`) y n8n la muestra con botones
  **Confirmar / Cancelar**. Al confirmar, el backend ejecuta la operación por la misma ruta de la API
  que usa la web, con su validación y su auditoría. La propuesta vence, se ejecuta una sola vez y
  siempre a nombre de quien la creó.

## 3. Ahorro de tokens (requisito de diseño)

Lo que más gasta en un agente es el contexto que relee en cada vuelta: prompt, herramientas, memoria
y respuestas de las herramientas. Cada punto apunta a eso:

1. **Fachada compacta `/asistente/*`.** El agente nunca recibe el JSON completo de la API. Una
   consulta por herramienta devuelve solo los campos que sirven para responder, con nombres cortos,
   sin IDs internos que no va a usar y con listas acotadas (búsqueda: máximo 5). Ejemplo: la ficha de
   un cliente en una sola respuesta (datos, domicilio, contratos, saldo, garantías y próxima
   instalación), en vez de 4 llamados a la API general.
2. **Pocas herramientas por fase, con descripciones de una línea.** En la Fase A son 5. Cada una
   tiene un parámetro o dos.
3. **Prompt de sistema corto y fijo al principio.** Gemini reaprovecha los prefijos iguales (caché
   implícita), así que el rol, las reglas y las herramientas van primero y siempre idénticos. Lo
   variable (fecha de hoy, nombre del usuario) va **al final**.
4. **Memoria corta.** Ventana de los últimos 6 mensajes por chat. Las respuestas de las
   herramientas no quedan en la memoria: si hace falta, se vuelve a consultar.
5. **Topes por ejecución.** Máximo 4 vueltas de herramientas por mensaje y respuestas breves (estilo
   chat).
6. **Lo que no necesita modelo, no lo usa.** Los comandos (`/start`, `/id`, `/ayuda`), los botones
   de confirmación y el rechazo a cuentas no vinculadas los resuelve n8n directo.
7. **Audio: transcripción corta y barata.** La idea era mandar el audio en el mismo llamado, pero el
   agente de n8n (2.48) solo le pasa imágenes al modelo. Por eso el audio lo transcribe antes un
   modelo Flash-Lite (unos 32 tokens por segundo de audio) y al agente le llega texto. Tope: audios
   de hasta 2 minutos.
8. **Medir.** Se miran los tokens de cada ejecución (en n8n, la salida del nodo del modelo) antes
   de sumar herramientas o subir de modelo. Medido en DEV el 2026-11-23 con `gemini-3.8-flash`:

   | Consulta | Llamados al modelo | Tokens (entrada + salida) |
   |---|---|---|
   | Comando (`/id`, `/ayuda`) | 0 | 0 |
   | "¿Qué planes hay?" (1 herramienta) | 2 | 1.426 |
   | Repregunta que se responde con la memoria | 1 | 872 |
   | Buscar un cliente y abrir su ficha (2 herramientas) | 3 | 3.599 |
   | Audio que se responde con la memoria | 1 (+ transcripción) | 1.307 |

   El piso de cada llamado es de unos 600 tokens (prompt y herramientas): ahí funciona la caché
   implícita. **Ajuste anotado:** ante "¿cuántos Juan hay?" el agente abrió además la ficha, que no
   hacía falta (unos 1.500 tokens de más). Afinar la regla del prompt para que la ficha se pida
   solo cuando la pregunta la necesita.

## 4. Herramientas por fase

**Fase A — consultas** (backend implementado, ver §5):

| Herramienta | Endpoint | Roles |
|---|---|---|
| `buscar_cliente(q)` | `GET /asistente/clientes?q=` (nombre, apellido, DNI o teléfono; máx. 5) | ADMIN, OPERADOR, COBRANZAS |
| `ficha_cliente(id)` | `GET /asistente/clientes/{id}` | ADMIN, OPERADOR, COBRANZAS |
| `agenda_instalaciones(desde, hasta)` | `GET /asistente/agenda` (por defecto, los próximos 7 días) | ADMIN, OPERADOR, TECNICO |
| `resumen()` | `GET /asistente/resumen` | ADMIN, OPERADOR, COBRANZAS |
| `planes()` | `GET /asistente/planes` (con precio vigente) | Cualquier usuario autenticado |

**Fase B — altas con confirmación:** alta completa de cliente (cliente, domicilio, contrato e
instalación: `onboarding`), contrato nuevo, programar o reprogramar una instalación, registrar un
pago, cobrar una garantía.

**Fase C — el resto:** transiciones de contrato (suspender, reanudar, cancelar, cambiar de plan),
completar una instalación, respuesta en audio, avisos automáticos (por ejemplo, la agenda del día
siguiente).

## 5. Backend (Fase A)

- Tabla `usuarios_telegram` (migración `20261123_asistente_telegram.sql`, en las dos copias del
  schema).
- `app/routes/asistente.py` + `app/services/asistente_service.py` +
  `app/repositories/asistente_repo.py`. La fachada es de solo lectura: una consulta SQL por
  herramienta. Fechas en hora argentina y en formato corto (`2026-11-24 10:30`); los días del
  negocio se calculan en UTC−3, no en UTC.
- CLI `app/cli/vincular_telegram.py` (vincular, desvincular y listar) detrás de `./red`.
- Variables del api: `ASISTENTE_SECRETO` (obligatoria para habilitarlo) y
  `ASISTENTE_SESION_MINUTOS` (default 30).

## 6. n8n

- Workflows versionados en `infra/n8n/workflows/`, exportados sin credenciales. Las credenciales
  (token del bot, API key de Gemini, el secreto) se cargan en cada n8n y nunca van a git.
- Desde n8n el api se llama por la red interna: `http://api:8000/...`.
- **DEV:** n8n de la VM (`./red up-n8n`, puerto 5678). El Telegram Trigger necesita un webhook
  público y la VM no recibe conexiones, así que se usa un túnel cloudflared temporal.
- **El bot actual pasa a DEV.** Se le **revocó el token** en BotFather (2026-11-23): el n8n del
  servidor quedó con un token muerto y ya no puede volver a registrar el webhook hacia PRD. Falta,
  como limpieza, desactivar el workflow "Telegram" del n8n del servidor. Para PRD, el titular crea
  otro bot con BotFather.
- **Workflow:** `infra/n8n/workflows/asistente-red.json`, exportado sin estado y sin activar. Las
  credenciales van solo por id y nombre: *Telegram RED DEV*, *Gemini* (Google Gemini(PaLM) Api) y
  *Asistente RED - secreto* (Header Auth). Modelos: `models/gemini-3.8-flash` (agente) y
  `models/gemini-3.5-flash-lite` (transcripción).
- **Para importarlo en otro n8n (PRD):** crear las tres credenciales con esos nombres, importar con
  `n8n import:workflow --input=...`, volver a elegir las credenciales en los nodos (los ids
  cambian) y **cambiar `COOKIE` en el nodo "Contexto"** por el `SESSION_COOKIE_NAME` de PRD. Después
  activarlo desde el editor.
- **DEV en la VM:** mientras VirtualBox corra sobre el hipervisor de Windows, la VM se congela a
  ratos (de 1 a 6 minutos). Un mensaje que cae en uno de esos cortes falla y hay que repetirlo. En
  PRD no aplica. Se arregla con `bcdedit /set hypervisorlaunchtype off` en la PC (pendiente, lo
  decide el titular).

## 7. Estado (2026-11-23)

- [x] Diseño (este documento) y skill `n8n-workflows` (`~/.claude/skills/`, en la PC y en la VM).
- [x] Backend Fase A con 18 tests. Migración aplicada en el DEV de la VM.
- [x] n8n de DEV fijado en 2.48.7 (la misma versión del servidor), con el túnel
  `infra/n8n/tunel-dev.sh` para el webhook.
- [x] **Workflow "Asistente RED" con Gemini**, exportado a `infra/n8n/workflows/asistente-red.json`.
- [x] Prueba de punta a punta en DEV con el bot actual: comandos, las consultas, la memoria y un
  audio. Usuario `admin` vinculado. Medición de tokens en §3.8.
- [ ] Afinar la regla de la ficha en el prompt (§3.8) y desactivar el workflow "Telegram" del n8n
  del servidor.
- [ ] Fase B (propuestas y confirmación).
- [ ] PRD: bot nuevo, `ASISTENTE_SECRETO`, migración y workflow importado.

## 8. Cómo se armó la Fase A en DEV (hecho el 2026-11-23; sirve de guía para PRD)

1. **Desactivar el workflow "Telegram" en el n8n del servidor** (comando aprobado por el titular).
   Si no, al reiniciar vuelve a registrar el webhook hacia PRD.
2. **Primero la cuenta de dueño, por un túnel privado:** desde la PC,
   `ssh -N -L 5678:localhost:5678 red-vm` y abrir `http://127.0.0.1:5678`. **Nunca abrir el túnel
   público antes:** mientras n8n no tiene dueño, cualquiera que llegue a la URL puede crearlo.
   Recién después, en la VM: `infra/n8n/tunel-dev.sh`.
3. **Credenciales en n8n:**
   - *Asistente RED - secreto* (Header Auth `X-Asistente-Secreto`): **ya cargada** desde la VM con
     `n8n import:credentials`, tomando `ASISTENTE_SECRETO` de `infra/.env.dev` sin que pase por
     ningún lado.
   - *Telegram RED DEV*: el token del bot actual, desde BotFather. La carga el titular.
   - *Gemini*: la API key. La carga el titular.
4. Armar el workflow según §1 a §4, activarlo y escribirle `/id` al bot.
5. `./red vincular-telegram vincular <usuario> <id>` y probar las 5 consultas con texto y con audio,
   midiendo los tokens.
6. Exportar el workflow a `infra/n8n/workflows/` y commitearlo.
