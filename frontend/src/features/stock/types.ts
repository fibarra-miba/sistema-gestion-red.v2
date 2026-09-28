// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/stock.py y backend/app/routes/stock.py

export interface ExistenciaOut {
  producto_id: number
  nombre_producto: string
  marca_producto: string
  modelo_producto: string
  unidad_stock_producto: string | null
  tipo_producto_id: number
  codigo_tproducto: string | null
  cantidad: number
  valor: number
  costo_promedio: number
}

// Lo mínimo que necesita el diálogo de movimiento. Una fila de existencias lo
// cumple, y también un producto recién creado que todavía no tiene movimientos
// (ahí `cantidad` es desconocida y no se muestra).
export interface MovimientoStockTarget {
  producto_id: number
  nombre_producto: string
  unidad_stock_producto: string | null
  cantidad?: number
}

export interface ExistenciaListResponse {
  items: ExistenciaOut[]
}

export interface SaldoStockOut {
  producto_id: number
  cantidad: number
  valor: number
  costo_promedio: number
}

export interface MovimientoStockOut {
  mov_stock_id: number
  producto_id: number
  factor_b_stock: number
  observacion_dmstock: string | null
  tipo_mov_id: number
  codigo_tmstock: string
  descripcion_tmstock: string
  signo_tmstock: string
  fecha_mstock: string
  costo_unitario_mstock: number
  det_instalacion_id: number | null
  det_factura_compra_id: number | null
}

export interface MovimientoStockListResponse {
  items: MovimientoStockOut[]
}

export interface AjusteStockCreate {
  producto_id: number
  cantidad: number
  positivo: boolean
  motivo: string
}

export interface DevolucionStockCreate {
  producto_id: number
  cantidad: number
  motivo: string
  det_instalacion_id?: number | null
}

export interface ListExistenciasParams {
  search?: string
  tipo_producto_id?: number
  solo_con_stock?: boolean
  limit?: number
  offset?: number
}
