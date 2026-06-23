-- ======================================================
-- 010_seed.sql
-- Dataset demo realista para Sistema RED
-- Requiere 005_catalogos_base.sql cargado previamente
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
  (
    'Plan Básico',
    10,
    (SELECT estado_plan_id FROM estado_plan WHERE descripcion_eplan = 'ACTIVO'),
    'Internet residencial 10 Mbps'
  ),
  (
    'Plan Intermedio',
    20,
    (SELECT estado_plan_id FROM estado_plan WHERE descripcion_eplan = 'ACTIVO'),
    'Internet residencial 20 Mbps'
  ),
  (
    'Plan Avanzado',
    40,
    (SELECT estado_plan_id FROM estado_plan WHERE descripcion_eplan = 'ACTIVO'),
    'Internet residencial 40 Mbps'
  );

INSERT INTO precios_planes (
  plan_id,
  precio_mensual_pplanes,
  fecha_desde_pplanes,
  fecha_hasta_pplanes
) VALUES
  ((SELECT plan_id FROM planes WHERE nombre_plan = 'Plan Básico'), 20000, CURRENT_DATE - INTERVAL '365 days', NULL),
  ((SELECT plan_id FROM planes WHERE nombre_plan = 'Plan Intermedio'), 30000, CURRENT_DATE - INTERVAL '365 days', NULL),
  ((SELECT plan_id FROM planes WHERE nombre_plan = 'Plan Avanzado'), 50000, CURRENT_DATE - INTERVAL '365 days', NULL);

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
    'Promo bienvenida 10%',
    'Descuento de bienvenida para nuevos clientes',
    (SELECT tipo_promo_id FROM tipo_promocion WHERE descripcion_tpromo = 'PORCENTAJE'),
    10,
    NULL,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '30 days',
    TRUE
  );

-- ============================
-- PRODUCTOS PARA INSTALACIONES
-- ============================

INSERT INTO tipo_producto (
  codigo_tproducto,
  descripcion_tproducto,
  activo_tproducto
) VALUES
  ('MATERIAL', 'Material de instalación', TRUE),
  ('EQUIPO', 'Equipo entregado al cliente', TRUE);

INSERT INTO productos (
  nombre_producto,
  descripcion_producto,
  marca_producto,
  modelo_producto,
  activo_producto,
  tipo_producto_id
) VALUES
  (
    'Cable UTP CAT6',
    'Cable de red para instalación domiciliaria',
    'Genérico',
    'CAT6',
    TRUE,
    (SELECT tipo_producto_id FROM tipo_producto WHERE codigo_tproducto = 'MATERIAL')
  ),
  (
    'Router WiFi',
    'Router entregado en comodato/garantía',
    'TP-Link',
    'Archer C24',
    TRUE,
    (SELECT tipo_producto_id FROM tipo_producto WHERE codigo_tproducto = 'EQUIPO')
  );

-- ============================
-- CLIENTE 1: ACTIVO + INSTALACIÓN COMPLETADA
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
  'Juan',
  'Pérez',
  '30111222',
  '3875000001',
  'juan.perez@red.com',
  NOW() - INTERVAL '45 days',
  (SELECT estado_cliente_id FROM estado_cliente WHERE descripcion_ecliente = 'ACTIVO'),
  'Cliente demo con instalación completada'
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
  (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222'),
  'Torre A',
  3,
  'D',
  'Av. Principal',
  123,
  'Puerta azul',
  NOW() - INTERVAL '45 days',
  NULL,
  (SELECT estado_domicilio_id FROM estado_domicilio WHERE descripcion_edomicilio = 'VIGENTE')
);

