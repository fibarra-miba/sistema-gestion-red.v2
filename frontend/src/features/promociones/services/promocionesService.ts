import { http } from '@/services/http'
import type {
  ListPromocionesParams,
  PromocionCreate,
  PromocionListResponse,
  PromocionOut,
  PromocionUpdate,
} from '../types'

export const promocionesService = {
  async list(params: ListPromocionesParams = {}): Promise<PromocionOut[]> {
    const { data } = await http.get<PromocionListResponse>('/promociones', { params })
    return data.items
  },

  async get(promocionId: number): Promise<PromocionOut> {
    const { data } = await http.get<PromocionOut>(`/promociones/${promocionId}`)
    return data
  },

  async create(payload: PromocionCreate): Promise<PromocionOut> {
    const { data } = await http.post<PromocionOut>('/promociones', payload)
    return data
  },

  async update(promocionId: number, payload: PromocionUpdate): Promise<PromocionOut> {
    const { data } = await http.patch<PromocionOut>(`/promociones/${promocionId}`, payload)
    return data
  },
}
