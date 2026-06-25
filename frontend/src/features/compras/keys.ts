import type { ListComprasParams } from './types'

export const comprasKeys = {
  all: ['compras'] as const,

  lists: () => [...comprasKeys.all, 'list'] as const,
  list: (params: ListComprasParams) => [...comprasKeys.lists(), params] as const,

  details: () => [...comprasKeys.all, 'detail'] as const,
  detail: (facturaCompraId: number) => [...comprasKeys.details(), facturaCompraId] as const,
}
