-- ======================================================
-- 005_catalogos_base.sql
-- Catálogos mínimos operativos del Sistema RED
-- ======================================================

INSERT INTO estado_cliente (descripcion_ecliente) VALUES
  ('ACTIVO'),
  ('INACTIVO');

INSERT INTO estado_plan (descripcion_eplan) VALUES
  ('ACTIVO'),
  ('INACTIVO');

INSERT INTO estado_contrato (descripcion_econtrato) VALUES
  ('BORRADOR'),
  ('PENDIENTE_INSTALACION'),
  ('ACTIVO'),
  ('SUSPENDIDO'),
  ('BAJA'),
  ('CANCELADO');

INSERT INTO estado_domicilio (descripcion_edomicilio) VALUES
  ('VIGENTE'),
  ('HISTORICO');

INSERT INTO estado_cuenta (descripcion_ecuenta) VALUES
  ('AL DIA'),
  ('DEUDOR'),
  ('SUSPENDIDA');

INSERT INTO estado_programacion (descripcion_eprogramacion) VALUES
  ('PROGRAMADA'),
  ('COMPLETADA'),
  ('CANCELADA'),
  ('FALLIDA');

INSERT INTO estado_instalacion (descripcion_einstalacion) VALUES
  ('PENDIENTE'),
  ('COMPLETADA'),
  ('CANCELADA'),
  ('FALLIDA');

INSERT INTO estado_garantia (descripcion_egarantia) VALUES
  ('ACTIVA'),
  ('VENCIDA'),
  ('ANULADA');

INSERT INTO estado_facturas_ventas (descripcion_efventa) VALUES
  ('EMITIDA');

INSERT INTO estado_pago (descripcion_epago) VALUES
  ('PENDIENTE'),
  ('PARCIAL'),
  ('PAGADO');

INSERT INTO tipo_pago (descripcion_tpago) VALUES
  ('PAGO_CLIENTE'),
  ('AJUSTE_MANUAL');

INSERT INTO medios_pagos (descripcion_mpagos) VALUES
  ('EFECTIVO'),
  ('TRANSFERENCIA'),
  ('TARJETA');

INSERT INTO tipo_promocion (descripcion_tpromo) VALUES
  ('PORCENTAJE'),
  ('DESCUENTO_FIJO');

INSERT INTO tipo_movimiento_detalle_cuenta (
  codigo_tipo_mov_det_cuenta,
  descripcion_tipo_mov_det_cuenta,
  signo_tipo_mov_det_cuenta,
  activo_tipo_mov_det_cuenta
) VALUES
  ('FACTURA',  'Factura del período',              'D', TRUE),
  ('PAGO',     'Pago aplicado a cuenta corriente', 'H', TRUE),
  ('AJUSTE_D', 'Ajuste manual al Debe',            'D', TRUE),
  ('AJUSTE_H', 'Ajuste manual al Haber',           'H', TRUE);

INSERT INTO roles (codigo_rol, nombre_rol, descripcion_rol) VALUES
  ('ADMIN', 'Administrador', 'Acceso total al sistema'),
  ('OPERADOR', 'Operador', 'Operación comercial y administrativa'),
  ('TECNICO', 'Técnico', 'Operación técnica de instalaciones'),
  ('COBRANZAS', 'Cobranzas', 'Gestión de pagos y cobranzas');

-- user: admin
-- pass: admin
INSERT INTO usuarios (
  rol_id,
  username_usuario,
  email_usuario,
  password_hash_usuario,
  nombre_usuario,
  apellido_usuario,
  activo_usuario,
  requiere_cambio_password_usuario
) VALUES (
  (SELECT rol_id FROM roles WHERE codigo_rol = 'ADMIN'),
  'admin',
  'admin@red.com',
  'scrypt$16384$8$1$79ZwirXIvEtbAme6KLsCyg==$iiLnWWA7uYCQfj25sK0YUCm4TBJWNBhyQAg51bqIpyCF617iEw5Sf5KR1vS/VVtbnFkL/hYU2ELo0IrjjuENWw==',
  'Admin',
  'Sistema',
  TRUE,
  FALSE
);
