// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/proveedor.py y backend/app/routes/proveedores.py

export interface ProveedorOut {
  proveedor_id: number
  nombre_prov: string | null
  direccion_prov: string | null
  descripcion_prov: string | null
  link_maps_prov: string | null
  telefono_prov: string | null
  email_prov: string | null
  web_prov: string | null
  observacion_prov: string | null
  estado_proveedor_id: number
  // Enriquecido vía join con estado_proveedor.
  descripcion_eprov: string | null
}

export interface ProveedorListResponse {
  items: ProveedorOut[]
}

export interface ProveedorCreate {
  nombre_prov: string
  direccion_prov?: string | null
  descripcion_prov?: string | null
  link_maps_prov?: string | null
  telefono_prov?: string | null
  email_prov?: string | null
  web_prov?: string | null
  observacion_prov?: string | null
  estado_proveedor_id: number
}

// PATCH parcial: backend usa exclude_unset=True.
export interface ProveedorUpdate {
  nombre_prov?: string
  direccion_prov?: string | null
  descripcion_prov?: string | null
  link_maps_prov?: string | null
  telefono_prov?: string | null
  email_prov?: string | null
  web_prov?: string | null
  observacion_prov?: string | null
  estado_proveedor_id?: number
}

export interface ListProveedoresParams {
  search?: string
  estado_proveedor_id?: number
  limit?: number
  offset?: number
}
