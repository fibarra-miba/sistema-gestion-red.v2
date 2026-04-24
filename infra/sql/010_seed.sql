-- ======================================================
-- 010_seed.sql - Dataset mínimo para testing (Contratos + Pagos + Instalaciones)
-- Compatible con 001_schema.sql + 002_constraints.sql
-- ======================================================

-- ============================
-- ESTADOS BÁSICOS
-- ============================

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

-- ============================
-- CATÁLOGOS MÓDULO PAGOS
-- ============================

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
  ('FACTURA',  'Factura del período',                 'D', TRUE),
  ('PAGO',     'Pago aplicado a cuenta corriente',    'H', TRUE),
  ('AJUSTE_D', 'Ajuste manual al Debe',               'D', TRUE),
  ('AJUSTE_H', 'Ajuste manual al Haber',              'H', TRUE);

-- ============================
-- PLANES
-- ============================

INSERT INTO planes (
  nombre_plan,
  velocidad_mbps_plan,
  estado_plan_id,
  descripcion_plan
) VALUES
  ('Plan Básico',      10, 1, 'Plan 10 Mbps'),
  ('Plan Intermedio',  20, 1, 'Plan 20 Mbps'),
  ('Plan Avanzado',    40, 1, 'Plan 40 Mbps');

-- ============================
-- PRECIOS PLANES
-- ============================

INSERT INTO precios_planes (
  plan_id,
  precio_mensual_pplanes,
  fecha_desde_pplanes,
  fecha_hasta_pplanes
) VALUES
  (1, 10000, (CURRENT_DATE - INTERVAL '365 days'), NULL),
  (2, 20000, (CURRENT_DATE - INTERVAL '365 days'), NULL),
  (3, 40000, (CURRENT_DATE - INTERVAL '365 days'), NULL);

-- ============================
-- PROMOCIONES
-- ============================

INSERT INTO promociones (
  nombre_promo,
  descripcion_promo,
  tipo_promo_id,
  porcentaje_descuento,
  monto_descuento,
  fecha_vigencia_desde_promo,
  fecha_vigencia_hasta_promo,
  activo_promo
) VALUES
  (
    'Promo 10% vigente',
    'Descuento porcentual vigente para testing',
    (SELECT tipo_promo_id FROM tipo_promocion WHERE descripcion_tpromo = 'PORCENTAJE' LIMIT 1),
    10,
    NULL,
    (CURRENT_DATE - INTERVAL '30 days'),
    (CURRENT_DATE + INTERVAL '30 days'),
    TRUE
  );

INSERT INTO promociones (
  nombre_promo,
  descripcion_promo,
  tipo_promo_id,
  porcentaje_descuento,
  monto_descuento,
  fecha_vigencia_desde_promo,
  fecha_vigencia_hasta_promo,
  activo_promo
) VALUES
  (
    'Promo $1000 vencida',
    'Descuento fijo vencido para testing',
    (SELECT tipo_promo_id FROM tipo_promocion WHERE descripcion_tpromo = 'DESCUENTO_FIJO' LIMIT 1),
    NULL,
    1000,
    (CURRENT_DATE - INTERVAL '90 days'),
    (CURRENT_DATE - INTERVAL '60 days'),
    TRUE
  );

-- ============================
-- CLIENTE 1 (contrato BORRADOR para condición técnica)
-- ============================

INSERT INTO clientes (
  nombre_cliente,
  apellido_cliente,
  dni_cliente,
  telefono_cliente,
  email_cliente,
  fecha_alta_cliente,
  estado_cliente_id,
  observacion_cliente
) VALUES (
  'Cliente',
  'Testing',
  '12345678',
  '3870000000',
  'cliente.testing@red.com',
  NOW(),
  1,
  'Seed testing contratos (cliente 1)'
);

INSERT INTO domicilios (
  cliente_id,
  complejo,
  piso,
  depto,
  calle,
  numero,
  referencias,
  fecha_desde_dom,
  fecha_hasta_dom,
  estado_domicilio_id
) VALUES (
  1,
  'Torre A',
  3,
  'D',
  'Av. Principal',
  123,
  'Puerta azul',
  NOW(),
  NULL,
  1
);

