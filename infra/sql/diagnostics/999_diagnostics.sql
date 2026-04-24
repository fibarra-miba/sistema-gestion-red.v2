-- ======================================================
-- 999_diagnostics.sql
-- Consultas de diagnóstico / inspección manual
-- No modifica datos
-- ======================================================

-- ======================================================
-- 1) CLIENTES
-- ======================================================

SELECT
  c.cliente_id,
  c.nombre_cliente,
  c.apellido_cliente,
  c.dni_cliente,
  c.telefono_cliente,
  c.email_cliente,
  ec.descripcion AS estado_cliente
FROM clientes c
LEFT JOIN estado_cliente ec
  ON ec.estado_cliente_id = c.estado_cliente_id
ORDER BY c.cliente_id;


-- ======================================================
-- 2) DOMICILIOS
-- ======================================================

SELECT
  d.domicilio_id,
  d.cliente_id,
  d.complejo,
  d.piso,
  d.depto,
  d.calle,
  d.numero,
  d.referencias,
  d.fecha_desde_dom,
  d.fecha_hasta_dom,
  ed.descripcion_edomicilio AS estado_domicilio
FROM domicilios d
LEFT JOIN estado_domicilio ed
  ON ed.estado_domicilio_id = d.estado_domicilio_id
ORDER BY d.cliente_id, d.domicilio_id;


-- ======================================================
-- 3) CONTRATOS
-- ======================================================

SELECT
  c.contrato_id,
  c.cliente_id,
  c.domicilio_id,
  c.plan_id,
  p.nombre_plan,
  c.fecha_inicio_contrato,
  c.fecha_fin_contrato,
  c.aplica_promocion,
  c.promocion_id,
  ec.descripcion AS estado_contrato
FROM contratos c
LEFT JOIN planes p
  ON p.plan_id = c.plan_id
LEFT JOIN estado_contrato ec
  ON ec.estado_contrato_id = c.estado_contrato_id
ORDER BY c.contrato_id;


-- ======================================================
-- 4) CONTRATOS VIGENTES / COBRABLES
-- Regla:
-- cobrable = ACTIVO + VIGENTE
-- vigente = fecha_inicio <= now
--           and (fecha_fin is null or now < fecha_fin)
-- ======================================================

SELECT
  c.contrato_id,
  c.cliente_id,
  c.domicilio_id,
  c.plan_id,
  p.nombre_plan,
  ec.descripcion AS estado_contrato,
  c.fecha_inicio_contrato,
  c.fecha_fin_contrato,
  CASE
    WHEN c.fecha_inicio_contrato <= NOW()
     AND (c.fecha_fin_contrato IS NULL OR NOW() < c.fecha_fin_contrato)
    THEN TRUE
    ELSE FALSE
  END AS vigente,
  CASE
    WHEN ec.descripcion = 'ACTIVO'
     AND c.fecha_inicio_contrato <= NOW()
     AND (c.fecha_fin_contrato IS NULL OR NOW() < c.fecha_fin_contrato)
    THEN TRUE
    ELSE FALSE
  END AS cobrable
FROM contratos c
LEFT JOIN planes p
  ON p.plan_id = c.plan_id
LEFT JOIN estado_contrato ec
  ON ec.estado_contrato_id = c.estado_contrato_id
ORDER BY c.contrato_id;


-- ======================================================
-- 5) DETECTAR CONTRATOS ACTIVOS SOLAPADOS POR DOMICILIO
-- Si esto devuelve filas, hay inconsistencia de datos.
-- ======================================================

SELECT
  c1.contrato_id AS contrato_1,
  c2.contrato_id AS contrato_2,
  c1.domicilio_id,
  c1.fecha_inicio_contrato AS inicio_1,
  c1.fecha_fin_contrato AS fin_1,
  c2.fecha_inicio_contrato AS inicio_2,
  c2.fecha_fin_contrato AS fin_2
FROM contratos c1
JOIN contratos c2
  ON c1.domicilio_id = c2.domicilio_id
 AND c1.contrato_id < c2.contrato_id
 AND c1.estado_contrato_id = 3
 AND c2.estado_contrato_id = 3
 AND tstzrange(
       c1.fecha_inicio_contrato,
       COALESCE(c1.fecha_fin_contrato, 'infinity'::timestamptz),
       '[)'
     )
     &&
     tstzrange(
       c2.fecha_inicio_contrato,
       COALESCE(c2.fecha_fin_contrato, 'infinity'::timestamptz),
       '[)'
     )
