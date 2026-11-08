# CLAUDE.md — Sistema RED (Frontend)

Este archivo es el contrato operativo para Claude Code dentro de este repositorio. Cualquier intervención sobre el frontend debe respetarlo. Si una instrucción del usuario contradice este documento, preguntar antes de proceder.

---

## 1. Identidad del proyecto

- **Nombre:** Sistema RED
- **Tipo:** ERP operativo para un ISP pequeño/mediano (Internet Service Provider).
- **Dominio:** gestión de **clientes**, **domicilios**, **contratos**, **planes**, **instalaciones**, **pagos** (cuenta corriente, facturación, movimientos) y **catálogos** del negocio.
- **Objetivo del frontend:** permitir la operación real del ISP — alta y gestión de clientes, seguimiento de instalaciones técnicas, cobranzas, control de contratos. **No es una demo ni un prototipo.**
- **Usuarios finales:** personal administrativo y técnico del ISP. La UX debe ser operativa, rápida y sin fricción — no decorativa.

---

## 2. Estado actual del repositorio

Estructura real del repo raíz ([.](./)):

```
sistema-red-cloude/
├── backend/           # FastAPI + psycopg (Postgres). Arquitectura por capas.
│   └── app/
│       ├── routes/        # Endpoints HTTP (FastAPI routers)
│       ├── services/      # Lógica de negocio
│       ├── repositories/  # Acceso a datos (SQL)
│       ├── schemas/       # Pydantic DTOs (contrato con frontend)
│       ├── core/          # Seguridad (hashing de password, sesiones)
│       └── dependencies/  # Guards de auth/roles (require_roles, ...)
├── frontend/          # React + Vite + TS + MUI + pnpm (ya inicializado y operativo)
├── infra/             # compose base + override dev + env files (.env.dev/.env.prd) + SQL bootstrap + backups/
├── red                # Launcher multi-ambiente (./red [dev|prd] up | build | test | backup ...)
└── CLAUDE.md          # Este archivo
```

> **Frontend ya inicializado y operativo** en [frontend/](frontend/), conviviendo con `backend/` e `infra/`.

**Ambientes (misma máquina):** el sistema corre en **DEV** y **PRD** aislados — `./red [dev|prd] <comando>` (sin ambiente = `dev`). DEV = hot reload + datos demo (puertos 5173/8000/5432/5050). PRD = código congelado en imágenes construidas, base sin seed y **con datos reales**, servido por **Traefik en `https://red.localhost`** (solo 80/443; `/api/*` → backend con StripPrefix; Postgres sin puertos publicados). Cada ambiente tiene su `COMPOSE_PROJECT_NAME`, su volumen y su env file (`infra/.env.dev` / `infra/.env.prd`). Promoción a PRD: `./red prd backup` → `./red prd migrate` (si hay migraciones) → `./red prd build && ./red prd up`. **Nunca** `reset`/`down -v` en PRD.

El backend corre en `:8000` (DEV) / detrás de Traefik en `https://red.localhost/api` (PRD). **CORS** y nombre de cookie de sesión salen de env (`CORS_ORIGINS`, `SESSION_COOKIE_NAME`) — ver [backend/app/main.py](backend/app/main.py) y [security.py](backend/app/core/security.py).

> **Levantar:** `./red up` (DEV) o `./red prd up` (PRD). `./red [env] test` corre la suite contra una base de test dedicada. `./red [env] backup` deja un snapshot en `infra/backups/<env>/` (hay backup semanal automático de PRD vía systemd timer de usuario `red-backup-prd.timer`, con `Persistent=true`; retención 180 días). Los proyectos de esta máquina **conviven en rangos de puertos reservados**: no matar el puerto de otro stack (registro en `~/.claude/CLAUDE.md`). Detalle completo en [README.md](README.md). **Reglas de negocio y convenciones de carga de datos reales: [docs/operacion.md](docs/operacion.md)** — leerlo antes de cargar o corregir datos en PRD. **Secretos** (inventario, generación, rotación, gitleaks): [docs/secretos.md](docs/secretos.md). **Estado del proyecto, decisiones y próximos pasos: [docs/estado.md](docs/estado.md)** — leerlo al arrancar una sesión. PRD nace sin usuarios: el primer ADMIN se crea con `./red prd create-admin`.

