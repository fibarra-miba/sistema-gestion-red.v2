// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/producto.py y backend/app/routes/productos.py

export interface ProductoOut {
  producto_id: number
  nombre_producto: string
  descripcion_producto: string | null
  marca_producto: string
  modelo_producto: string
  activo_producto: boolean
  tipo_producto_id: number
  unidad_stock_producto: string | null
  // Enriquecido vía join con tipo_producto.
  codigo_tproducto: string | null
  descripcion_tproducto: string | null
}

export interface ProductoListResponse {
  items: ProductoOut[]
}

export interface ProductoCreate {
  nombre_producto: string
  descripcion_producto?: string | null
  marca_producto: string
  modelo_producto: string
  tipo_producto_id: number
  unidad_stock_producto?: string | null
}

// PATCH parcial: backend usa exclude_unset=True.
export interface ProductoUpdate {
  nombre_producto?: string
  descripcion_producto?: string | null
  marca_producto?: string
  modelo_producto?: string
  tipo_producto_id?: number
  unidad_stock_producto?: string | null
  activo_producto?: boolean
}

// Presentaciones de compra: la "bolsa x100" → factor a unidad base de stock.
export interface PresentacionOut {
  presentacion_id: number
  producto_id: number
  nombre_presentacion: string
  unidad_compra_presentacion: string
  factor_a_stock: number
}

export interface PresentacionListResponse {
  items: PresentacionOut[]
}

export interface PresentacionCreate {
  nombre_presentacion: string
  unidad_compra_presentacion: string
  factor_a_stock: number
}

export interface ListProductosParams {
  search?: string
  solo_activos?: boolean
  tipo_producto_id?: number
  limit?: number
  offset?: number
}
