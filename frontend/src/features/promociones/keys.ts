import type { ListPromocionesParams } from './types'

export const promocionesKeys = {
  all: ['promociones'] as const,

  lists: () => [...promocionesKeys.all, 'list'] as const,
  list: (params: ListPromocionesParams) => [...promocionesKeys.lists(), params] as const,

  details: () => [...promocionesKeys.all, 'detail'] as const,
  detail: (promocionId: number) => [...promocionesKeys.details(), promocionId] as const,
}
