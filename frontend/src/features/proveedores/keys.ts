import type { ListProveedoresParams } from './types'

export const proveedoresKeys = {
  all: ['proveedores'] as const,

  lists: () => [...proveedoresKeys.all, 'list'] as const,
  list: (params: ListProveedoresParams) => [...proveedoresKeys.lists(), params] as const,

  details: () => [...proveedoresKeys.all, 'detail'] as const,
  detail: (proveedorId: number) => [...proveedoresKeys.details(), proveedorId] as const,
}
