-- ==========================================
-- Constraints (relaciones / cardinalidades)
-- ==========================================

-- ============================
-- CLIENTES
-- ============================
ALTER TABLE clientes
  ADD CONSTRAINT fk_clientes_estado
  FOREIGN KEY (estado_cliente_id)
  REFERENCES estado_cliente(estado_cliente_id);
  
ALTER TABLE clientes
  ADD CONSTRAINT uq_clientes_dni
  UNIQUE (dni_cliente);

-- ============================
-- DOMICILIOS
-- ============================
ALTER TABLE domicilios
  ADD CONSTRAINT fk_domicilios_cliente
  FOREIGN KEY (cliente_id)
  REFERENCES clientes(cliente_id);

ALTER TABLE domicilios
  ADD CONSTRAINT fk_domicilios_estado
  FOREIGN KEY (estado_domicilio_id)
  REFERENCES estado_domicilio(estado_domicilio_id);

-- ============================
-- CUENTA
-- ============================
ALTER TABLE cuenta
  ADD CONSTRAINT fk_cuenta_cliente
  FOREIGN KEY (cliente_id)
  REFERENCES clientes(cliente_id);

ALTER TABLE cuenta
  ADD CONSTRAINT uq_cuenta_cliente
  UNIQUE (cliente_id);

ALTER TABLE cuenta
  ADD CONSTRAINT fk_cuenta_estado
  FOREIGN KEY (estado_cuenta_id)
  REFERENCES estado_cuenta(estado_cuenta_id);

-- ============================
-- DETALLE_CUENTA
-- ============================
ALTER TABLE detalle_cuenta
  ADD CONSTRAINT fk_detcuenta_cuenta
  FOREIGN KEY (cuenta_id)
  REFERENCES cuenta(cuenta_id);

ALTER TABLE detalle_cuenta
  ADD CONSTRAINT fk_detcuenta_tipo_mov
  FOREIGN KEY (tipo_mov_det_cuenta_id)
  REFERENCES tipo_movimiento_detalle_cuenta(tipo_mov_det_cuenta_id);

ALTER TABLE detalle_cuenta
  ADD CONSTRAINT fk_detcuenta_factura
  FOREIGN KEY (factura_venta_id)
  REFERENCES facturas_ventas(factura_venta_id);

ALTER TABLE detalle_cuenta
  ADD CONSTRAINT fk_detcuenta_pago
  FOREIGN KEY (pago_id)
  REFERENCES pagos(pago_id);

ALTER TABLE detalle_cuenta
  ADD CONSTRAINT chk_detcuenta_importe_positivo
  CHECK (importe_cuenta > 0);

ALTER TABLE detalle_cuenta
  ADD CONSTRAINT chk_detcuenta_origen
  CHECK (
    (factura_venta_id IS NOT NULL AND pago_id IS NULL)
    OR
    (factura_venta_id IS NULL AND pago_id IS NOT NULL)
    OR
    (factura_venta_id IS NULL AND pago_id IS NULL)
  );

-- ============================
-- TIPO_MOVIMIENTO_DETALLE_CUENTA
-- ============================
ALTER TABLE tipo_movimiento_detalle_cuenta
  ADD CONSTRAINT uq_tmdc_codigo
  UNIQUE (codigo_tipo_mov_det_cuenta);

ALTER TABLE tipo_movimiento_detalle_cuenta
  ADD CONSTRAINT chk_tmdc_signo
  CHECK (signo_tipo_mov_det_cuenta IN ('D','H'));

-- ============================
-- PLANES
-- ============================
ALTER TABLE planes
  ADD CONSTRAINT fk_planes_estado
  FOREIGN KEY (estado_plan_id)
  REFERENCES estado_plan(estado_plan_id);

ALTER TABLE planes
  ADD CONSTRAINT uq_planes_nombre
  UNIQUE (nombre_plan);

-- ============================
-- PRECIOS_PLANES
-- ============================
ALTER TABLE precios_planes
  ADD CONSTRAINT fk_pplanes_plan
  FOREIGN KEY (plan_id)
  REFERENCES planes(plan_id);

ALTER TABLE precios_planes
  ADD CONSTRAINT chk_pplanes_precio_positivo
  CHECK (precio_mensual_pplanes > 0);