INSERT INTO cuenta (
  cliente_id,
  saldo_cuenta,
  estado_cuenta_id
) VALUES (
  1,
  0,
  1
);

INSERT INTO contratos (
  cliente_id,
  domicilio_id,
  plan_id,
  precio_base_contrato,
  fecha_inicio_contrato,
  fecha_fin_contrato,
  aplica_promocion,
  promocion_id,
  estado_contrato_id
) VALUES (
  1,
  1,
  1,
  10000,
  (CURRENT_DATE - INTERVAL '60 days'),
  NULL,
  FALSE,
  NULL,
  1
);

-- ============================
-- CLIENTE 2 (contrato ACTIVO para pagos)
-- ============================

INSERT INTO clientes (
  nombre_cliente,
  apellido_cliente,
  dni_cliente,
  telefono_cliente,
  email_cliente,
  fecha_alta_cliente,
  estado_cliente_id,
  observacion_cliente
) VALUES (
  'Cliente',
  'PagosSeed',
  '87654321',
  '3871111111',
  'cliente.pagos@red.com',
  NOW(),
  1,
  'Seed testing pagos (cliente 2)'
);

INSERT INTO domicilios (
  cliente_id,
  complejo,
  piso,
  depto,
  calle,
  numero,
  referencias,
  fecha_desde_dom,
  fecha_hasta_dom,
  estado_domicilio_id
) VALUES (
  2,
  'Torre B',
  2,
  'A',
  'Av. Secundaria',
  456,
  'Puerta roja',
  NOW(),
  NULL,
  1
);

INSERT INTO cuenta (
  cliente_id,
  saldo_cuenta,
  estado_cuenta_id
) VALUES (
  2,
  0,
  1
);

INSERT INTO contratos (
  cliente_id,
  domicilio_id,
  plan_id,
  precio_base_contrato,
  fecha_inicio_contrato,
  fecha_fin_contrato,
  aplica_promocion,
  promocion_id,
  estado_contrato_id
) VALUES (
  2,
  2,
  1,
  10000,
  (CURRENT_DATE - INTERVAL '30 days'),
  NULL,
  FALSE,
  NULL,
  3
);

-- ============================
-- CLIENTE 3 (caso operativo de instalaciones)
-- ============================

INSERT INTO clientes (
  nombre_cliente,
  apellido_cliente,
  dni_cliente,
  telefono_cliente,
  email_cliente,
  fecha_alta_cliente,
  estado_cliente_id,
  observacion_cliente
) VALUES (
  'Cliente',
  'InstalacionSeed',
  '11222333',
  '3872222222',
  'cliente.instalaciones@red.com',
  NOW(),
  1,
  'Seed testing instalaciones (cliente 3)'
);

INSERT INTO domicilios (
  cliente_id,
  complejo,
  piso,
  depto,
  calle,
  numero,
  referencias,
  fecha_desde_dom,
  fecha_hasta_dom,
  estado_domicilio_id
) VALUES (
  3,
  'Torre C',
  1,
  'B',
  'Av. Terciaria',
  789,
  'Puerta verde',
  NOW(),
  NULL,
  1
);

INSERT INTO cuenta (
  cliente_id,
  saldo_cuenta,
  estado_cuenta_id
) VALUES (
  3,
  0,
  1
);

INSERT INTO contratos (
  cliente_id,
  domicilio_id,
  plan_id,
  precio_base_contrato,
  fecha_inicio_contrato,
  fecha_fin_contrato,
  aplica_promocion,
  promocion_id,
  estado_contrato_id
) VALUES (
  3,
  3,
  1,
  10000,
  (CURRENT_DATE - INTERVAL '10 days'),
  NULL,
  FALSE,
  NULL,
  2
);

-- ============================
-- PROGRAMACION INSTALACION
-- ============================

INSERT INTO programacion_instalaciones (
  domicilio_id,
  contrato_id,
  fecha_programacion_pinstalacion,
  estado_programacion_id,
  tecnico_pinstalacion,
  notas_pinstalacion
)
VALUES (
  3,
  3,
  NOW() + INTERVAL '2 days',
  1, -- PROGRAMADA
  'Tecnico Test',
  'Instalación inicial programada'
);

