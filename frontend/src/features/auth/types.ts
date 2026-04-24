// Espejo exacto del JSON que expone el backend.
// Fuente: backend/app/schemas/auth.py

export type CodigoRol = 'ADMIN' | 'OPERADOR' | 'TECNICO' | 'COBRANZAS'

export interface RoleInfo {
  rol_id: number
  codigo_rol: CodigoRol | string
  nombre_rol: string
}

export interface Capabilities {
  can_manage_users: boolean
  can_manage_planes: boolean
  can_manage_clientes: boolean
  can_manage_domicilios: boolean
  can_manage_contratos: boolean
  can_manage_instalaciones: boolean
  can_manage_pagos: boolean
}

export type CapabilityKey = keyof Capabilities

export interface AuthMe {
  usuario_id: number
  username_usuario: string
  email_usuario: string
  nombre_usuario: string
  apellido_usuario: string
  activo_usuario: boolean
  requiere_cambio_password_usuario: boolean
  ultimo_login_usuario: string | null
  rol: RoleInfo
  capabilities: Capabilities
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  revoke_all_sessions?: boolean
}

export interface MessageResponse {
  message: string
}
