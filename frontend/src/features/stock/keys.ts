import type { ListExistenciasParams } from './types'

export const stockKeys = {
  all: ['stock'] as const,

  existencias: () => [...stockKeys.all, 'existencias'] as const,
  existenciasList: (params: ListExistenciasParams) =>
    [...stockKeys.existencias(), params] as const,

  saldo: (productoId: number) => [...stockKeys.all, 'saldo', productoId] as const,
  kardex: (productoId: number) => [...stockKeys.all, 'kardex', productoId] as const,
}
