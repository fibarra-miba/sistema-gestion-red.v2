import type { ListProductosParams } from './types'

export const productosKeys = {
  all: ['productos'] as const,

  lists: () => [...productosKeys.all, 'list'] as const,
  list: (params: ListProductosParams) => [...productosKeys.lists(), params] as const,

  details: () => [...productosKeys.all, 'detail'] as const,
  detail: (productoId: number) => [...productosKeys.details(), productoId] as const,
}
