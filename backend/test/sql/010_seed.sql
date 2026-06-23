-- ======================================================
-- 010_seed.sql — Dataset de FIXTURES para testing
-- (Contratos + Pagos + Instalaciones)
-- Los catálogos/estados/roles/usuarios los provee 005_catalogos_base.sql,
-- que el conftest carga ANTES que este archivo. Acá va SOLO data de negocio.
-- ======================================================

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
-- PROMOCIONES (una vigente, una vencida — para tests de pagos)
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
-- CONTRATO 2 (ACTIVO): flujo completo
-- programación COMPLETADA + instalación COMPLETADA + garantía ACTIVA
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
  2,
  2,
  NOW() - INTERVAL '20 days',
  2, -- COMPLETADA
  'Tecnico Test',
  'Programación ejecutada'
);

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
  (SELECT programacion_id FROM programacion_instalaciones WHERE contrato_id = 2 ORDER BY programacion_id ASC LIMIT 1),
  2,
  2,
  'INST-0001',
  NOW() - INTERVAL '20 days',
  2, -- COMPLETADA
  'Instalación completada. Servicio operativo.'
);

-- ============================
-- CONTRATO 3 (PENDIENTE_INSTALACION): programación PROGRAMADA, SIN instalación
-- (la instalación recién nace al ejecutar la programación)
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

-- Reprogramación histórica sobre la programación PROGRAMADA del contrato 3.
INSERT INTO reprogramacion_instalaciones (
  programacion_id,
  fecha_reprogramada_anterior,
  fecha_reprogramada_nueva,
  tecnico_reprogramacion,
  motivo_reprogramacion,
  notas_reprogramacion
)
VALUES (
  (SELECT programacion_id FROM programacion_instalaciones WHERE contrato_id = 3 ORDER BY programacion_id ASC LIMIT 1),
  NOW(),
  NOW() + INTERVAL '2 days',
  'Tecnico Test',
  'Cliente no disponible',
  'Se reprogramó una vez'
);

-- ============================
-- PRODUCTO BASE (para el detalle de INST-0001)
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
-- DETALLE INSTALACION (sobre INST-0001, contrato 2)
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
  (SELECT instalacion_id FROM instalaciones WHERE codigo_instalacion = 'INST-0001'),
  (SELECT producto_id FROM productos ORDER BY producto_id ASC LIMIT 1),
  'Cableado',
  20,
  'metros',
  'Cableado interno'
);

-- ============================
-- GARANTIA (instalación y contrato coinciden: contrato 2)
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
  (SELECT instalacion_id FROM instalaciones WHERE codigo_instalacion = 'INST-0001'),
  2,
  (SELECT producto_id FROM productos ORDER BY producto_id ASC LIMIT 1),
  NOW() - INTERVAL '20 days',
  NOW() + INTERVAL '6 months',
  (SELECT estado_garantia_id FROM estado_garantia WHERE descripcion_egarantia = 'ACTIVA' LIMIT 1),
  'Garantía por instalación',
  NULL
);
