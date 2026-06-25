import type { ListAuditoriaParams } from './types'

export const auditoriaKeys = {
  all: ['auditoria'] as const,

  lists: () => [...auditoriaKeys.all, 'list'] as const,
  list: (params: ListAuditoriaParams) => [...auditoriaKeys.lists(), params] as const,

  tipos: () => [...auditoriaKeys.all, 'tipos'] as const,
}
