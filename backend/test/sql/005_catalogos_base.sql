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

-- Tipos de producto: estructurales, no demo. El código ramifica sobre el
-- código EQUIPO (solo esos admiten garantía/depósito). El orden fija los ids:
-- 1 MATERIAL, 2 EQUIPO.
INSERT INTO tipo_producto (
  codigo_tproducto,
  descripcion_tproducto,
  activo_tproducto
) VALUES
  ('MATERIAL', 'Material de instalación', TRUE),
  ('EQUIPO', 'Equipo entregado al cliente', TRUE);

-- La garantía es un depósito reembolsable. ACTIVA = plata retenida (la que
-- suma al dinero comprometido); DEVUELTA / RETENIDA son los dos cierres
-- posibles según el equipo haya vuelto o no; ANULADA es error de carga.
-- El orden fija los ids: 1 ACTIVA, 2 VENCIDA, 3 ANULADA, 4 DEVUELTA, 5 RETENIDA.
INSERT INTO estado_garantia (descripcion_egarantia) VALUES
  ('ACTIVA'),
  ('VENCIDA'),
  ('ANULADA'),
  ('DEVUELTA'),
  ('RETENIDA');

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

INSERT INTO estado_proveedor (descripcion_eprov) VALUES
  ('ACTIVO'),
  ('INACTIVO');

INSERT INTO estado_facturas_compras (descripcion_efcompra) VALUES
  ('EMITIDA'),
  ('ANULADA');

INSERT INTO tipo_movimiento_stock (codigo_tmstock, descripcion_tmstock, signo_tmstock) VALUES
  ('ENTRADA_COMPRA',     'Entrada por compra',              '+'),
  ('SALIDA_INSTALACION', 'Salida por consumo en instalación', '-'),
  ('AJUSTE_POSITIVO',    'Ajuste manual positivo',          '+'),
  ('AJUSTE_NEGATIVO',    'Ajuste manual negativo',          '-'),
  ('DEVOLUCION',         'Devolución a stock',              '+');

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
