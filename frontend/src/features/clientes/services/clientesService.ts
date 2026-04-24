import { http } from '@/services/http'
import type {
  ClienteCreate,
  ClienteOut,
  ClienteUpdate,
  ListClientesParams,
} from '../types'

export const clientesService = {
  async list(params: ListClientesParams = {}): Promise<ClienteOut[]> {
    const { data } = await http.get<ClienteOut[]>('/clientes', { params })
    return data
  },

  async get(clienteId: number): Promise<ClienteOut> {
    const { data } = await http.get<ClienteOut>(`/clientes/${clienteId}`)
    return data
  },

  async create(payload: ClienteCreate): Promise<ClienteOut> {
    const { data } = await http.post<ClienteOut>('/clientes', payload)
    return data
  },

  async update(clienteId: number, payload: ClienteUpdate): Promise<ClienteOut> {
    const { data } = await http.put<ClienteOut>(`/clientes/${clienteId}`, payload)
    return data
  },
}