ALTER TABLE precios_planes
  ADD CONSTRAINT chk_pplanes_fechas
  CHECK (
    fecha_hasta_pplanes IS NULL
    OR fecha_hasta_pplanes > fecha_desde_pplanes
  );

-- Requerido para EXCLUDE con columna btree + range
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE precios_planes
  ADD CONSTRAINT ex_pplanes_no_solapado
  EXCLUDE USING gist (
    plan_id WITH =,
    tstzrange(
      fecha_desde_pplanes,
      COALESCE(fecha_hasta_pplanes, 'infinity'::timestamptz),
      '[)'
    ) WITH &&
  );

-- ============================
-- CONTRATOS
-- ============================
ALTER TABLE contratos
  ADD CONSTRAINT fk_contrato_cliente
  FOREIGN KEY (cliente_id)
  REFERENCES clientes(cliente_id);

ALTER TABLE contratos
  ADD CONSTRAINT fk_contrato_domicilio
  FOREIGN KEY (domicilio_id)
  REFERENCES domicilios(domicilio_id);

ALTER TABLE contratos
  ADD CONSTRAINT fk_contrato_plan
  FOREIGN KEY (plan_id)
  REFERENCES planes(plan_id);
  
ALTER TABLE contratos
  ADD CONSTRAINT chk_contrato_precio_base_positivo
  CHECK (precio_base_contrato > 0);

ALTER TABLE contratos
  ADD CONSTRAINT fk_contrato_promocion
  FOREIGN KEY (promocion_id)
  REFERENCES promociones(promocion_id);

ALTER TABLE contratos
  ADD CONSTRAINT chk_contrato_promocion_consistente
  CHECK (
    (aplica_promocion = FALSE AND promocion_id IS NULL)
    OR
    (aplica_promocion = TRUE  AND promocion_id IS NOT NULL)
  );

ALTER TABLE contratos
  ADD CONSTRAINT fk_contrato_estado
  FOREIGN KEY (estado_contrato_id)
  REFERENCES estado_contrato(estado_contrato_id);

-- Requerido para EXCLUDE con columna btree (domicilio_id) + range (tstzrange)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Máximo 1 contrato ACTIVO simultáneo por domicilio (no permite solapamiento de períodos)
ALTER TABLE contratos
  ADD CONSTRAINT ex_contrato_activo_no_solapado
  EXCLUDE USING gist (
    domicilio_id WITH =,
    tstzrange(
      fecha_inicio_contrato,
      COALESCE(fecha_fin_contrato, 'infinity'::timestamptz),
      '[)'
    ) WITH &&
  )
  WHERE (estado_contrato_id = 3);

-- ============================
-- PROMOCIONES
-- ============================
ALTER TABLE promociones
  ADD CONSTRAINT fk_promociones_tipo_promo
  FOREIGN KEY (tipo_promo_id)
  REFERENCES tipo_promocion(tipo_promo_id);

ALTER TABLE promociones
  ADD CONSTRAINT chk_promociones_fechas
  CHECK (
    fecha_vigencia_hasta_promo IS NULL
    OR fecha_vigencia_hasta_promo > fecha_vigencia_desde_promo
  );

ALTER TABLE promociones
  ADD CONSTRAINT chk_promociones_porcentaje_rango
  CHECK (
    porcentaje_descuento IS NULL
    OR (porcentaje_descuento > 0 AND porcentaje_descuento <= 100)
  );

ALTER TABLE promociones
  ADD CONSTRAINT chk_promociones_monto_positivo
  CHECK (
    monto_descuento IS NULL
    OR monto_descuento > 0
  );

ALTER TABLE promociones
  ADD CONSTRAINT chk_promociones_tipo_consistente
  CHECK (
    (
      tipo_promo_id = 1
      AND porcentaje_descuento IS NOT NULL
      AND monto_descuento IS NULL
    )
    OR
    (
      tipo_promo_id = 2
      AND monto_descuento IS NOT NULL
      AND porcentaje_descuento IS NULL
    )
  );

-- ============================
-- TIPO_PROMOCION
-- ============================
ALTER TABLE tipo_promocion
  ADD CONSTRAINT uq_tipo_promocion_descripcion
  UNIQUE (descripcion_tpromo);

-- ============================
-- PAGOS
-- ============================
ALTER TABLE pagos
  ADD CONSTRAINT fk_pago_contrato
  FOREIGN KEY (contrato_id)
  REFERENCES contratos(contrato_id);