-- ============================
-- REPROGRAMACION HISTORICA
-- ============================

INSERT INTO reprogramacion_instalaciones (
  programacion_id,
  fecha_reprogramada_anterior,
  fecha_reprogramada_nueva,
  tecnico_reprogramacion,
  motivo_reprogramacion,
  notas_reprogramacion
)
VALUES (
  1,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '2 days',
  'Tecnico Test',
  'Cliente no disponible',
  'Se reprogramó una vez'
);

-- ============================
-- INSTALACION PENDIENTE
-- ============================

INSERT INTO instalaciones (
  programacion_id,
  contrato_id,
  domicilio_id,
  codigo_instalacion,
  fecha_instalacion,
  estado_instalacion_id,
  observacion_instalacion
)
VALUES (
  1,
  3,
  3,
  'INST-0001',
  NOW(),
  1, -- PENDIENTE
  'Instalación pendiente de ejecución'
);

-- ============================
-- PRODUCTO BASE (para detalle)
-- ============================

INSERT INTO tipo_producto (codigo_tproducto, descripcion_tproducto, activo_tproducto)
VALUES ('SERVICIO', 'Producto servicio', TRUE);

INSERT INTO productos (
  nombre_producto,
  descripcion_producto,
  marca_producto,
  modelo_producto,
  activo_producto,
  tipo_producto_id
)
VALUES (
  'Cable UTP',
  'Cable de red',
  'Genérico',
  'CAT6',
  TRUE,
  (SELECT tipo_producto_id FROM tipo_producto WHERE codigo_tproducto = 'SERVICIO' LIMIT 1)
);

-- ============================
-- DETALLE INSTALACION
-- ============================

INSERT INTO detalle_instalacion (
  instalacion_id,
  producto_id,
  descripcion_dinstalacion,
  cantidad_dinstalacion,
  unidad_dinstalacion,
  observacion_dinstalacion
)
VALUES (
  (SELECT instalacion_id FROM instalaciones ORDER BY instalacion_id ASC LIMIT 1),
  (SELECT producto_id FROM productos ORDER BY producto_id ASC LIMIT 1),
  'Cableado',
  20,
  'metros',
  'Cableado interno'
);

-- ============================
-- GARANTIA
-- ============================

INSERT INTO garantia (
  instalacion_id,
  contrato_id,
  producto_id,
  fecha_inicio_garantia,
  fecha_fin_garantia,
  estado_garantia_id,
  motivo_garantia,
  resolucion_garantia
)
VALUES (
  (SELECT instalacion_id FROM instalaciones ORDER BY instalacion_id ASC LIMIT 1),
  (SELECT contrato_id FROM contratos WHERE cliente_id = 1 ORDER BY contrato_id ASC LIMIT 1),
  (SELECT producto_id FROM productos ORDER BY producto_id ASC LIMIT 1),
  NOW(),
  NOW() + INTERVAL '6 months',
  (SELECT estado_garantia_id FROM estado_garantia WHERE descripcion_egarantia = 'ACTIVA' LIMIT 1),
  'Garantía por instalación',
  NULL
);

-- ============================
-- ROLES
-- ============================
INSERT INTO roles (codigo_rol, nombre_rol, descripcion_rol) VALUES
  ('ADMIN', 'Administrador', 'Acceso total al sistema'),
  ('OPERADOR', 'Operador', 'Operación comercial y administrativa'),
  ('TECNICO', 'Técnico', 'Operación técnica de instalaciones'),
  ('COBRANZAS', 'Cobranzas', 'Gestión de pagos y cobranzas');

-- ============================
-- USUARIO ADMIN SEED
-- user: admin
-- pass: admin
-- ============================
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
  'admin@red.local',
  'scrypt$16384$8$1$79ZwirXIvEtbAme6KLsCyg==$iiLnWWA7uYCQfj25sK0YUCm4TBJWNBhyQAg51bqIpyCF617iEw5Sf5KR1vS/VVtbnFkL/hYU2ELo0IrjjuENWw==',
  'Admin',
  'Sistema',
  TRUE,
  FALSE
);
