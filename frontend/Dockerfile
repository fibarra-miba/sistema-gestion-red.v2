# Build production-shaped del frontend: compila el bundle estático y lo sirve
# con nginx. El código queda CONGELADO en la imagen (no hay bind-mount), que es
# lo que permite que PRD quede estable mientras se trabaja en DEV.
#
# Gestor de paquetes: pnpm (vía corepack). NO usar npm.

# node:22 = pnpm 11 requiere node:sqlite (disponible desde Node 22).
# Versiones fijas (node y nginx): el CI construye la imagen de PRD y un tag
# flotante haría que dos builds del mismo commit den imágenes distintas.
FROM node:22.23.5-alpine3.24 AS build
WORKDIR /app

RUN corepack enable

# pnpm-workspace.yaml trae onlyBuiltDependencies (autoriza el build script de
# esbuild; pnpm 11 bloquea scripts de deps por defecto y falla si quedan ignorados).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# La base URL del API se hornea en build-time (Vite la inyecta en el bundle).
# Se escribe en .env.production para ganarle en precedencia al .env commiteado.
ARG VITE_API_BASE_URL
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env.production
RUN pnpm run build

# 1.30 = rama estable de nginx (las impares son mainline).
FROM nginx:1.30.7-alpine3.24
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
