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

Volúmenes (se prefijan con el proyecto del ambiente, p. ej. `red_dev_n8n_data`):

- `postgres_n8n_data`
- `n8n_data`

## Ambientes

n8n se levanta dentro del ambiente seleccionado del launcher: `./red [dev|prd] up-n8n`
(`logs-n8n`, `restart-n8n`, etc.). Como los volúmenes se prefijan por ambiente, el n8n de DEV
y el de PRD no comparten workflows ni credenciales.

## Levantar Sistema RED sin n8n

```bash
./red up        # = ./red dev up
