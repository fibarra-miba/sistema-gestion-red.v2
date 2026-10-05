import { http } from '@/services/http'
import { isApiError } from '@/types/api'
import type { DomicilioCreate, DomicilioOut, DomicilioUpdate } from '../types'

export const domiciliosService = {
  async listHistorial(clienteId: number): Promise<DomicilioOut[]> {
    const { data } = await http.get<DomicilioOut[]>(
      `/clientes/${clienteId}/domicilios`,
    )
    return data
  },

  // El backend devuelve 404 "DOMICILIO_VIGENTE_NOT_FOUND" cuando el cliente
  // no tiene vigente — es un estado válido, no un error. Devolvemos null.
  async getVigente(clienteId: number): Promise<DomicilioOut | null> {
    try {
      const { data } = await http.get<DomicilioOut>(
        `/clientes/${clienteId}/domicilio-vigente`,
      )
      return data
    } catch (err) {
      if (isApiError(err) && err.status === 404) return null
      throw err
    }
  },

  async create(clienteId: number, payload: DomicilioCreate): Promise<DomicilioOut> {
    const { data } = await http.post<DomicilioOut>(
      `/clientes/${clienteId}/domicilios`,
      payload,
    )
    return data
  },

  // Corrección de datos de carga (no mudanza) — PATCH parcial.
  async update(
    clienteId: number,
    domicilioId: number,
    payload: DomicilioUpdate,
  ): Promise<DomicilioOut> {
    const { data } = await http.patch<DomicilioOut>(
      `/clientes/${clienteId}/domicilios/${domicilioId}`,
      payload,
    )
    return data
  },
}
