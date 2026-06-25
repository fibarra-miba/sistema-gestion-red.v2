-- Migración idempotente: módulo Proveedores / Compras / Stock.
-- Alinea bases ya levantadas (mi_base) con el esquema nuevo (ver core 001/002/003/005).
-- Las tablas de stock/compras estaban vacías y sin uso, así que el reordenamiento
-- de detalle_facturas_compras es seguro.
BEGIN;

-- ============================
-- 1. PRODUCTOS: unidad base de stock
-- ============================
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS unidad_stock_producto VARCHAR(20);

-- ============================
-- 2. TIPO_MOVIMIENTO_STOCK: código + signo
-- ============================
ALTER TABLE tipo_movimiento_stock
  ADD COLUMN IF NOT EXISTS codigo_tmstock VARCHAR(30);
ALTER TABLE tipo_movimiento_stock
  ADD COLUMN IF NOT EXISTS signo_tmstock CHAR(1);

INSERT INTO tipo_movimiento_stock (codigo_tmstock, descripcion_tmstock, signo_tmstock)
SELECT v.codigo, v.descripcion, v.signo
FROM (VALUES
  ('ENTRADA_COMPRA',     'Entrada por compra',                '+'),
  ('SALIDA_INSTALACION', 'Salida por consumo en instalación', '-'),
  ('AJUSTE_POSITIVO',    'Ajuste manual positivo',            '+'),
  ('AJUSTE_NEGATIVO',    'Ajuste manual negativo',            '-'),
  ('DEVOLUCION',         'Devolución a stock',                '+')
) AS v(codigo, descripcion, signo)
WHERE NOT EXISTS (
  SELECT 1 FROM tipo_movimiento_stock t WHERE t.codigo_tmstock = v.codigo
);

ALTER TABLE tipo_movimiento_stock ALTER COLUMN codigo_tmstock SET NOT NULL;
ALTER TABLE tipo_movimiento_stock ALTER COLUMN signo_tmstock SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_tipo_movimiento_stock_codigo') THEN
    ALTER TABLE tipo_movimiento_stock ADD CONSTRAINT uq_tipo_movimiento_stock_codigo UNIQUE (codigo_tmstock);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tipo_movimiento_stock_signo') THEN
    ALTER TABLE tipo_movimiento_stock ADD CONSTRAINT chk_tipo_movimiento_stock_signo CHECK (signo_tmstock IN ('+', '-'));
  END IF;
END $$;

-- ============================
-- 3. ESTADO_PROVEEDOR (seed)
-- ============================
INSERT INTO estado_proveedor (descripcion_eprov)
SELECT v.d FROM (VALUES ('ACTIVO'), ('INACTIVO')) AS v(d)
WHERE NOT EXISTS (SELECT 1 FROM estado_proveedor e WHERE e.descripcion_eprov = v.d);

-- ============================
-- 4. ESTADO_FACTURAS_COMPRAS (tabla + seed)
-- ============================
CREATE TABLE IF NOT EXISTS estado_facturas_compras (
  estado_factura_compra_id BIGSERIAL PRIMARY KEY,
  descripcion_efcompra     VARCHAR(100) NOT NULL
);

INSERT INTO estado_facturas_compras (descripcion_efcompra)
SELECT v.d FROM (VALUES ('EMITIDA'), ('ANULADA')) AS v(d)
WHERE NOT EXISTS (SELECT 1 FROM estado_facturas_compras e WHERE e.descripcion_efcompra = v.d);

-- ============================
-- 5. FACTURAS_COMPRAS: total + estado
-- ============================
ALTER TABLE facturas_compras
  ADD COLUMN IF NOT EXISTS importe_total_fcompras NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE facturas_compras
  ADD COLUMN IF NOT EXISTS estado_factura_compra_id BIGINT;

UPDATE facturas_compras
SET estado_factura_compra_id = (
  SELECT estado_factura_compra_id FROM estado_facturas_compras WHERE descripcion_efcompra = 'EMITIDA'
)
WHERE estado_factura_compra_id IS NULL;

