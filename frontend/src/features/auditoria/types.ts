// Espejo exacto del JSON del backend.
// Fuente: backend/app/schemas/auditoria.py

export interface AuditEventOut {
  auditoria_id: number
  usuario_id: number | null
  username_usuario: string | null
  nombre_usuario: string | null
  apellido_usuario: string | null
  modulo_auditoria: string
  accion_auditoria: string
  entidad_auditoria: string | null
  entidad_id_auditoria: string | null
  detalle_auditoria: string | null
  ip_origen_auditoria: string | null
  user_agent_auditoria: string | null
  created_at: string
}

export interface AuditEventListResponse {
  items: AuditEventOut[]
  total: number
}

export interface AuditTiposOut {
  modulos: string[]
  acciones: string[]
}

export interface ListAuditoriaParams {
  usuario_id?: number
  modulo?: string
  accion?: string
  entidad?: string
  entidad_id?: string
  desde?: string
  hasta?: string
  limit?: number
  offset?: number
}