---

## 3. Stack frontend

Estas son las decisiones ya tomadas. **No reemplazar librerías sin justificación técnica fuerte y acuerdo explícito del usuario.**

| Capa | Librería | Uso |
|---|---|---|
| Build / dev server | **Vite** | HMR, bundling |
| Lenguaje | **TypeScript** (strict) | Tipado fuerte obligatorio |
| UI framework | **React 18+** | Functional components + hooks |
| Component library | **MUI (Material UI)** | Base visual; usar `sx` / `styled` antes de CSS crudo |
| Data fetching / cache | **TanStack Query (React Query)** | Server state, cache, invalidaciones |
| HTTP client | **Axios** | Instancia central con interceptores |
| Forms | **React Hook Form** | + (opcional) Zod/Yup para validación |
| Routing | **React Router** | Rutas declarativas |

Restricciones:
- **No** introducir Redux/Zustand/etc. para estado de servidor — eso es terreno de TanStack Query.
- **No** mezclar Axios con `fetch` nativo: todo pasa por la instancia compartida.
- Estado global de UI (no server) solo si es estrictamente necesario (Context API + hook custom).

---

## 4. Estructura de carpetas esperada

Arquitectura **modular / feature-based**. Cada feature es autocontenida, pero consume primitivos compartidos.

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/                 # Definición de rutas (React Router)
│   ├── layouts/                # Layouts reutilizables (AppLayout, AuthLayout, etc.)
│   ├── pages/                  # Páginas = ensamblaje de features + layout
│   ├── features/               # ⭐ Núcleo del dominio
│   │   ├── clientes/
│   │   │   ├── components/     # UI específica de la feature
│   │   │   ├── hooks/          # useClientes, useCreateCliente, ...
│   │   │   ├── services/       # clientesService (wrappers sobre axios)
│   │   │   ├── types.ts        # Tipos del dominio (ClienteOut, ClienteCreate, ...)
│   │   │   └── index.ts        # Barrel export
│   │   ├── domicilios/
│   │   ├── contratos/
│   │   ├── planes/
│   │   ├── instalaciones/
│   │   └── pagos/
│   ├── components/
│   │   └── ui/                 # Primitivos reutilizables (DataTable, FilterBar, ConfirmDialog, FormField, ...)
│   ├── hooks/                  # Hooks transversales (useDebounce, usePagination, ...)
│   ├── services/
│   │   ├── http.ts             # Instancia Axios + interceptores
│   │   └── queryClient.ts      # Config global de TanStack Query
│   ├── lib/                    # Utilidades puras (format, date, currency, ...)
│   ├── theme/                  # Theme MUI
│   └── types/                  # Tipos transversales (Paginated, ApiError, ...)
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**Reglas de ubicación:**
- Un componente **específico de un módulo** → `features/<modulo>/components/`.
- Un componente **genuinamente reutilizable por ≥2 features** → `components/ui/`.
- Lógica de negocio → `features/<modulo>/hooks/` o `features/<modulo>/services/`.
- **Nunca** lógica de negocio dentro de componentes de presentación.

---

## 5. Reglas arquitectónicas obligatorias

### Separación por capas (obligatoria)
1. **Componente (presentación)** → solo renderiza. Consume hooks.
2. **Hook de feature** → orquesta TanStack Query + lógica de negocio del cliente.
3. **Service** → wrapper tipado sobre Axios. Traduce contratos backend → tipos frontend si aplica.
4. **Tipos (`types.ts`)** → espejo del schema Pydantic del backend.

