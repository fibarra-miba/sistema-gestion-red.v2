import { http } from '@/services/http'
import type {
  ListProductosParams,
  ProductoCreate,
  ProductoListResponse,
  ProductoOut,
  ProductoUpdate,
  PresentacionOut,
  PresentacionListResponse,
  PresentacionCreate,
} from '../types'

export const productosService = {
  async list(params: ListProductosParams = {}): Promise<ProductoOut[]> {
    const { data } = await http.get<ProductoListResponse>('/productos', { params })
    return data.items
  },

  async get(productoId: number): Promise<ProductoOut> {
    const { data } = await http.get<ProductoOut>(`/productos/${productoId}`)
    return data
  },

  async create(payload: ProductoCreate): Promise<ProductoOut> {
    const { data } = await http.post<ProductoOut>('/productos', payload)
    return data
  },

  async update(productoId: number, payload: ProductoUpdate): Promise<ProductoOut> {
    const { data } = await http.patch<ProductoOut>(`/productos/${productoId}`, payload)
    return data
  },

  async listPresentaciones(productoId: number): Promise<PresentacionOut[]> {
    const { data } = await http.get<PresentacionListResponse>(
      `/productos/${productoId}/presentaciones`,
    )
    return data.items
  },

  async createPresentacion(
    productoId: number,
    payload: PresentacionCreate,
  ): Promise<PresentacionOut> {
    const { data } = await http.post<PresentacionOut>(
      `/productos/${productoId}/presentaciones`,
      payload,
    )
    return data
  },
}