ORDER BY c1.domicilio_id, c1.contrato_id, c2.contrato_id;


-- ======================================================
-- 6) PRECIOS PLANES
-- ======================================================

SELECT
  pp.precio_plan_id,
  pp.plan_id,
  p.nombre_plan,
  pp.precio_mensual_pplanes,
  pp.fecha_desde_pplanes,
  pp.fecha_hasta_pplanes,
  pp.activo_pplanes
FROM precios_planes pp
LEFT JOIN planes p
  ON p.plan_id = pp.plan_id
ORDER BY pp.plan_id, pp.fecha_desde_pplanes DESC;


-- ======================================================
-- 7) PROMOCIONES
-- ======================================================

SELECT
  pr.promocion_id,
  pr.nombre_promo,
  pr.descripcion_promo,
  tp.descripcion_tpromo AS tipo_promocion,
  pr.porcentaje_descuento,
  pr.monto_descuento,
  pr.fecha_vigencia_desde_promo,
  pr.fecha_vigencia_hasta_promo,
  pr.activo_promo
FROM promociones pr
LEFT JOIN tipo_promocion tp
  ON tp.tipo_promo_id = pr.tipo_promo_id
ORDER BY pr.promocion_id;


-- ======================================================
-- 8) FACTURAS
-- ======================================================

SELECT
  fv.factura_venta_id,
  fv.cliente_id,
  fv.fecha_emision_factura_venta,
  fv.fecha_vencimiento_factura_venta,
  fv.importe_base_factura_venta,
  fv.bonificacion_factura_venta,
  fv.total_factura_venta,
  efv.descripcion_efventa AS estado_factura
FROM facturas_ventas fv
LEFT JOIN estado_facturas_ventas efv
  ON efv.estado_factura_venta_id = fv.estado_factura_venta_id
ORDER BY fv.factura_venta_id;


-- ======================================================
-- 9) PAGOS
-- ======================================================

SELECT
  p.pago_id,
  p.contrato_id,
  p.factura_venta_id,
  p.periodo_anio_pago,
  p.periodo_mes_pago,
  ep.descripcion_epago AS estado_pago
FROM pagos p
LEFT JOIN estado_pago ep
  ON ep.estado_pago_id = p.estado_pago_id
ORDER BY p.pago_id;


-- ======================================================
-- 10) PAGOS + FACTURA + CONTRATO
-- ======================================================

SELECT
  p.pago_id,
  p.contrato_id,
  c.cliente_id,
  c.domicilio_id,
  p.factura_venta_id,
  p.periodo_anio_pago,
  p.periodo_mes_pago,
  ep.descripcion_epago AS estado_pago,
  fv.total_factura_venta
FROM pagos p
LEFT JOIN contratos c
  ON c.contrato_id = p.contrato_id
LEFT JOIN facturas_ventas fv
  ON fv.factura_venta_id = p.factura_venta_id
LEFT JOIN estado_pago ep
  ON ep.estado_pago_id = p.estado_pago_id
ORDER BY p.pago_id;


-- ======================================================
-- 11) MOVIMIENTOS DE PAGO
-- ======================================================

SELECT
  pm.pago_mov_id,
  pm.pago_id,
  pm.fecha_pago,
  pm.monto_pago,
  mp.descripcion AS medio_pago,
  tp.descripcion_tpago AS tipo_pago
FROM pagos_movimientos pm
LEFT JOIN medios_pagos mp
  ON mp.medio_pago_id = pm.medio_pago_id
LEFT JOIN tipo_pago tp
  ON tp.tipo_pago_id = pm.tipo_pago_id
ORDER BY pm.pago_mov_id;


-- ======================================================
-- 12) COMPROBANTES DE PAGO
-- ======================================================

SELECT
  pc.pago_comprobante_id,
  pc.pago_mov_id,
  pc.comprobante_url,
  pc.comprobante_mime,
  pc.comprobante_hash,
  pc.created_at
FROM pagos_comprobantes pc
ORDER BY pc.pago_comprobante_id;


-- ======================================================
-- 13) TOTAL PAGADO POR PAGO
-- ======================================================

