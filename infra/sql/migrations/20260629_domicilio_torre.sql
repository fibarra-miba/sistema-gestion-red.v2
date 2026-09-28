-- Migración idempotente: domicilios suma columna "torre" (torre/edificio).
-- Hasta ahora la torre se metía a mano en "complejo"; pasa a tener campo propio,
-- separado de piso/depto. Nullable, no toca datos existentes.
BEGIN;

ALTER TABLE domicilios
  ADD COLUMN IF NOT EXISTS torre VARCHAR(20);

COMMIT;
