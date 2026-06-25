import { http } from '@/services/http'
import type {
  AjusteStockCreate,
  DevolucionStockCreate,
  ExistenciaListResponse,
  ExistenciaOut,
  ListExistenciasParams,
  MovimientoStockListResponse,
  MovimientoStockOut,
  SaldoStockOut,
} from '../types'

export const stockService = {
  async existencias(params: ListExistenciasParams = {}): Promise<ExistenciaOut[]> {
    const { data } = await http.get<ExistenciaListResponse>('/stock', { params })
    return data.items
  },

  async saldo(productoId: number): Promise<SaldoStockOut> {
    const { data } = await http.get<SaldoStockOut>(`/stock/${productoId}`)
    return data
  },

  async kardex(productoId: number): Promise<MovimientoStockOut[]> {
    const { data } = await http.get<MovimientoStockListResponse>(
      `/stock/${productoId}/movimientos`,
    )
    return data.items
  },

  async ajuste(payload: AjusteStockCreate): Promise<MovimientoStockOut> {
    const { data } = await http.post<MovimientoStockOut>('/stock/ajustes', payload)
    return data
  },

  async devolucion(payload: DevolucionStockCreate): Promise<MovimientoStockOut> {
    const { data } = await http.post<MovimientoStockOut>('/stock/devoluciones', payload)
    return data
  },
}
