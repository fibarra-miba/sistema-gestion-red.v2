import type {
  ListCuentaMovimientosParams,
  ListPagosContratoParams,
} from './types'

export const pagosKeys = {
  all: ['pagos'] as const,

  // GET /pagos/{id}
  details: () => [...pagosKeys.all, 'detail'] as const,
  detail: (pagoId: number) => [...pagosKeys.details(), pagoId] as const,

  // GET /contratos/{id}/pagos
  byContrato: (contratoId: number, params: ListPagosContratoParams = {}) =>
    [...pagosKeys.all, 'by-contrato', contratoId, params] as const,
  byContratoAll: (contratoId: number) =>
    [...pagosKeys.all, 'by-contrato', contratoId] as const,
}

export const cuentaKeys = {
  all: ['cuenta'] as const,

  // GET /clientes/{id}/cuenta
  resumen: (clienteId: number) =>
    [...cuentaKeys.all, 'resumen', clienteId] as const,

  // GET /clientes/{id}/cuenta/movimientos
  movimientos: (clienteId: number, params: ListCuentaMovimientosParams = {}) =>
    [...cuentaKeys.all, 'movimientos', clienteId, params] as const,
  movimientosAll: (clienteId: number) =>
    [...cuentaKeys.all, 'movimientos', clienteId] as const,
}
