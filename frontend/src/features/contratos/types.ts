// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/contrato.py y backend/app/routes/contratos.py

// ============================================================
// CREATE
// ============================================================

export interface ContractCreate {
  cliente_id: number
  domicilio_id: number
  plan_id: number
  // Promo opcional en el alta. Si se informa, el contrato nace con
  // aplica_promocion=true.
  promocion_id?: number | null
}

// ============================================================
// RESPONSE (RAW / OPERATIVO)
// ============================================================
// Lo devuelve POST /contratos y POST /contratos/{id}/change-plan.

export interface ContractOut {
  contrato_id: number
  cliente_id: number
  domicilio_id: number
  plan_id: number
  precio_base_contrato: number
  fecha_inicio_contrato: string
  fecha_fin_contrato: string | null
  estado_contrato_id: number
  aplica_promocion: boolean
  promocion_id: number | null
}

// ============================================================
// RESPONSE (COMERCIAL / ENRIQUECIDO)
// ============================================================
// Lo devuelven GET /contratos y GET /contratos/{id}.

export interface ContractCommercialOut {
  contrato_id: number
  // Nombre personalizado del contrato. Hoy el backend puede no enviarlo
  // según versión; la UI lo trata como opcional y hace fallback a un
  // nombre derivado (plan + cliente). Ver contratoDisplayName().
  nombre_contrato?: string | null
  cliente_id: number
  cliente_nombre: string
  cliente_apellido: string
  domicilio_id: number
  domicilio_resumen: string | null
  plan_id: number
  plan_nombre: string
  precio_base_contrato: number
  fecha_inicio_contrato: string
  fecha_fin_contrato: string | null
  estado_contrato_id: number
  estado_contrato_descripcion: string
  aplica_promocion: boolean
  promocion_id: number | null
}

export interface ContractCommercialListResponse {
  items: ContractCommercialOut[]
}

// ============================================================
// LIST PARAMS
// ============================================================

export interface ListContratosParams {
  cliente_id?: number
  estado_contrato_id?: number
  plan_id?: number
  domicilio_id?: number
}

// ============================================================
// ACCIONES
// ============================================================

export interface ContractChangePlan {
  new_plan_id: number
}

export interface ContractAssignPromo {
  promocion_id: number
}

export interface ContractProgramarInstalacion {
  fecha_programacion_pinstalacion: string
  tecnico_pinstalacion?: string | null
  notas_pinstalacion?: string | null
}

export interface ContractProgramarInstalacionResponse {
  contrato_id: number
  estado_contrato_id: number
  programacion_id: number | null
}

// Todos los endpoints de transición de estado devuelven este envelope.
export interface ContractActionResponse {
  message: string
}
