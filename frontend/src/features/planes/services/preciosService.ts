import { http } from '@/services/http'
import type {
  PrecioPlanCreate,
  PrecioPlanListResponse,
  PrecioPlanOut,
  PrecioPlanUpdate,
} from '../types'

export const preciosService = {
  async list(planId: number): Promise<PrecioPlanOut[]> {
    const { data } = await http.get<PrecioPlanListResponse>(
      `/planes/${planId}/precios`,
    )
    return data.items
  },

  async create(
    planId: number,
    payload: PrecioPlanCreate,
  ): Promise<PrecioPlanOut> {
    const { data } = await http.post<PrecioPlanOut>(
      `/planes/${planId}/precios`,
      payload,
    )
    return data
  },

  // PATCH parcial. El backend sólo acepta editar precios con fecha_desde
  // en el futuro; si no, devuelve 400 y lo mostramos como error en la UI.
  async update(
    planId: number,
    precioId: number,
    payload: PrecioPlanUpdate,
  ): Promise<PrecioPlanOut> {
    const { data } = await http.patch<PrecioPlanOut>(
      `/planes/${planId}/precios/${precioId}`,
      payload,
    )
    return data
  },
}
