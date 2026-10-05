-- Migración idempotente para bases ya levantadas.
--
-- La garantía es un depósito reembolsable, pero hasta ahora solo guardaba el
-- monto y el ciclo de vida: no había registro de que el dinero entró.
-- cobros_garantia registra cada cobro (normalmente uno por el total, a veces
-- en partes). NO es factura ni toca la cuenta corriente.
BEGIN;

CREATE TABLE IF NOT EXISTS cobros_garantia (
  cobro_garantia_id             BIGSERIAL PRIMARY KEY,
  garantia_id                   BIGINT NOT NULL,
  fecha_cobro_garantia          TIMESTAMPTZ NOT NULL,
  monto_cobro_garantia          NUMERIC(12,2) NOT NULL CHECK (monto_cobro_garantia > 0),
  medio_pago_id                 BIGINT NOT NULL,
  comprobante_cobro_garantia    VARCHAR(200),
  fecha_creacion_cobro_garantia TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cobros_garantia DROP CONSTRAINT IF EXISTS fk_cobros_garantia_garantia;
ALTER TABLE cobros_garantia
  ADD CONSTRAINT fk_cobros_garantia_garantia
  FOREIGN KEY (garantia_id)
  REFERENCES garantia(garantia_id);

ALTER TABLE cobros_garantia DROP CONSTRAINT IF EXISTS fk_cobros_garantia_medio_pago;
ALTER TABLE cobros_garantia
  ADD CONSTRAINT fk_cobros_garantia_medio_pago
  FOREIGN KEY (medio_pago_id)
  REFERENCES medios_pagos(medio_pago_id);

CREATE INDEX IF NOT EXISTS idx_cobros_garantia_garantia ON cobros_garantia(garantia_id);

COMMIT;
