Cómo ejecutarlo (dos opciones)

Opción A — Desde pgAdmin
Abrís Query Tool, pegás el bloque que te interese y ejecutás.

Opción B — Desde el contenedor (psql)
docker exec -it postgres_local psql -U admin -d mi_base

y pegás las consultas.


Como infra/sql está montado como init (/docker-entrypoint-initdb.d), este archivo no debería hacer INSERT/CREATE automáticos para no interferir con init.
Está perfecto que sea solo “diagnóstico manual”