ALTER TABLE facturas_compras ALTER COLUMN estado_factura_compra_id SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_fcompra_estado') THEN
    ALTER TABLE facturas_compras ADD CONSTRAINT fk_fcompra_estado
      FOREIGN KEY (estado_factura_compra_id) REFERENCES estado_facturas_compras(estado_factura_compra_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_fcompra_total_no_negativo') THEN
    ALTER TABLE facturas_compras ADD CONSTRAINT chk_fcompra_total_no_negativo CHECK (importe_total_fcompras >= 0);
  END IF;
END $$;

-- ============================
-- 6. DETALLE_FACTURAS_COMPRAS: reordenamiento (tabla vacía/sin uso)
-- ============================
ALTER TABLE detalle_facturas_compras DROP COLUMN IF EXISTS factor_b_stock;
ALTER TABLE detalle_facturas_compras ADD COLUMN IF NOT EXISTS presentacion_id BIGINT;
ALTER TABLE detalle_facturas_compras ADD COLUMN IF NOT EXISTS cantidad_presentacion NUMERIC(12,2);
ALTER TABLE detalle_facturas_compras ADD COLUMN IF NOT EXISTS factor_aplicado NUMERIC(12,2);
ALTER TABLE detalle_facturas_compras ADD COLUMN IF NOT EXISTS cantidad_base NUMERIC(12,2);
ALTER TABLE detalle_facturas_compras ADD COLUMN IF NOT EXISTS costo_unitario_base NUMERIC(12,2);
ALTER TABLE detalle_facturas_compras ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2);

ALTER TABLE detalle_facturas_compras ALTER COLUMN cantidad_presentacion SET NOT NULL;
ALTER TABLE detalle_facturas_compras ALTER COLUMN factor_aplicado SET NOT NULL;
ALTER TABLE detalle_facturas_compras ALTER COLUMN cantidad_base SET NOT NULL;
ALTER TABLE detalle_facturas_compras ALTER COLUMN costo_unitario_base SET NOT NULL;
ALTER TABLE detalle_facturas_compras ALTER COLUMN subtotal SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dfcompra_presentacion') THEN
    ALTER TABLE detalle_facturas_compras ADD CONSTRAINT fk_dfcompra_presentacion
      FOREIGN KEY (presentacion_id) REFERENCES producto_presentacion(presentacion_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_dfcompra_cantidades_positivas') THEN
    ALTER TABLE detalle_facturas_compras ADD CONSTRAINT chk_dfcompra_cantidades_positivas
      CHECK (cantidad_presentacion > 0 AND factor_aplicado > 0 AND cantidad_base > 0
             AND costo_unitario_base >= 0 AND subtotal >= 0);
  END IF;
END $$;

-- ============================
-- 7. MOVIMIENTO_STOCK_ITEM / MOVIMIENTO_STOCK: costo + trazabilidad
-- ============================
ALTER TABLE movimiento_stock
  ADD COLUMN IF NOT EXISTS costo_unitario_mstock NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE movimiento_stock
  ADD COLUMN IF NOT EXISTS det_factura_compra_id BIGINT;
ALTER TABLE movimiento_stock ALTER COLUMN fecha_mstock SET DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_msi_factor_positivo') THEN
    ALTER TABLE movimiento_stock_item ADD CONSTRAINT chk_msi_factor_positivo CHECK (factor_b_stock > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ms_det_factura_compra') THEN
    ALTER TABLE movimiento_stock ADD CONSTRAINT fk_ms_det_factura_compra
      FOREIGN KEY (det_factura_compra_id) REFERENCES detalle_facturas_compras(det_factura_compra_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ms_costo_no_negativo') THEN
    ALTER TABLE movimiento_stock ADD CONSTRAINT chk_ms_costo_no_negativo CHECK (costo_unitario_mstock >= 0);
  END IF;
END $$;

-- ============================
-- 8. Índices
-- ============================
CREATE INDEX IF NOT EXISTS idx_msi_producto ON movimiento_stock_item (producto_id);
CREATE INDEX IF NOT EXISTS idx_ms_item ON movimiento_stock (mov_stock_item_id);
CREATE INDEX IF NOT EXISTS idx_ms_det_instalacion ON movimiento_stock (det_instalacion_id);
CREATE INDEX IF NOT EXISTS idx_ms_det_factura_compra ON movimiento_stock (det_factura_compra_id);
CREATE INDEX IF NOT EXISTS idx_ms_fecha ON movimiento_stock (fecha_mstock);
CREATE INDEX IF NOT EXISTS idx_dfcompra_factura ON detalle_facturas_compras (factura_compra_id);
CREATE INDEX IF NOT EXISTS idx_dfcompra_producto ON detalle_facturas_compras (producto_id);
CREATE INDEX IF NOT EXISTS idx_fcompras_proveedor ON facturas_compras (proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pp_producto ON producto_presentacion (producto_id);
CREATE INDEX IF NOT EXISTS idx_proveedor_estado ON proveedor (estado_proveedor_id);

COMMIT;
