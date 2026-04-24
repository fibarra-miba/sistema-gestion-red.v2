import type { ListClientesParams } from './types'

// Query keys centralizadas. Cualquier hook o invalidación usa estas factories.
// Evita typos y permite invalidar prefijos con confianza.
export const clientesKeys = {
  all: ['clientes'] as const,

  lists: () => [...clientesKeys.all, 'list'] as const,
  list: (params: ListClientesParams) => [...clientesKeys.lists(), params] as const,

  details: () => [...clientesKeys.all, 'detail'] as const,
  detail: (clienteId: number) => [...clientesKeys.details(), clienteId] as const,

  domicilios: (clienteId: number) =>
    [...clientesKeys.all, clienteId, 'domicilios'] as const,
  domicilioVigente: (clienteId: number) =>
    [...clientesKeys.all, clienteId, 'domicilio-vigente'] as const,
}