ALTER TABLE pagos
  ADD CONSTRAINT fk_pago_factura_venta
  FOREIGN KEY (factura_ventas_id)
  REFERENCES facturas_ventas(factura_venta_id);

ALTER TABLE pagos
  ADD CONSTRAINT fk_pago_estado
  FOREIGN KEY (estado_pago_id)
  REFERENCES estado_pago(estado_pago_id);

ALTER TABLE pagos
  ADD CONSTRAINT uq_pago_contrato_periodo
  UNIQUE (contrato_id, periodo_anio_pago, periodo_mes_pago);

-- ============================
-- PAGOS_MOVIMIENTOS
-- ============================
ALTER TABLE pagos_movimientos
  ADD CONSTRAINT fk_pago_mov_pago
  FOREIGN KEY (pago_id)
  REFERENCES pagos(pago_id);

ALTER TABLE pagos_movimientos
  ADD CONSTRAINT fk_pago_mov_tipo_pago
  FOREIGN KEY (tipo_pago_id)
  REFERENCES tipo_pago(tipo_pago_id);

ALTER TABLE pagos_movimientos
  ADD CONSTRAINT fk_pago_mov_medio_pago
  FOREIGN KEY (medio_pago_id)
  REFERENCES medios_pagos(medio_pago_id);

-- ============================
-- PAGOS_COMPROBANTES
-- ============================
ALTER TABLE pagos_comprobantes
  ADD CONSTRAINT fk_pago_comprobante_mov
  FOREIGN KEY (pago_mov_id)
  REFERENCES pagos_movimientos(pago_mov_id)
  ON DELETE CASCADE;
  
-- ============================
-- RECIBOS
-- ============================
ALTER TABLE recibos
  ADD CONSTRAINT fk_recibo_pago_mov
  FOREIGN KEY (pago_mov_id)
  REFERENCES pagos_movimientos(pago_mov_id)
  ON DELETE CASCADE;
ALTER TABLE recibos
  ADD CONSTRAINT uq_recibo_pago_mov
  UNIQUE (pago_mov_id);
ALTER TABLE recibos
  ADD CONSTRAINT chk_recibo_importe_positivo
  CHECK (importe_recibo > 0);

-- ============================
-- MEDIOS_PAGOS
-- ============================
ALTER TABLE medios_pagos
  ADD CONSTRAINT uq_medios_pagos_descripcion
  UNIQUE (descripcion_mpagos);

-- ============================
-- PROGRAMACION_INSTALACIONES
-- ============================
ALTER TABLE programacion_instalaciones
  ADD CONSTRAINT fk_pinstalacion_domicilios
  FOREIGN KEY (domicilio_id)
  REFERENCES domicilios(domicilio_id);

ALTER TABLE programacion_instalaciones
  ADD CONSTRAINT fk_pinstalacion_contrato
  FOREIGN KEY (contrato_id)
  REFERENCES contratos(contrato_id);

ALTER TABLE programacion_instalaciones
  ADD CONSTRAINT fk_pinstalacion_estado
  FOREIGN KEY (estado_programacion_id)
  REFERENCES estado_programacion(estado_programacion_id);

-- ============================
-- REPROGRAMACION_INSTALACIONES
-- ============================
ALTER TABLE reprogramacion_instalaciones
  ADD CONSTRAINT fk_pinst_reprog_programacion
  FOREIGN KEY (programacion_id)
  REFERENCES programacion_instalaciones(programacion_id);

-- ============================
-- INSTALACIONES
-- ============================
ALTER TABLE instalaciones
  ADD CONSTRAINT fk_instalacion_programacion
  FOREIGN KEY (programacion_id)
  REFERENCES programacion_instalaciones(programacion_id);
  
ALTER TABLE instalaciones
  ADD CONSTRAINT fk_instalaciones_contrato
  FOREIGN KEY (contrato_id)
  REFERENCES contratos(contrato_id);

ALTER TABLE instalaciones
  ADD CONSTRAINT fk_instalacion_domicilios
  FOREIGN KEY (domicilio_id)
  REFERENCES domicilios(domicilio_id);

ALTER TABLE instalaciones
  ADD CONSTRAINT fk_instalacion_estado
  FOREIGN KEY (estado_instalacion_id)
  REFERENCES estado_instalacion(estado_instalacion_id);
  
ALTER TABLE instalaciones
  ADD CONSTRAINT uq_instalacion_programacion
  UNIQUE (programacion_id);

