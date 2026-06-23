-- =========================
-- Índices útiles
-- =========================
CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_plan_id ON contratos(plan_id);
CREATE INDEX IF NOT EXISTS idx_pagos_contrato_id ON pagos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contratos_domicilio_id ON contratos(domicilio_id);
CREATE INDEX IF NOT EXISTS idx_pinst_reprog_programacion ON reprogramacion_instalaciones(programacion_id);
CREATE INDEX IF NOT EXISTS idx_dinstalacion_instalacion ON detalle_instalacion(instalacion_id);
CREATE INDEX IF NOT EXISTS idx_instalaciones_contrato ON instalaciones(contrato_id);
CREATE INDEX IF NOT EXISTS idx_instalaciones_programacion ON instalaciones(programacion_id);
CREATE INDEX IF NOT EXISTS idx_pinstalaciones_contrato ON programacion_instalaciones(contrato_id);
CREATE INDEX IF NOT EXISTS idx_pinstalaciones_estado ON programacion_instalaciones(estado_programacion_id);
CREATE INDEX IF NOT EXISTS idx_pinstalaciones_fecha ON programacion_instalaciones(fecha_programacion_pinstalacion);
CREATE INDEX IF NOT EXISTS idx_instalaciones_estado ON instalaciones(estado_instalacion_id);
CREATE INDEX IF NOT EXISTS idx_garantia_contrato ON garantia(contrato_id);
CREATE INDEX IF NOT EXISTS idx_garantia_instalacion ON garantia(instalacion_id);
CREATE INDEX IF NOT EXISTS idx_dinstalacion_producto ON detalle_instalacion(producto_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cobrables ON contratos (estado_contrato_id, fecha_inicio_contrato, fecha_fin_contrato, contrato_id)
  WHERE estado_contrato_id = 3;
CREATE INDEX IF NOT EXISTS idx_pagos_movimientos_pago_id_fecha ON pagos_movimientos (pago_id, fecha_pago, pago_mov_id);
CREATE INDEX IF NOT EXISTS idx_recibos_pago_mov_id ON recibos (pago_mov_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios (rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios (activo_usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_id ON sesiones_usuarios (usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_expiracion ON sesiones_usuarios (fecha_expiracion_sesion);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria_eventos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_modulo_accion ON auditoria_eventos (modulo_auditoria, accion_auditoria);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria_eventos (created_at);

-- Unicidad de producto por (nombre, marca, modelo), case-insensitive.
-- Los tres son NOT NULL, así que no hace falta NULLS NOT DISTINCT.
CREATE UNIQUE INDEX IF NOT EXISTS uq_producto_nombre_marca_modelo
  ON productos (lower(nombre_producto), lower(marca_producto), lower(modelo_producto));
