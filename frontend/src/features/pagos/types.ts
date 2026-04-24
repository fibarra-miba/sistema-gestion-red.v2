// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/pago.py y backend/app/routes/pagos.py

// ============================================================
// ESTADOS
// ============================================================

export type EstadoPago = 'PENDIENTE' | 'PARCIAL' | 'PAGADO'

export type EstadoCuenta = 'AL_DIA' | 'DEUDOR' | 'SALDO_A_FAVOR'

export type TipoMovimientoCuenta = 'FACTURA' | 'PAGO' | 'AJUSTE_D' | 'AJUSTE_H'

// ============================================================
// COMPROBANTES / RECIBO
// ============================================================

export interface ComprobanteIn {
  url: string
  mime?: string | null
  hash?: string | null
}

export interface PagoComprobanteOut {
  pago_comprobante_id: number
  comprobante_url: string
  comprobante_mime: string | null
  comprobante_hash: string | null
  comprobante_created_at: string
}

export interface ReciboOut {
  recibo_id: number
  pago_mov_id: number
  comprobante_transferencia_recibo: string | null
  recepcion_transferencia_recibo: boolean | null
  importe_recibo: number
  fecha_recibo: string
}

// ============================================================
// GENERACIÓN DE PERÍODO (INDIVIDUAL / LOTE)
// ============================================================

export interface GenerarPeriodoIn {
  periodo_anio_pago: number
  periodo_mes_pago: number
  fecha_emision?: string | null
  fecha_vencimiento?: string | null
  bonificacion_previa?: number
}

export interface GenerarLoteIn {
  periodo_anio_pago: number
  periodo_mes_pago: number
  fecha_emision?: string | null
  fecha_vencimiento?: string | null
  bonificacion_previa_default?: number
}

export interface GenerarLoteErrorItem {
  contrato_id: number
  error: string
  status_code: number
}

export interface GenerarLoteOut {
  creados: number
  omitidos_existentes: number
  errores: GenerarLoteErrorItem[]
}

// ============================================================
// PAGO / DETALLE
// ============================================================

export interface PagoOut {
  pago_id: number
  contrato_id: number
  factura_venta_id: number
  periodo_anio_pago: number
  periodo_mes_pago: number
  estado: EstadoPago
  total_factura: number
  total_pagado: number
  saldo_pendiente: number
  excedente_credito: number
}

export interface FacturaResumenOut {
  factura_venta_id: number
  cliente_id: number
  fecha_emision: string
  fecha_vencimiento: string | null
  importe_base: number
  bonificacion: number
  total: number
}

export interface PagoMovimientoOut {
  pago_mov_id: number
  pago_id: number
  fecha_pago: string
  monto_pago: number
  medio_pago_id: number
  tipo_pago_id: number
  comprobantes: PagoComprobanteOut[]
  recibo: ReciboOut | null
}

export interface PagoDetalleOut {
  pago: PagoOut
  factura: FacturaResumenOut
  movimientos: PagoMovimientoOut[]
  saldo_cuenta_resultante: number
}

export interface GenerarPeriodoOut {
  pago: PagoOut
  saldo_cuenta_resultante: number
}

// ============================================================
// REGISTRO DE MOVIMIENTO DE PAGO
// ============================================================

export interface PagoMovimientoIn {
  fecha_pago: string // ISO datetime
  monto_pago: number
  medio_pago_id: number
  tipo_pago_id: number
  observacion?: string | null
  comprobantes?: ComprobanteIn[] | null
}

// ============================================================
// LISTADO DE PAGOS POR CONTRATO
// ============================================================

export interface ContratoPagoListItemOut {
  pago_id: number
  periodo_anio_pago: number
  periodo_mes_pago: number
  estado: EstadoPago
  total_factura: number
  total_pagado: number
  saldo_pendiente: number
  excedente_credito: number
  fecha_emision: string
  fecha_vencimiento: string | null
}

export interface ListPagosContratoParams {
  anio?: number
  mes?: number
  estado?: EstadoPago
  limit?: number
  offset?: number
}

// ============================================================
// FACTURA — PATCH BONIFICACIÓN
// ============================================================

export interface PatchFacturaBonificacionIn {
  bonificacion_fventas: number
}

export interface PatchFacturaBonificacionOut {
  factura_venta_id: number
  total_old: number
  total_new: number
  diff: number
  saldo_cuenta_resultante: number
}

// ============================================================
// CUENTA CORRIENTE
// ============================================================

export interface CuentaClienteOut {
  cliente_id: number
  saldo_cuenta: number
  deuda_actual: number
  credito_actual: number
  estado_calculado: EstadoCuenta
}

export interface CuentaMovimientoOut {
  det_cuenta_id: number
  fecha: string
  tipo: TipoMovimientoCuenta
  signo: '+' | '-'
  importe: number
  factura_venta_id: number | null
  pago_id: number | null
  observacion: string | null
}

export interface CuentaMovimientosOut {
  cuenta_id: number | null
  saldo_cuenta: number
  movimientos: CuentaMovimientoOut[]
}

export interface ListCuentaMovimientosParams {
  desde?: string // YYYY-MM-DD
  hasta?: string // YYYY-MM-DD
  tipo?: TipoMovimientoCuenta
  limit?: number
  offset?: number
}
