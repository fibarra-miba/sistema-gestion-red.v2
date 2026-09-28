-- Migración idempotente: el DNI de cliente pasa a ser opcional.
-- Alinea bases ya levantadas con el esquema nuevo (ver core 001_schema.sql).
-- El UNIQUE (dni_cliente) se mantiene: en Postgres los NULL no colisionan,
-- así que múltiples clientes sin DNI conviven sin violar la unicidad.
BEGIN;

ALTER TABLE clientes
  ALTER COLUMN dni_cliente DROP NOT NULL;

COMMIT;