-- ============================
-- DETALLE_INSTALACION
-- ============================
ALTER TABLE detalle_instalacion
  ADD CONSTRAINT fk_dinstalacion_instalacion
  FOREIGN KEY (instalacion_id)
  REFERENCES instalaciones(instalacion_id);

ALTER TABLE detalle_instalacion
  ADD CONSTRAINT fk_dinstalacion_producto
  FOREIGN KEY (producto_id)
  REFERENCES productos(producto_id);
  
ALTER TABLE detalle_instalacion
  ADD CONSTRAINT chk_cantidad_dinstalacion
  CHECK (cantidad_dinstalacion > 0);

-- ============================
-- GARANTIA
-- ============================
ALTER TABLE garantia
  ADD CONSTRAINT fk_garantia_instalacion
  FOREIGN KEY (instalacion_id)
  REFERENCES instalaciones(instalacion_id);

ALTER TABLE garantia
  ADD CONSTRAINT fk_garantia_contrato
  FOREIGN KEY (contrato_id)
  REFERENCES contratos(contrato_id);

ALTER TABLE garantia
  ADD CONSTRAINT fk_garantia_producto
  FOREIGN KEY (producto_id)
  REFERENCES productos(producto_id);

ALTER TABLE garantia
  ADD CONSTRAINT fk_garantia_estado
  FOREIGN KEY (estado_garantia_id)
  REFERENCES estado_garantia(estado_garantia_id);

ALTER TABLE garantia
  ADD CONSTRAINT uq_garantia_instalacion_producto
  UNIQUE (instalacion_id, producto_id);
  
ALTER TABLE garantia
  ADD CONSTRAINT chk_garantia_fechas
  CHECK (
    fecha_fin_garantia IS NULL
    OR fecha_fin_garantia >= fecha_inicio_garantia
  );

-- ============================
-- PRODUCTOS
-- ============================
ALTER TABLE productos
  ADD CONSTRAINT fk_producto_tipo
  FOREIGN KEY (tipo_producto_id)
  REFERENCES tipo_producto(tipo_producto_id);

-- ============================
-- PRODUCTO_PRESENTACION
-- ============================
ALTER TABLE producto_presentacion
  ADD CONSTRAINT fk_pp_producto
  FOREIGN KEY (producto_id)
  REFERENCES productos(producto_id);

-- ============================
-- PRODUCTO_KIT_DETALLE
-- ============================
ALTER TABLE producto_kit_detalle
  ADD CONSTRAINT fk_kit_producto
  FOREIGN KEY (producto_kit_id)
  REFERENCES productos(producto_id);

ALTER TABLE producto_kit_detalle
  ADD CONSTRAINT fk_kit_componente
  FOREIGN KEY (producto_componente_id)
  REFERENCES productos(producto_id);

-- ============================
-- LISTA_PRECIOS_COMPRA
-- ============================
ALTER TABLE lista_precios_compra
  ADD CONSTRAINT fk_lpc_producto
  FOREIGN KEY (producto_id)
  REFERENCES productos(producto_id);

ALTER TABLE lista_precios_compra
  ADD CONSTRAINT fk_lpc_presentacion
  FOREIGN KEY (presentacion_id)
  REFERENCES producto_presentacion(presentacion_id);

ALTER TABLE lista_precios_compra
  ADD CONSTRAINT fk_lpc_proveedor
  FOREIGN KEY (proveedor_id)
  REFERENCES proveedor(proveedor_id);

-- ============================
-- MOVIMIENTO_STOCK_ITEM
-- ============================
ALTER TABLE movimiento_stock_item
  ADD CONSTRAINT fk_msi_producto
  FOREIGN KEY (producto_id)
  REFERENCES productos(producto_id);

-- ============================
-- MOVIMIENTO_STOCK
-- ============================
ALTER TABLE movimiento_stock
  ADD CONSTRAINT fk_ms_item
  FOREIGN KEY (mov_stock_item_id)
  REFERENCES movimiento_stock_item(mov_stock_item_id);

ALTER TABLE movimiento_stock
  ADD CONSTRAINT fk_ms_tipo
  FOREIGN KEY (tipo_mov_id)
  REFERENCES tipo_movimiento_stock(tipo_mov_id);

