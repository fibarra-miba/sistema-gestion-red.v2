-- Migración idempotente para bases ya levantadas.
--
-- La garantía pasa a modelar un DEPÓSITO REEMBOLSABLE: el cliente entrega
-- dinero a cambio del equipo (router) al instalarse, y se le devuelve cuando
-- lo reintegra en condiciones. Hasta ahora la tabla no registraba plata.
--
-- 1. monto_garantia: el dinero entregado por el cliente.
-- 2. Estados de cierre DEVUELTA / RETENIDA: sin ellos no hay forma de saber
--    si el depósito volvió al cliente o si nos lo quedamos, y por lo tanto
--    tampoco de calcular cuánto dinero tenemos comprometido.
--    ANULADA queda reservada para errores de carga.
BEGIN;

-- 1. Monto del depósito. Nullable: las garantías ya cargadas no lo tienen.
ALTER TABLE garantia
  ADD COLUMN IF NOT EXISTS monto_garantia NUMERIC(12,2);

-- Un depósito negativo no existe. Se admite NULL (histórico sin monto).
ALTER TABLE garantia DROP CONSTRAINT IF EXISTS chk_garantia_monto_no_negativo;
ALTER TABLE garantia
  ADD CONSTRAINT chk_garantia_monto_no_negativo
  CHECK (monto_garantia IS NULL OR monto_garantia >= 0);

-- 2. Estados de cierre del depósito.
-- Van en DOS statements separados a propósito: un INSERT ... VALUES múltiple
-- no garantiza el orden de asignación de la secuencia, y necesitamos que los
-- ids coincidan con los del bootstrap (005_catalogos_base.sql: 4 DEVUELTA,
-- 5 RETENIDA). Si divergen, una base migrada y una base nueva quedan con
-- catálogos incompatibles.
INSERT INTO estado_garantia (descripcion_egarantia)
SELECT 'DEVUELTA'
WHERE NOT EXISTS (
  SELECT 1 FROM estado_garantia WHERE descripcion_egarantia = 'DEVUELTA'
);

INSERT INTO estado_garantia (descripcion_egarantia)
SELECT 'RETENIDA'
WHERE NOT EXISTS (
  SELECT 1 FROM estado_garantia WHERE descripcion_egarantia = 'RETENIDA'
);

COMMIT;
