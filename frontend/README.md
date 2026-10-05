# Sistema RED — Frontend

React 18 + Vite + TypeScript (strict) + MUI · TanStack Query · Axios · React Hook Form · React Router.
Gestor: **pnpm** (no npm).

## Correr

Normalmente vía launcher desde la raíz del repo: `./red up` (DEV, Vite con hot reload en
http://localhost:5173) o `./red prd build && ./red prd up` (bundle estático detrás de Traefik
en https://red.localhost).

En DEV `node_modules` lo instala el contenedor: verificá **dentro** de él.

```bash
docker exec red_dev_frontend sh -c "cd /app && pnpm exec tsc -b && pnpm lint"
```

`tsc --noEmit` da falso verde con este tsconfig (solution-style): usar `tsc -b`.

## API

Instancia Axios única en `src/services/http.ts` (`withCredentials`, sesión por cookie httpOnly,
interceptor que normaliza errores a `ApiError`). Base URL desde `VITE_API_BASE_URL`:
`http://localhost:8000` en DEV, `/api` en PRD (mismo origen; se hornea en el build).

## Estructura

```
src/
├── features/<módulo>/   # components · hooks · services · types.ts · index.ts (barrel)
├── components/ui/       # primitivos compartidos (DataTable, ConfirmDialog, ...)
├── pages/               # ensamblado de features por ruta
├── routes/              # router + RequireCapability (gating por capabilities de /auth/me)
├── layouts/  lib/  services/  theme/  types/
```

Reglas (capas, tipos espejo del backend, naming) en el `CLAUDE.md` de la raíz; reglas de
negocio en [`../docs/operacion.md`](../docs/operacion.md).

## Impresión

Los recibos (pagos y depósitos de garantía) usan la clase `.recibo-print`; el `@media print`
de `src/index.css` oculta el resto de la página.
