-- Migración idempotente para bases ya levantadas.
-- Alinea garantía/productos con las reglas nuevas (ver 002/003/006 del bootstrap).
BEGIN;

-- 1. productos.marca/modelo NOT NULL (backfill defensivo por si hubiera nulos).
UPDATE productos SET marca_producto = 'N/D'  WHERE marca_producto IS NULL;
UPDATE productos SET modelo_producto = 'N/D' WHERE modelo_producto IS NULL;
ALTER TABLE productos ALTER COLUMN marca_producto  SET NOT NULL;
ALTER TABLE productos ALTER COLUMN modelo_producto SET NOT NULL;

-- 2. Unicidad compuesta de producto (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS uq_producto_nombre_marca_modelo
  ON productos (lower(nombre_producto), lower(marca_producto), lower(modelo_producto));

-- 3. Garantía: quitar unicidad absoluta y aplicar única-parcial sobre ACTIVA.
ALTER TABLE garantia DROP CONSTRAINT IF EXISTS uq_garantia_instalacion_producto;

DO $$
DECLARE
  v_estado_activa BIGINT;
BEGIN
  SELECT estado_garantia_id INTO v_estado_activa
  FROM estado_garantia WHERE descripcion_egarantia = 'ACTIVA';
  IF v_estado_activa IS NULL THEN
    RAISE EXCEPTION 'No existe estado_garantia ACTIVA';
  END IF;
  EXECUTE format(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_garantia_activa_instalacion_producto '
    'ON garantia (instalacion_id, producto_id) WHERE estado_garantia_id = %s',
    v_estado_activa
  );
END $$;

COMMIT;