ALTER TABLE movimiento_stock
  ADD CONSTRAINT fk_ms_det_instalacion
  FOREIGN KEY (det_instalacion_id)
  REFERENCES detalle_instalacion(det_instalacion_id);

-- ============================
-- PROVEEDOR
-- ============================
ALTER TABLE proveedor
  ADD CONSTRAINT fk_proveedor_estado
  FOREIGN KEY (estado_proveedor_id)
  REFERENCES estado_proveedor(estado_proveedor_id);

-- ============================
-- FACTURAS_COMPRAS
-- ============================
ALTER TABLE facturas_compras
  ADD CONSTRAINT fk_fcompra_proveedor
  FOREIGN KEY (proveedor_id)
  REFERENCES proveedor(proveedor_id);

-- ============================
-- DETALLE_FACTURAS_COMPRAS
-- ============================
ALTER TABLE detalle_facturas_compras
  ADD CONSTRAINT fk_dfcompra_factura
  FOREIGN KEY (factura_compra_id)
  REFERENCES facturas_compras(factura_compra_id);

ALTER TABLE detalle_facturas_compras
  ADD CONSTRAINT fk_dfcompra_producto
  FOREIGN KEY (producto_id)
  REFERENCES productos(producto_id);

-- ============================
-- FACTURAS_VENTAS
-- ============================
ALTER TABLE facturas_ventas
  ADD CONSTRAINT fk_fventa_cliente
  FOREIGN KEY (cliente_id)
  REFERENCES clientes(cliente_id);

ALTER TABLE facturas_ventas
  ADD CONSTRAINT fk_fventa_estado
  FOREIGN KEY (estado_factura_venta_id)
  REFERENCES estado_facturas_ventas(estado_fact_venta_id);

-- ============================
-- DETALLE_FACTURAS_VENTAS
-- ============================
ALTER TABLE detalle_facturas_ventas
  ADD CONSTRAINT fk_dfventa_factura
  FOREIGN KEY (factura_venta_id)
  REFERENCES facturas_ventas(factura_venta_id);

ALTER TABLE detalle_facturas_ventas
  ADD CONSTRAINT fk_dfventa_producto
  FOREIGN KEY (producto_id)
  REFERENCES productos(producto_id);

ALTER TABLE detalle_facturas_ventas
  ADD CONSTRAINT fk_dfventa_estado
  FOREIGN KEY (estado_det_fact_venta_id)
  REFERENCES estado_detalle_facturas_ventas(estado_det_fact_ventas_id);

-- ============================
-- DETALLE_RECIBOS
-- ============================
ALTER TABLE detalle_recibos
  ADD CONSTRAINT fk_drecibo_recibo
  FOREIGN KEY (recibo_id)
  REFERENCES recibos(recibo_id)
  ON DELETE CASCADE;

ALTER TABLE detalle_recibos
  ADD CONSTRAINT fk_drecibo_factura
  FOREIGN KEY (factura_venta_id)
  REFERENCES facturas_ventas(factura_venta_id);
  
ALTER TABLE detalle_recibos
  ADD CONSTRAINT uq_drecibo_recibo_factura
  UNIQUE (recibo_id, factura_venta_id);

-- ============================
-- ROLES
-- ============================
ALTER TABLE roles
  ADD CONSTRAINT uq_roles_codigo
  UNIQUE (codigo_rol);

-- ============================
-- USUARIOS
-- ============================
ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuarios_rol
  FOREIGN KEY (rol_id)
  REFERENCES roles(rol_id);

ALTER TABLE usuarios
  ADD CONSTRAINT uq_usuarios_username
  UNIQUE (username_usuario);

ALTER TABLE usuarios
  ADD CONSTRAINT uq_usuarios_email
  UNIQUE (email_usuario);

-- ============================
-- SESIONES_USUARIOS
-- ============================
ALTER TABLE sesiones_usuarios
  ADD CONSTRAINT fk_sesiones_usuario
  FOREIGN KEY (usuario_id)
  REFERENCES usuarios(usuario_id);

ALTER TABLE sesiones_usuarios
  ADD CONSTRAINT uq_sesiones_token_hash
  UNIQUE (token_hash_sesion);

-- ============================
-- AUDITORIA_EVENTOS
-- ============================
ALTER TABLE auditoria_eventos
  ADD CONSTRAINT fk_auditoria_usuario
  FOREIGN KEY (usuario_id)
  REFERENCES usuarios(usuario_id);
