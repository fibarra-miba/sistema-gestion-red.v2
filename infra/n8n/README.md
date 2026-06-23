# Sistema RED - Addon n8n

Este módulo agrega n8n como capa opcional de automatizaciones para Sistema RED.

n8n no forma parte del core obligatorio del sistema. Su función es ejecutar workflows, recibir eventos, llamar endpoints del backend y coordinar integraciones externas.

## Arquitectura

El core de Sistema RED sigue siendo responsable de:

- reglas de negocio
- validaciones
- transacciones
- seguridad
- integridad de datos
- permisos
- persistencia principal del sistema

n8n solo debe actuar como capa de automatización/orquestación.

## Servicios agregados

El addon agrega:

- `postgres_n8n`
- `n8n`

Contenedores:

- `postgres_n8n_local`
- `n8n_local`

Volúmenes:

- `postgres_n8n_data`
- `n8n_data`

## Levantar Sistema RED sin n8n

```bash
./red up
