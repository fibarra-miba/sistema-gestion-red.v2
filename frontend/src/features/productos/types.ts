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
}

// PATCH parcial: backend usa exclude_unset=True.
export interface ProductoUpdate {
  nombre_producto?: string
  descripcion_producto?: string | null
  marca_producto?: string
  modelo_producto?: string
  tipo_producto_id?: number
  activo_producto?: boolean
}

export interface ListProductosParams {
  search?: string
  solo_activos?: boolean
  tipo_producto_id?: number
  limit?: number
  offset?: number
}
