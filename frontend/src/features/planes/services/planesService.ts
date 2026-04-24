import { http } from '@/services/http'
import type {
  PlanCreate,
  PlanListResponse,
  PlanOut,
  PlanUpdate,
} from '../types'

// DELETE en el backend es baja lógica (desactivación).
// Devuelve { message: string }, no el plan actualizado.
interface DeactivateResponse {
  message: string
}

export const planesService = {
  async list(): Promise<PlanOut[]> {
    const { data } = await http.get<PlanListResponse>('/planes')
    return data.items
  },

  async get(planId: number): Promise<PlanOut> {
    const { data } = await http.get<PlanOut>(`/planes/${planId}`)
    return data
  },

  async create(payload: PlanCreate): Promise<PlanOut> {
    const { data } = await http.post<PlanOut>('/planes', payload)
    return data
  },

  async update(planId: number, payload: PlanUpdate): Promise<PlanOut> {
    const { data } = await http.patch<PlanOut>(`/planes/${planId}`, payload)
    return data
  },

  async deactivate(planId: number): Promise<DeactivateResponse> {
    const { data } = await http.delete<DeactivateResponse>(`/planes/${planId}`)
    return data
  },
}
