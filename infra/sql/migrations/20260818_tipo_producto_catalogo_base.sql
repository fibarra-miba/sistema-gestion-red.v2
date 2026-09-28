-- Migración idempotente para bases ya levantadas.
--
-- tipo_producto (MATERIAL / EQUIPO) estaba sembrado en 010_seed.sql, que es el
-- seed DEMO y PRD saltea con RED_SEED=0. Pero no son datos de ejemplo: son
-- valores estructurales sobre los que ramifica el código (solo se garantizan
-- productos de tipo EQUIPO). Sin ellos no se puede dar de alta ningún producto
-- —el combo "tipo de producto" queda vacío— y en cascada no hay materiales de
-- instalación ni garantías posibles.
--
-- Pasan al catálogo base (005_catalogos_base.sql) y esta migración los carga en
-- las bases que ya existen.
BEGIN;

-- Unicidad por código: sin esto, cargar el catálogo dos veces duplica en
-- silencio y las búsquedas por código pasan a elegir una fila cualquiera.
ALTER TABLE tipo_producto DROP CONSTRAINT IF EXISTS uq_tipo_producto_codigo;
ALTER TABLE tipo_producto
  ADD CONSTRAINT uq_tipo_producto_codigo UNIQUE (codigo_tproducto);

-- Dos statements separados para fijar el orden de la secuencia
-- (1 MATERIAL, 2 EQUIPO), igual que en el bootstrap.
INSERT INTO tipo_producto (codigo_tproducto, descripcion_tproducto, activo_tproducto)
SELECT 'MATERIAL', 'Material de instalación', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM tipo_producto WHERE codigo_tproducto = 'MATERIAL'
);

INSERT INTO tipo_producto (codigo_tproducto, descripcion_tproducto, activo_tproducto)
SELECT 'EQUIPO', 'Equipo entregado al cliente', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM tipo_producto WHERE codigo_tproducto = 'EQUIPO'
);

COMMIT;
