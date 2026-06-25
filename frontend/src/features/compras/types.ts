// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/compra.py y backend/app/routes/compras.py

export interface CompraDetalleOut {
  det_factura_compra_id: number
  factura_compra_id: number
  producto_id: number
  nombre_producto: string | null
  presentacion_id: number | null
  nombre_presentacion: string | null
  cantidad_presentacion: number
  factor_aplicado: number
  cantidad_base: number
  costo_unitario_base: number
  subtotal: number
}

export interface CompraOut {
  factura_compra_id: number
  proveedor_id: number
  nombre_prov: string | null
  codigo_fcompras: string | null
  descripcion_fcompras: string | null
  fecha_fcompras: string
  importe_total_fcompras: number
  estado_factura_compra_id: number
  descripcion_efcompra: string | null
  detalles: CompraDetalleOut[]
}

export interface CompraListItem {
  factura_compra_id: number
  proveedor_id: number
  nombre_prov: string | null
  codigo_fcompras: string | null
  descripcion_fcompras: string | null
  fecha_fcompras: string
  importe_total_fcompras: number
  estado_factura_compra_id: number
  descripcion_efcompra: string | null
}

export interface CompraListResponse {
  items: CompraListItem[]
}

export interface CompraDetalleCreate {
  producto_id: number
  presentacion_id?: number | null
  cantidad_presentacion: number
  costo_presentacion: number
}

export interface CompraCreate {
  proveedor_id: number
  codigo_fcompras?: string | null
  descripcion_fcompras?: string | null
  fecha_fcompras?: string | null
  detalles: CompraDetalleCreate[]
}

export interface ListComprasParams {
  proveedor_id?: number
  estado_factura_compra_id?: number
  desde?: string
  hasta?: string
  limit?: number
  offset?: number
}
