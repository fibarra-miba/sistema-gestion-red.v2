import { http } from '@/services/http'
import type {
  ListProveedoresParams,
  ProveedorCreate,
  ProveedorListResponse,
  ProveedorOut,
  ProveedorUpdate,
} from '../types'

export const proveedoresService = {
  async list(params: ListProveedoresParams = {}): Promise<ProveedorOut[]> {
    const { data } = await http.get<ProveedorListResponse>('/proveedores', { params })
    return data.items
  },

  async get(proveedorId: number): Promise<ProveedorOut> {
    const { data } = await http.get<ProveedorOut>(`/proveedores/${proveedorId}`)
    return data
  },

  async create(payload: ProveedorCreate): Promise<ProveedorOut> {
    const { data } = await http.post<ProveedorOut>('/proveedores', payload)
    return data
  },

  async update(proveedorId: number, payload: ProveedorUpdate): Promise<ProveedorOut> {
    const { data } = await http.patch<ProveedorOut>(`/proveedores/${proveedorId}`, payload)
    return data
  },
}
