-- Migración idempotente para bases ya levantadas.
--
-- Cada cobro de garantía (cobros_garantia) emite SIEMPRE un recibo que queda
-- guardado. El recibo es un SNAPSHOT: cliente, equipo, montos y saldo
-- pendiente tal como estaban al emitirlo. El saldo cambia con cobros
-- posteriores y el recibo tiene que poder reimprimirse idéntico a como se
-- entregó (un pago en 2 partes deja 2 recibos, cada uno con su saldo).
--
-- Separada de 20261005_cobros_garantia.sql porque ésa ya figuraba aplicada
-- en el ledger cuando se sumó el recibo: una migración aplicada no se edita.
BEGIN;

CREATE TABLE IF NOT EXISTS recibos_garantia (
  recibo_garantia_id            BIGSERIAL PRIMARY KEY,
  cobro_garantia_id             BIGINT NOT NULL UNIQUE,
  numero_recibo_garantia        VARCHAR(20) NOT NULL UNIQUE,
  fecha_emision_recibo_garantia TIMESTAMPTZ NOT NULL DEFAULT now(),
  importe_recibo_garantia       NUMERIC(12,2) NOT NULL,
  cliente_nombre                VARCHAR(50) NOT NULL,
  cliente_apellido              VARCHAR(50) NOT NULL,
  producto_descripcion          VARCHAR(200) NOT NULL,
  monto_garantia                NUMERIC(12,2) NOT NULL,
  total_cobrado_al_emitir       NUMERIC(12,2) NOT NULL,
  saldo_pendiente_al_emitir     NUMERIC(12,2) NOT NULL,
  medio_pago_descripcion        VARCHAR(50) NOT NULL,
  comprobante_cobro_garantia    VARCHAR(200),
  fecha_cobro_garantia          TIMESTAMPTZ NOT NULL
);

ALTER TABLE recibos_garantia DROP CONSTRAINT IF EXISTS fk_recibos_garantia_cobro;
ALTER TABLE recibos_garantia
  ADD CONSTRAINT fk_recibos_garantia_cobro
  FOREIGN KEY (cobro_garantia_id)
  REFERENCES cobros_garantia(cobro_garantia_id);

COMMIT;