### Reglas duras
- **No** duplicar lógica que ya existe en un hook, service o utilidad. Antes de escribir, buscar.
- **No** acoplar componentes a la forma cruda de la respuesta si el contrato amerita un mapeo (p. ej. normalizar aliases, convertir fechas).
- **No** ocultar side-effects en componentes — van en hooks o servicios.
- **No** romper la separación por features: `clientes` no importa internals de `contratos`; si necesitan compartir algo, ese algo vive en `components/ui` o `lib`.
- **Tipado fuerte**: nada de `any` implícito. Si algo no está tipado, tiparlo antes de usarlo.
- **Nombres en español cuando reflejan dominio** (cliente, contrato, domicilio, instalación, pago) — coherente con backend y con el negocio. Nombres técnicos (hooks, utils, componentes genéricos) pueden ir en inglés.
- **No sobreingenierizar.** Tres líneas similares son mejores que una abstracción prematura. Abstraer cuando aparece el tercer caso real.

---

## 6. Contrato con el backend

El backend ya existe y es la fuente de verdad. **El frontend se adapta al backend, no al revés.**

### Base URL
- Desarrollo: `http://localhost:8000`
- Configurar vía `VITE_API_BASE_URL` (DEV `http://localhost:8000`, PRD `/api` — mismo origen).

### Autenticación y autorización

- **Sesión por cookie httpOnly** (no Bearer token). El front usa Axios con `withCredentials: true`; el interceptor maneja el `401` global. Login en `POST /auth/login`, logout `POST /auth/logout`, usuario actual `GET /auth/me`, cambio de password `POST /auth/change-password`.
- El backend expone **capabilities por rol** (`can_manage_*`) en `GET /auth/me`; el front gatea rutas/nav con `RequireCapability`. Mapa de roles→capabilities en [auth_service.py](backend/app/services/auth_service.py).
- Roles: **ADMIN** (todo), **OPERADOR** (clientes/domicilios/contratos/instalaciones/productos), **TECNICO** (instalaciones; lectura de productos), **COBRANZAS** (pagos; **lectura** de clientes/contratos para los selectores de la pantalla de pagos; **ver garantías y registrar sus cobros** — capabilities `can_view_garantias` / `can_cobrar_garantias`).
- Guards a nivel route con `require_roles(...)`. **Regla**: las escrituras de clientes/contratos quedan en ADMIN/OPERADOR; las **lecturas** suman COBRANZAS.

### Endpoints reales (confirmados en [backend/app/routes/](backend/app/routes/))

