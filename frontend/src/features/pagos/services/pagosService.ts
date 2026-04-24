import { http } from '@/services/http'
import type {
  ContratoPagoListItemOut,
  CuentaClienteOut,
  CuentaMovimientosOut,
  GenerarLoteIn,
  GenerarLoteOut,
  GenerarPeriodoIn,
  GenerarPeriodoOut,
  ListCuentaMovimientosParams,
  ListPagosContratoParams,
  PagoDetalleOut,
  PagoMovimientoIn,
  PatchFacturaBonificacionIn,
  PatchFacturaBonificacionOut,
} from '../types'

export const pagosService = {
  // POST /contratos/{id}/pagos/generar
  async generarPeriodo(
    contratoId: number,
    payload: GenerarPeriodoIn,
  ): Promise<GenerarPeriodoOut> {
    const { data } = await http.post<GenerarPeriodoOut>(
      `/contratos/${contratoId}/pagos/generar`,
      payload,
    )
    return data
  },

  // POST /pagos/generar-lote
  async generarLote(payload: GenerarLoteIn): Promise<GenerarLoteOut> {
    const { data } = await http.post<GenerarLoteOut>(
      '/pagos/generar-lote',
      payload,
    )
    return data
  },

  // POST /pagos/{id}/movimientos
  async registrarMovimiento(
    pagoId: number,
    payload: PagoMovimientoIn,
  ): Promise<PagoDetalleOut> {
    const { data } = await http.post<PagoDetalleOut>(
      `/pagos/${pagoId}/movimientos`,
      payload,
    )
    return data
  },

  // GET /pagos/{id}
  async getDetalle(pagoId: number): Promise<PagoDetalleOut> {
    const { data } = await http.get<PagoDetalleOut>(`/pagos/${pagoId}`)
    return data
  },

  // GET /contratos/{id}/pagos
  async listByContrato(
    contratoId: number,
    params: ListPagosContratoParams = {},
  ): Promise<ContratoPagoListItemOut[]> {
    const { data } = await http.get<ContratoPagoListItemOut[]>(
      `/contratos/${contratoId}/pagos`,
      { params },
    )
    return data
  },

  // PATCH /facturas-ventas/{factura_venta_id}
  async patchFacturaBonificacion(
    facturaVentaId: number,
    payload: PatchFacturaBonificacionIn,
  ): Promise<PatchFacturaBonificacionOut> {
    const { data } = await http.patch<PatchFacturaBonificacionOut>(
      `/facturas-ventas/${facturaVentaId}`,
      payload,
    )
    return data
  },

  // GET /clientes/{id}/cuenta
  async getCuentaCliente(clienteId: number): Promise<CuentaClienteOut> {
    const { data } = await http.get<CuentaClienteOut>(
      `/clientes/${clienteId}/cuenta`,
    )
    return data
  },

  // GET /clientes/{id}/cuenta/movimientos
  async listCuentaMovimientos(
    clienteId: number,
    params: ListCuentaMovimientosParams = {},
  ): Promise<CuentaMovimientosOut> {
    const { data } = await http.get<CuentaMovimientosOut>(
      `/clientes/${clienteId}/cuenta/movimientos`,
      { params },
    )
    return data
  },
}
