// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/plan.py y backend/app/routes/planes.py

// ============================================================
// PLANES
// ============================================================

// GET /planes y GET /planes/{id} devuelven PlanCommercialResponse:
// el plan junto con los datos derivados del precio vigente.
// El precio vigente NO vive en el plan: surge de la tabla de precios.
export interface PlanOut {
  plan_id: number
  nombre_plan: string
  velocidad_mbps_plan: number
  descripcion_plan: string | null
  estado_plan_id: number
  precio_vigente: number | null
  fecha_desde_precio_vigente: string | null
  fecha_hasta_precio_vigente: string | null
}

export interface PlanListResponse {
  items: PlanOut[]
}

export interface PlanCreate {
  nombre_plan: string
  velocidad_mbps_plan: number
  descripcion_plan?: string | null
  estado_plan_id: number
}

// PATCH parcial: backend usa exclude_unset=True.
export interface PlanUpdate {
  nombre_plan?: string
  velocidad_mbps_plan?: number
  descripcion_plan?: string | null
  estado_plan_id?: number
}

// ============================================================
// PRECIOS DE PLAN
// ============================================================
// El historial de precios es una entidad aparte. No pueden existir
// precios solapados para un mismo plan (lo valida el backend, 400).

export interface PrecioPlanOut {
  precios_planes_id: number
  plan_id: number
  precio_mensual_pplanes: number
  fecha_desde_pplanes: string
  fecha_hasta_pplanes: string | null
}

export interface PrecioPlanListResponse {
  items: PrecioPlanOut[]
}

export interface PrecioPlanCreate {
  precio_mensual_pplanes: number
  fecha_desde_pplanes: string // ISO datetime
  fecha_hasta_pplanes?: string | null
}

// PATCH parcial: backend usa exclude_unset=True.
// Solo se permite editar precios FUTUROS (regla de dominio del backend).
export interface PrecioPlanUpdate {
  precio_mensual_pplanes?: number
  fecha_desde_pplanes?: string
  fecha_hasta_pplanes?: string | null
}