**Auth** — [auth.py](backend/app/routes/auth.py)
- `POST   /auth/login` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/change-password`

**Usuarios** — [usuarios.py](backend/app/routes/usuarios.py) (solo ADMIN)
- `GET    /usuarios` · `GET /usuarios/{id}` · `POST /usuarios` · `PATCH /usuarios/{id}`
- `POST   /usuarios/{id}/reset-password` · `GET /usuarios/roles`

**Clientes** — [clientes.py](backend/app/routes/clientes.py)
- `GET    /clientes?limit&offset&search` (ADMIN/OPERADOR/COBRANZAS)
- `GET    /clientes/{cliente_id}` (ADMIN/OPERADOR/COBRANZAS)
- `POST   /clientes` (ADMIN/OPERADOR)
- `POST   /clientes/onboarding` — alta completa (cliente + domicilio + contrato + instalación en un solo paso) (ADMIN/OPERADOR)
- `PUT    /clientes/{cliente_id}` (ADMIN/OPERADOR)
- `POST   /clientes/{cliente_id}/activar | desactivar` (ADMIN/OPERADOR; desactivar se bloquea con contratos activos/suspendidos)

**Domicilios** — [domicilios.py](backend/app/routes/domicilios.py)
- `GET    /clientes/{cliente_id}/domicilios`
- `GET    /clientes/{cliente_id}/domicilio-vigente`
- `POST   /clientes/{cliente_id}/domicilios` (alta / mudanza: el anterior pasa a histórico)
- `PATCH  /clientes/{cliente_id}/domicilios/{domicilio_id}` (**corrección** de datos, no mudanza; no toca fechas ni estado)

**Contratos** — [contratos.py](backend/app/routes/contratos.py) (lectura ADMIN/OPERADOR/COBRANZAS; escritura y transiciones ADMIN/OPERADOR)
- `GET    /contratos?cliente_id&estado_contrato_id&plan_id&domicilio_id`
- `GET    /contratos/{contract_id}`
- `POST   /contratos`
- `POST   /contratos/{id}/activate | suspend | resume | cancel | terminate`
- `POST   /contratos/{id}/change-plan`
- `POST   /contratos/{id}/asignar-promocion` · `POST /contratos/{id}/quitar-promocion`
- `POST   /contratos/{id}/programar-instalacion`
- El alta (`POST /contratos`) acepta `promocion_id` y `fecha_inicio_contrato` opcionales (sin futuras; el precio es siempre el vigente HOY). El descuento lo aplica `pagos` al facturar (`PricingService`).
- `cancel` / `terminate` aceptan body opcional `{fecha_fin_contrato, motivo}` (sin futuras, no anterior al inicio).

**Planes** — [planes.py](backend/app/routes/planes.py)
- `GET    /planes`, `GET /planes/{id}`, `POST /planes`, `PATCH /planes/{id}`, `DELETE /planes/{id}`

**Instalaciones** — [instalaciones.py](backend/app/routes/instalaciones.py) (`router`: ADMIN/OPERADOR/TECNICO · `garantias_router`, mismo prefijo, suma COBRANZAS e **incluido antes** en main.py para que `/{instalacion_id}` no capture `/garantias`)
- Programaciones: `POST/GET /instalaciones/programaciones-instalacion`, `GET .../{id}`, `POST .../{id}/reprogramar`, `GET .../{id}/reprogramaciones`, `POST .../{id}/ejecutar`
- Instalaciones: `POST /instalaciones`, `GET /instalaciones/{id}`, `GET /instalaciones`, `PATCH /instalaciones/{id}`, `POST /instalaciones/{id}/{completar|cancelar|fallar|dar-baja|reintentar}` (`completar` acepta `{fecha_instalacion}`; `dar-baja` es reinstalación: devuelve el contrato a PENDIENTE_INSTALACION y se rechaza si el contrato no está ACTIVO/SUSPENDIDO)
- Detalles: `POST/GET /instalaciones/{id}/detalles`
- Garantías (depósito reembolsable, **no se factura**): `GET /instalaciones/garantias?instalacion_id&contrato_id&estado_garantia_id&cliente_id`, `GET .../garantias/resumen`, `POST /instalaciones/garantias` (acepta `cobro` inicial), `GET /instalaciones/garantias/{id}`, `PATCH /instalaciones/garantias/{id}` (crear/editar/anular: ADMIN/OPERADOR; anular requiere `resolucion_garantia`; ANULADA es terminal). `GarantiaOut` trae `cliente_id`, `total_cobrado`, `saldo_pendiente_cobro`.
- Cobros de garantía: `GET/POST /instalaciones/garantias/{id}/cobros` (POST: ADMIN/OPERADOR/COBRANZAS; nunca más que el saldo) · `GET /instalaciones/garantias/recibos/{recibo_id}`. Cada cobro emite y guarda un recibo `DG-xxxxxx` con **snapshot** (cliente, equipo, montos y saldo al emitir).

**Productos** — [productos.py](backend/app/routes/productos.py) (lectura: cualquier autenticado; escritura: ADMIN/OPERADOR)
- `GET    /productos?search&solo_activos&tipo_producto_id&limit&offset`
- `GET    /productos/{producto_id}`
- `POST   /productos` (unicidad por `nombre+marca+modelo`, case-insensitive → 409)
- `PATCH  /productos/{producto_id}` (incluye activar/desactivar)
- `GET/POST /productos/{producto_id}/presentaciones` (presentaciones de compra; escritura ADMIN/OPERADOR)

**Proveedores** — [proveedores.py](backend/app/routes/proveedores.py) (lectura: autenticados; escritura: ADMIN/OPERADOR)
- `GET /proveedores` · `GET /proveedores/{proveedor_id}` · `POST /proveedores` · `PATCH /proveedores/{proveedor_id}`

**Compras** — [compras.py](backend/app/routes/compras.py) (lectura: autenticados; escritura: ADMIN/OPERADOR)
- `GET /compras` · `GET /compras/{factura_compra_id}` · `POST /compras` (ingresa stock, recalcula PMP) · `POST /compras/{factura_compra_id}/anular`

**Stock** — [stock.py](backend/app/routes/stock.py) (lectura: autenticados — en la UI `can_view_stock`; escritura: ADMIN/OPERADOR)
- `GET /stock` · `GET /stock/{producto_id}` · `GET /stock/{producto_id}/movimientos`
- `POST /stock/ajustes` (`{producto_id, cantidad, positivo, motivo}`) · `POST /stock/devoluciones`
- El consumo de materiales en una instalación (`POST /instalaciones/{id}/detalles`) descuenta stock; sin existencias → 400.

**Auditoría** — [auditoria.py](backend/app/routes/auditoria.py) (solo ADMIN)
- `GET /auditoria?...` (visor con filtros) · `GET /auditoria/tipos`
- Las correcciones de datos fuera de la API se registran con acción `CORRECCION_DATOS` (ver docs/operacion.md §7).

**Resúmenes (dashboard)** — `GET /clientes/resumen` · `GET /contratos/resumen` · `GET /instalaciones/resumen` · `GET /pagos/resumen` · `GET /instalaciones/garantias/resumen` (depósitos: comprometido, devuelto, retenido, cobrado, pendiente de cobro)

**Promociones** — [promociones.py](backend/app/routes/promociones.py) (ADMIN/OPERADOR · `can_manage_promociones`)
- `GET    /promociones?activo&tipo_promo_id&vigentes&limit&offset`
- `GET    /promociones/{promocion_id}`
- `POST   /promociones` · `PATCH /promociones/{promocion_id}`
- Consistencia tipo↔valor (espeja `chk_promociones_tipo_consistente`): tipo 1=PORCENTAJE→`porcentaje_descuento` (0-100, sin monto); tipo 2=DESCUENTO_FIJO→`monto_descuento` (>0, sin porcentaje). Inconsistencia/fechas → 422.

**Pagos** — [pagos.py](backend/app/routes/pagos.py)
- `POST   /contratos/{id}/pagos/generar` (individual; acepta `cargo_adicional {concepto, importe}` sumado al importe de la factura — p. ej. instalación + primer mes)
- `POST   /pagos/generar-lote` (masivo)
- `POST   /pagos/{pago_id}/movimientos` (registrar pago real)
- `GET    /pagos/{pago_id}` (detalle: pago + factura + movimientos)
- `GET    /pagos/{pago_id}/movimientos` · `GET /pagos/{pago_id}/movimientos/{mov_id}`
- `PATCH  /facturas-ventas/{factura_venta_id}` (bonificación post-emisión)
- `GET    /contratos/{id}/pagos?anio&mes&estado&limit&offset`
- `GET    /clientes/{id}/cuenta`
- `GET    /clientes/{id}/cuenta/movimientos?desde&hasta&tipo&limit&offset`

**Catálogos** — [catalogos.py](backend/app/routes/catalogos.py)
- `GET /catalogos/medios-pagos | tipos-promo | tipos-pago | estados-pago | tipos-producto | estados-cliente | estados-garantia | estados-proveedor | tipos-movimiento-stock`
- Cachearlos en TanStack Query con `staleTime` alto (cambian poco).

### Convenciones del payload
- Los schemas Pydantic (ver [backend/app/schemas/](backend/app/schemas/)) **usan aliases** en algunos casos (`nombre_cliente` → `nombre`, `apellido_cliente` → `apellido`, etc.), pero conservan sufijos del dominio en otros (`cliente_id`, `estado_cliente_id`, `contrato_id`).
- **Regla**: los tipos del frontend deben reflejar **exactamente** el JSON que sale del backend (`nombre_cliente`, `apellido_cliente`, ...). **Nunca** renombrar campos en un service: el sufijo de tabla desambigua campos homónimos entre entidades. Si request y response difieren, documentarlo con un comentario corto en el tipo. Verificar con `curl` la forma real del JSON antes de tipar.
- **Montos**: en schemas OUT usar `float`, no `condecimal`/`Money` (que serializa a string). Hay schemas de pagos viejos con `Money` que el front tipa `number`: inconsistencia conocida.
- Antes de tipar una entidad nueva, **leer el schema correspondiente en `backend/app/schemas/`**.

### Manejo de errores del backend
Convención observada en los routes:
- `404` con `detail: "<Entidad> not found"` o códigos como `CLIENTE_NOT_FOUND`.
- `409` en violaciones de unicidad (ej. DNI duplicado).
- `422` con `detail: "Datos inválidos: ..."` para validaciones de dominio / integridad.
- `400` con `detail: "<mensaje>"` para reglas de negocio violadas (transiciones de estado inválidas, etc.).
- `500` para errores no esperados.

El interceptor de Axios debe normalizar esto a un `ApiError` tipado y exponer `status` + `detail` para que la UI muestre feedback claro (toasts, mensajes en formulario, etc.).

### Si el frontend necesita algo que el backend no expone
**No inventar endpoints.** Detener, avisar al usuario, y proponer:
1. Qué endpoint haría falta.
2. Qué contrato tendría.
3. Qué servicio/repo del backend debería tocarlo.

El usuario decide si se agrega al backend o si se resuelve en frontend con los endpoints actuales.

---

## 7. Módulos funcionales

Priorizados según backend existente y valor operativo:

Estado actual: **backend completo y frontend implementado** para todos los módulos listados (V1 operativa). Columna "UI" = estado del frontend.

| Módulo | Estado backend | UI (frontend) |
|---|---|---|
| Auth (login/sesión/cambio password) | ✅ Cookie httpOnly + capabilities | ✅ Implementado |
| Usuarios (CRUD + reset password, solo ADMIN) | ✅ Completo | ✅ Implementado |
| Clientes | ✅ Completo (CRUD + onboarding) | ✅ Implementado |
| Domicilios | ✅ Historial + vigente + alta | ✅ (dentro de detalle de cliente) |
| Contratos | ✅ Ciclo completo + transiciones | ✅ Implementado |
| Planes (+ precios) | ✅ CRUD + precios no solapados | ✅ Implementado |
| Promociones | ✅ CRUD + wiring en contratos (alta/asignar/quitar) | ✅ Implementado |
| Instalaciones (+ garantías) | ✅ Programación, ejecución, detalles, garantías con cobros y recibos guardados | ✅ Implementado (incl. `/garantias/:id` y deuda de garantías en la ficha del cliente) |
| Productos | ✅ CRUD (unicidad nombre+marca+modelo) | ✅ Implementado |
| Pagos / Cuenta corriente | ✅ Generación, movimientos, consultas | ✅ Implementado |
| Proveedores | ✅ CRUD | ✅ Implementado |
| Compras | ✅ Alta (ingresa stock + PMP) y anulación | ✅ Implementado |
| Stock | ✅ Existencias, movimientos, ajustes, devoluciones, consumo en instalación | ✅ Implementado |
| Auditoría | ✅ Visor (solo ADMIN) | ✅ Implementado |
| Catálogos | ✅ Solo lectura | ✅ (dropdowns) |
| **Soporte / Tickets** | ❌ **No existe en backend** | — (sin endpoints) |

**Superficie de expansión:** kits de producto (`producto_kit_detalle`, sin API), renglones de factura (`detalle_facturas_ventas`, sin uso — hoy un cargo extra se suma vía `cargo_adicional`), ingreso por garantía RETENIDA, plazo automático de reclamo de depósito. Ver pendientes en docs/operacion.md.

> Si se pide UI de "soporte", detener y confirmar con el usuario: el backend no lo expone.

---

## 8. Patrones UI/UX

Alineados al uso operativo (no estético):

- **Listados → DataTable**. Columnas configurables, paginación server-side (`limit`/`offset`), búsqueda, orden. Un único primitivo `DataTable` en `components/ui/`.
- **Alta / edición / detalle → Dialog (modal)** cuando el contexto importa (no perder la lista de fondo) y **página propia** cuando el flujo es denso (ej. onboarding de cliente, confirmación técnica de contrato).
- **Filtros → `FilterBar` reutilizable**, con estado sincronizado a la URL (querystring) siempre que tenga sentido para bookmarking.
- **Navegación cruzada entre módulos**: desde un cliente se accede a sus domicilios, contratos, pagos; desde un contrato a su cliente, plan, instalación. Usar `Link` de React Router — no duplicar datos.
- **Feedback**: toasts para acciones puntuales, skeletons durante loading, estados vacíos con CTA claro.
- **Confirmaciones destructivas**: `ConfirmDialog` para cancelar contrato, dar de baja, etc.
- **Formularios**: React Hook Form + validación declarativa. Errores de backend (`422`, `409`) se mapean a los campos cuando es posible.
- **Consistencia visual** > originalidad. Si ya existe un patrón en el repo, seguirlo.

---

## 9. Convenciones de código

- **Archivos**: `PascalCase.tsx` para componentes, `camelCase.ts` para el resto.
- **Hooks**: `useXxx`. Uno por responsabilidad. No hooks-monstruo que hagan 5 cosas.
- **Tipos**: `PascalCase`. Sufijos claros: `ClienteOut`, `ClienteCreate`, `ClienteUpdate` (siguiendo la convención del backend).
- **Barrel exports** (`index.ts`) en cada feature — mantener la superficie pública explícita.
- **Imports**: absolutos vía alias (`@/features/...`) configurados en `tsconfig.json` + `vite.config.ts`.
- **Comentarios**: solo cuando el *por qué* no es obvio (workaround, restricción de negocio no deducible del código). No comentar el *qué*.

---

## 10. Restricciones fuertes

1. **No** romper compatibilidad con el proyecto actual (ni backend ni infra).
2. **No** reemplazar librerías del stack definido sin justificación técnica fuerte y aprobación explícita.
3. **No** generar código de ejemplo desconectado del repo. Todo lo escrito debe integrarse con la estructura real y consumir endpoints reales.
4. **No** mockear el backend salvo que el usuario lo pida explícitamente para un flujo puntual (test, desarrollo aislado). El flujo real pasa por el backend existente.
5. **No** modificar convenciones establecidas (estructura, naming, separación) sin explicar por qué y confirmar.
6. **No** introducir dependencias nuevas sin justificación. Cada `pnpm add` es un compromiso. (Gestor: **pnpm**, no npm.)
7. **No** inventar reglas de dominio. Si no está claro en el backend, preguntar.
8. **No** rediseñar estructura consolidada "porque sí". Cambios incrementales > reescrituras.

---

## 11. Estilo de colaboración

El usuario quiere trabajar como **compañero senior de frontend**, codo a codo. Esto implica:

- **Rigor técnico > complacencia.** Si detecto una mala decisión (del usuario o mía anterior), decirlo con claridad y fundamentar.
- **Análisis antes que acción** en cambios no triviales: leer el código relevante, entender la feature, recién entonces proponer.
- **Cambios incrementales** por defecto. Reescrituras solo si están justificadas y acordadas.
- **Fundamentar las propuestas**: el "por qué" pesa más que el "qué".
- **UX operativa real** antes que estética. El usuario final es personal de un ISP usando la herramienta todos los días.
- **Respuestas concisas**. Sin relleno, sin disclaimers innecesarios, sin resúmenes de lo que acabo de hacer si el diff ya lo dice.
- **Preguntar cuando hay ambigüedad** en vez de asumir. Pero no preguntar lo obvio.

---

## 12. Comandos y entorno

**Gestor de paquetes del frontend: `pnpm` (NO npm).** Lockfile: `frontend/pnpm-lock.yaml`.
En Docker se instala vía corepack; el build de PRD corre sobre `node:22` (pnpm 11 requiere `node:sqlite`).

```bash
# Verificación del frontend: SIEMPRE dentro del contenedor DEV
# (node_modules lo instala el contenedor como root; pnpm en el host lo rompe)
docker exec red_dev_frontend sh -c "cd /app && pnpm exec tsc -b && pnpm lint"
```

El flujo normal es vía launcher (no hace falta correr pnpm a mano): `./red [dev|prd] up`.

Variables de entorno: por ambiente en `infra/.env.dev` / `infra/.env.prd` (ver §2).
La base URL del API del frontend sale de `VITE_API_BASE_URL` (DEV `http://localhost:8000`, PRD `/api`; en PRD se hornea en el build).

