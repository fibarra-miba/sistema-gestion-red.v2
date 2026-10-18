import { http } from '@/services/http'
import type {
  ResetPasswordOut,
  RolOut,
  UsuarioCreate,
  UsuarioOut,
  UsuarioUpdate,
} from '../types'

export const usuariosService = {
  async list(): Promise<UsuarioOut[]> {
    const { data } = await http.get<UsuarioOut[]>('/usuarios')
    return data
  },

  async get(usuarioId: number): Promise<UsuarioOut> {
    const { data } = await http.get<UsuarioOut>(`/usuarios/${usuarioId}`)
    return data
  },

  async listRoles(): Promise<RolOut[]> {
    const { data } = await http.get<RolOut[]>('/usuarios/roles')
    return data
  },

  async create(payload: UsuarioCreate): Promise<UsuarioOut> {
    const { data } = await http.post<UsuarioOut>('/usuarios', payload)
    return data
  },

  async update(usuarioId: number, payload: UsuarioUpdate): Promise<UsuarioOut> {
    const { data } = await http.patch<UsuarioOut>(`/usuarios/${usuarioId}`, payload)
    return data
  },

  async resetPassword(usuarioId: number): Promise<ResetPasswordOut> {
    const { data } = await http.post<ResetPasswordOut>(
      `/usuarios/${usuarioId}/reset-password`,
    )
    return data
  },
}