INSERT INTO cuenta (
  cliente_id,
  saldo_cuenta,
  estado_cuenta_id
) VALUES (
  (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222'),
  0,
  (SELECT estado_cuenta_id FROM estado_cuenta WHERE descripcion_ecuenta = 'AL DIA')
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
  (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222'),
  (SELECT domicilio_id FROM domicilios WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222')),
  (SELECT plan_id FROM planes WHERE nombre_plan = 'Plan Intermedio'),
  30000,
  NOW() - INTERVAL '40 days',
  NULL,
  FALSE,
  NULL,
  (SELECT estado_contrato_id FROM estado_contrato WHERE descripcion_econtrato = 'ACTIVO')
);

INSERT INTO programacion_instalaciones (
  domicilio_id,
  contrato_id,
  fecha_programacion_pinstalacion,
  estado_programacion_id,
  tecnico_pinstalacion,
  notas_pinstalacion
) VALUES (
  (SELECT domicilio_id FROM domicilios WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222')),
  (SELECT contrato_id FROM contratos WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222')),
  NOW() - INTERVAL '35 days',
  (SELECT estado_programacion_id FROM estado_programacion WHERE descripcion_eprogramacion = 'COMPLETADA'),
  'Matías Técnico',
  'Instalación realizada correctamente'
);

INSERT INTO instalaciones (
  programacion_id,
  contrato_id,
  domicilio_id,
  codigo_instalacion,
  fecha_instalacion,
  estado_instalacion_id,
  observacion_instalacion
) VALUES (
  (SELECT programacion_id FROM programacion_instalaciones WHERE contrato_id = (SELECT contrato_id FROM contratos WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222'))),
  (SELECT contrato_id FROM contratos WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222')),
  (SELECT domicilio_id FROM domicilios WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222')),
  'INST-0001',
  NOW() - INTERVAL '35 days',
  (SELECT estado_instalacion_id FROM estado_instalacion WHERE descripcion_einstalacion = 'COMPLETADA'),
  'Instalación finalizada. Servicio operativo.'
);

INSERT INTO detalle_instalacion (
  instalacion_id,
  producto_id,
  descripcion_dinstalacion,
  cantidad_dinstalacion,
  unidad_dinstalacion,
  observacion_dinstalacion
) VALUES
  (
    (SELECT instalacion_id FROM instalaciones WHERE codigo_instalacion = 'INST-0001'),
    (SELECT producto_id FROM productos WHERE nombre_producto = 'Cable UTP CAT6'),
    'Cableado interno hasta departamento',
    18,
    'metros',
    'Cableado instalado sin observaciones'
  ),
  (
    (SELECT instalacion_id FROM instalaciones WHERE codigo_instalacion = 'INST-0001'),
    (SELECT producto_id FROM productos WHERE nombre_producto = 'Router WiFi'),
    'Router principal del cliente',
    1,
    'unidad',
    'Equipo entregado y configurado'
  );

INSERT INTO garantia (
  instalacion_id,
  contrato_id,
  producto_id,
  fecha_inicio_garantia,
  fecha_fin_garantia,
  estado_garantia_id,
  motivo_garantia,
  resolucion_garantia
) VALUES (
  (SELECT instalacion_id FROM instalaciones WHERE codigo_instalacion = 'INST-0001'),
  (SELECT contrato_id FROM contratos WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '30111222')),
  (SELECT producto_id FROM productos WHERE nombre_producto = 'Router WiFi'),
  NOW() - INTERVAL '35 days',
  NOW() + INTERVAL '6 months',
  (SELECT estado_garantia_id FROM estado_garantia WHERE descripcion_egarantia = 'ACTIVA'),
  'Garantía inicial por equipo instalado',
  NULL
);

-- ============================
-- CLIENTE 2: contrato PENDIENTE_INSTALACION
-- Programación PROGRAMADA (agendada, sin ejecutar) — sin instalación todavía.
-- La instalación recién nace al ejecutar la programación.
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
  'María',
  'Gómez',
  '32999888',
  '3875000002',
  'maria.gomez@red.com',
  NOW() - INTERVAL '5 days',
  (SELECT estado_cliente_id FROM estado_cliente WHERE descripcion_ecliente = 'ACTIVO'),
  'Cliente demo con instalación programada'
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
  (SELECT cliente_id FROM clientes WHERE dni_cliente = '32999888'),
  'Torre B',
  1,
  'A',
  'Av. Secundaria',
  456,
  'Portero eléctrico no funciona',
  NOW() - INTERVAL '5 days',
  NULL,
  (SELECT estado_domicilio_id FROM estado_domicilio WHERE descripcion_edomicilio = 'VIGENTE')
);

INSERT INTO cuenta (
  cliente_id,
  saldo_cuenta,
  estado_cuenta_id
) VALUES (
  (SELECT cliente_id FROM clientes WHERE dni_cliente = '32999888'),
  0,
  (SELECT estado_cuenta_id FROM estado_cuenta WHERE descripcion_ecuenta = 'AL DIA')
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
  (SELECT cliente_id FROM clientes WHERE dni_cliente = '32999888'),
  (SELECT domicilio_id FROM domicilios WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '32999888')),
  (SELECT plan_id FROM planes WHERE nombre_plan = 'Plan Básico'),
  20000,
  NOW() - INTERVAL '3 days',
  NULL,
  TRUE,
  (SELECT promocion_id FROM promociones WHERE nombre_promo = 'Promo bienvenida 10%'),
  (SELECT estado_contrato_id FROM estado_contrato WHERE descripcion_econtrato = 'PENDIENTE_INSTALACION')
);

INSERT INTO programacion_instalaciones (
  domicilio_id,
  contrato_id,
  fecha_programacion_pinstalacion,
  estado_programacion_id,
  tecnico_pinstalacion,
  notas_pinstalacion
) VALUES (
  (SELECT domicilio_id FROM domicilios WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '32999888')),
  (SELECT contrato_id FROM contratos WHERE cliente_id = (SELECT cliente_id FROM clientes WHERE dni_cliente = '32999888')),
  NOW() + INTERVAL '2 days',
  (SELECT estado_programacion_id FROM estado_programacion WHERE descripcion_eprogramacion = 'PROGRAMADA'),
  'Luciano Técnico',
  'Instalación inicial programada'
);

-- (Sin instalación: la programación todavía no se ejecutó. La fila en
--  `instalaciones` recién se crea al ejecutar la programación.)

-- ============================
-- CLIENTE 3: CLIENTE SUELTO SIN CONTRATO
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
  'Carlos',
  'Ruiz',
  '35222333',
  '3875000003',
  'carlos.ruiz@red.com',
  NOW(),
  (SELECT estado_cliente_id FROM estado_cliente WHERE descripcion_ecliente = 'ACTIVO'),
  'Cliente demo sin contrato asociado'
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
  (SELECT cliente_id FROM clientes WHERE dni_cliente = '35222333'),
  'Torre C',
  5,
  'B',
  'Av. Terciaria',
  789,
  'Consultar disponibilidad técnica',
  NOW(),
  NULL,
  (SELECT estado_domicilio_id FROM estado_domicilio WHERE descripcion_edomicilio = 'VIGENTE')
);

INSERT INTO cuenta (
  cliente_id,
  saldo_cuenta,
  estado_cuenta_id
) VALUES (
  (SELECT cliente_id FROM clientes WHERE dni_cliente = '35222333'),
  0,
  (SELECT estado_cuenta_id FROM estado_cuenta WHERE descripcion_ecuenta = 'AL DIA')
);