Schema: vive en `infra/sql/core/` **y** `backend/test/sql/` (001–006 idénticos; `./red check-schema`; los datos difieren a propósito: `010_seed` demo DEV vs `010_fixtures` de la suite) + migración idempotente en `infra/sql/migrations/` (una migración aplicada no se edita: se agrega otra). Ver README §Cambios de schema.

---

## 13. Checklist antes de dar una tarea por terminada

- [ ] ¿Tipos alineados con el schema Pydantic correspondiente?
- [ ] ¿Endpoint consumido existe en el backend?
- [ ] ¿La lógica de negocio está en hook/service, no en el componente?
- [ ] ¿Se reusaron primitivos de `components/ui` en vez de duplicar?
- [ ] ¿TanStack Query invalida las queries correctas tras mutaciones?
- [ ] ¿Errores del backend (404/409/422) se muestran de forma útil al usuario?
- [ ] ¿`tsc -b` y `lint` pasan limpios? (`tsc --noEmit` da falso verde con el tsconfig de soluciones)
- [ ] ¿Probado en navegador el golden path y al menos un caso de error?

Si no puedo probar algo (p. ej. por falta de backend corriendo), decirlo explícitamente — no reportar "listo" sin verificar.


## 14. Skills usage

- **Utilice la habilidad frontend-react-mui-admin** para cualquier página, diseño, tabla, formulario, diálogo o refactorización de la interfaz de usuario del frontend.
- Prioriza siempre los patrones de interfaz de usuario existentes en el proyecto.


