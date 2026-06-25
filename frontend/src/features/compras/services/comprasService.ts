import { http } from '@/services/http'
import type {
  CompraCreate,
  CompraListItem,
  CompraListResponse,
  CompraOut,
  ListComprasParams,
} from '../types'

export const comprasService = {
  async list(params: ListComprasParams = {}): Promise<CompraListItem[]> {
    const { data } = await http.get<CompraListResponse>('/compras', { params })
    return data.items
  },

  async get(facturaCompraId: number): Promise<CompraOut> {
    const { data } = await http.get<CompraOut>(`/compras/${facturaCompraId}`)
    return data
  },

  async create(payload: CompraCreate): Promise<CompraOut> {
    const { data } = await http.post<CompraOut>('/compras', payload)
    return data
  },

  async anular(facturaCompraId: number): Promise<CompraOut> {
    const { data } = await http.post<CompraOut>(`/compras/${facturaCompraId}/anular`)
    return data
  },
}