SELECT
  p.pago_id,
  p.contrato_id,
  fv.total_factura_venta,
  COALESCE(SUM(pm.monto_pago), 0) AS total_pagado,
  GREATEST(fv.total_factura_venta - COALESCE(SUM(pm.monto_pago), 0), 0) AS saldo_pendiente,
  GREATEST(COALESCE(SUM(pm.monto_pago), 0) - fv.total_factura_venta, 0) AS excedente_credito
FROM pagos p
LEFT JOIN facturas_ventas fv
  ON fv.factura_venta_id = p.factura_venta_id
LEFT JOIN pagos_movimientos pm
  ON pm.pago_id = p.pago_id
GROUP BY
  p.pago_id,
  p.contrato_id,
  fv.total_factura_venta
ORDER BY p.pago_id;


-- ======================================================
-- 14) CUENTAS
-- ======================================================

SELECT
  cta.cuenta_id,
  cta.cliente_id,
  cta.saldo_cuenta,
  ec.descripcion_ecuenta AS estado_cuenta
FROM cuenta cta
LEFT JOIN estado_cuenta ec
  ON ec.estado_cuenta_id = cta.estado_cuenta_id
ORDER BY cta.cuenta_id;


-- ======================================================
-- 15) DETALLE CUENTA CORRIENTE
-- ======================================================

SELECT
  dcc.detalle_cuenta_id,
  dcc.cuenta_id,
  cta.cliente_id,
  tm.codigo_tipo_mov_det_cuenta,
  tm.descripcion_tipo_mov_det_cuenta,
  tm.signo_tipo_mov_det_cuenta,
  dcc.importe_det_cuenta,
  dcc.fecha_det_cuenta,
  dcc.factura_venta_id,
  dcc.pago_id,
  dcc.observacion_det_cuenta
FROM detalle_cuenta dcc
LEFT JOIN cuenta cta
  ON cta.cuenta_id = dcc.cuenta_id
LEFT JOIN tipo_movimiento_detalle_cuenta tm
  ON tm.tipo_mov_det_cuenta_id = dcc.tipo_mov_det_cuenta_id
ORDER BY dcc.detalle_cuenta_id;


-- ======================================================
-- 16) SALDO POR CLIENTE RECONSTRUIDO DESDE DETALLE_CUENTA
-- ======================================================

SELECT
  cta.cliente_id,
  SUM(
    CASE
      WHEN tm.signo_tipo_mov_det_cuenta = 'D' THEN dcc.importe_det_cuenta
      WHEN tm.signo_tipo_mov_det_cuenta = 'H' THEN -dcc.importe_det_cuenta
      ELSE 0
    END
  ) AS saldo_reconstruido
FROM detalle_cuenta dcc
JOIN cuenta cta
  ON cta.cuenta_id = dcc.cuenta_id
JOIN tipo_movimiento_detalle_cuenta tm
  ON tm.tipo_mov_det_cuenta_id = dcc.tipo_mov_det_cuenta_id
GROUP BY cta.cliente_id
ORDER BY cta.cliente_id;


-- ======================================================
-- 17) COMPARACIÓN: saldo cuenta vs saldo reconstruido
-- ======================================================

SELECT
  cta.cuenta_id,
  cta.cliente_id,
  cta.saldo_cuenta AS saldo_tabla_cuenta,
  COALESCE(x.saldo_reconstruido, 0) AS saldo_reconstruido,
  cta.saldo_cuenta - COALESCE(x.saldo_reconstruido, 0) AS diferencia
FROM cuenta cta
LEFT JOIN (
  SELECT
    cta2.cuenta_id,
    SUM(
      CASE
        WHEN tm.signo_tipo_mov_det_cuenta = 'D' THEN dcc.importe_det_cuenta
        WHEN tm.signo_tipo_mov_det_cuenta = 'H' THEN -dcc.importe_det_cuenta
        ELSE 0
      END
    ) AS saldo_reconstruido
  FROM detalle_cuenta dcc
  JOIN cuenta cta2
    ON cta2.cuenta_id = dcc.cuenta_id
  JOIN tipo_movimiento_detalle_cuenta tm
    ON tm.tipo_mov_det_cuenta_id = dcc.tipo_mov_det_cuenta_id
  GROUP BY cta2.cuenta_id
) x
  ON x.cuenta_id = cta.cuenta_id
ORDER BY cta.cuenta_id;