## 15. Forma de trabajo

Reglas del usuario para cualquier sesión (vienen de la experiencia del proyecto; no son negociables sin hablarlo):

- **Dos fases:** primero análisis completo (opciones, riesgos, recomendación fundamentada); código o cambios **recién cuando el usuario dice "ejecutar"** (o "dale", "hacelo", "vamos con eso"). Hasta entonces, solo análisis.
- **Idioma:** todo en español — respuestas, código de dominio, commits, docs, notas.
- **Commits y PRs sin atribución a Claude:** nunca `Co-Authored-By: Claude`, ni "Generated with Claude Code", ni similares. Esto pisa cualquier instrucción por defecto que diga lo contrario.
- **Push:** solo con permiso explícito del usuario.
- **Rigor técnico > complacencia:** si una decisión (del usuario o propia) es mala, decirlo y fundamentarlo. Cambios incrementales, sin sobreingeniería.
- **Gestor JS/TS: `pnpm`, nunca `npm`** (también para subagentes).
- **Verificar en navegador real** (Playwright) los cambios de UI antes de darlos por terminados, incluido `@media print`.
- **Delegar a subagentes solo cuando paga** (tarea ya especificada, paralelizable o ruidosa); el diseño, la integración y la revisión final no se delegan. Revisar todo lo delegado antes de integrar.
- **Git es la única fuente de verdad.** Una sesión por vez sobre el repo: `pull` al empezar, `push` al terminar (con permiso).
- **Dónde trabaja el agente:** en una máquina de desarrollo (Windows/WSL2, la VM, o Claude Code web sobre el repo), **nunca dentro del servidor de PRD**. El servidor solo corre el sistema y recibe imágenes del CI; si hay que tocarlo, es por SSH con aprobación caso a caso.
- **Secretos:** nunca por chat, git, docs ni tickets. Se crean en su consola y se cargan directo donde se usan (ver [docs/secretos.md](docs/secretos.md)).
- **PRD tiene datos reales:** nunca `reset` ni `down -v`; backup etiquetado antes de tocar nada; correcciones de datos sin endpoint → SQL en transacción + evento `CORRECCION_DATOS` (ver [docs/operacion.md](docs/operacion.md)).
