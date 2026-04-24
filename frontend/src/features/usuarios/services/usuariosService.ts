import { http } from '@/services/http'
import type {
  RolOut,
  UsuarioCreate,
  UsuarioOut,
  UsuarioUpdate,
} from '../types'
import type { MessageResponse } from '@/features/auth'

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

  async resetPassword(usuarioId: number): Promise<MessageResponse> {
    const { data } = await http.post<MessageResponse>(
      `/usuarios/${usuarioId}/reset-password`,
    )
    return data
  },
}
