import { http } from '@/services/http'
import type {
  AuthMe,
  ChangePasswordRequest,
  LoginRequest,
  MessageResponse,
} from '../types'

export const authService = {
  async login(payload: LoginRequest): Promise<AuthMe> {
    const { data } = await http.post<AuthMe>('/auth/login', payload)
    return data
  },

  async me(): Promise<AuthMe> {
    const { data } = await http.get<AuthMe>('/auth/me')
    return data
  },

  async logout(): Promise<MessageResponse> {
    const { data } = await http.post<MessageResponse>('/auth/logout')
    return data
  },

  async logoutAll(): Promise<MessageResponse> {
    const { data } = await http.post<MessageResponse>('/auth/logout-all')
    return data
  },

  async changePassword(payload: ChangePasswordRequest): Promise<MessageResponse> {
    const { data } = await http.post<MessageResponse>('/auth/change-password', payload)
    return data
  },
}
