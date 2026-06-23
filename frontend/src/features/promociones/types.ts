// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/promocion.py y backend/app/routes/promociones.py

// tipo_promocion sembrado en 005: 1=PORCENTAJE, 2=DESCUENTO_FIJO.
export const TIPO_PROMO_PORCENTAJE = 1
export const TIPO_PROMO_DESCUENTO_FIJO = 2

export interface PromocionOut {
  promocion_id: number
  nombre_promo: string
  descripcion_promo: string | null
  tipo_promo_id: number
  // Enriquecido vía join con tipo_promocion.
  descripcion_tpromo: string | null
  porcentaje_descuento: number | null
  monto_descuento: number | null
  fecha_vigencia_desde_promo: string
  fecha_vigencia_hasta_promo: string | null
  activo_promo: boolean
}

export interface PromocionListResponse {
  items: PromocionOut[]
}

export interface PromocionCreate {
  nombre_promo: string
  descripcion_promo?: string | null
  tipo_promo_id: number
  porcentaje_descuento?: number | null
  monto_descuento?: number | null
  fecha_vigencia_desde_promo: string
  fecha_vigencia_hasta_promo?: string | null
  activo_promo?: boolean
}

// PATCH parcial: backend usa exclude_unset=True.
export interface PromocionUpdate {
  nombre_promo?: string
  descripcion_promo?: string | null
  tipo_promo_id?: number
  porcentaje_descuento?: number | null
  monto_descuento?: number | null
  fecha_vigencia_desde_promo?: string
  fecha_vigencia_hasta_promo?: string | null
  activo_promo?: boolean
}

export interface ListPromocionesParams {
  activo?: boolean
  tipo_promo_id?: number
  vigentes?: boolean
  limit?: number
  offset?: number
}
