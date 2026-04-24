// Espejo exacto del JSON del backend.
// Fuente: backend/app/schemas/usuario.py

export interface RolOut {
  rol_id: number
  codigo_rol: string
  nombre_rol: string
  descripcion_rol: string | null
}

export interface UsuarioOut {
  usuario_id: number
  rol_id: number
  codigo_rol: string
  nombre_rol: string
  username_usuario: string
  email_usuario: string
  nombre_usuario: string
  apellido_usuario: string
  activo_usuario: boolean
  requiere_cambio_password_usuario: boolean
  ultimo_login_usuario: string | null
  created_at: string
  updated_at: string
}

export interface UsuarioCreate {
  codigo_rol: string
  username_usuario: string
  email_usuario: string
  password: string
  nombre_usuario: string
  apellido_usuario: string
  activo_usuario?: boolean
  requiere_cambio_password_usuario?: boolean
}

export interface UsuarioUpdate {
  codigo_rol?: string
  username_usuario?: string
  email_usuario?: string
  nombre_usuario?: string
  apellido_usuario?: string
  activo_usuario?: boolean
  requiere_cambio_password_usuario?: boolean
}
