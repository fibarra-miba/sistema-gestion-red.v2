import type { ListContratosParams } from './types'

export const contratosKeys = {
  all: ['contratos'] as const,

  lists: () => [...contratosKeys.all, 'list'] as const,
  list: (params: ListContratosParams) =>
    [...contratosKeys.lists(), params] as const,

  details: () => [...contratosKeys.all, 'detail'] as const,
  detail: (contratoId: number) =>
    [...contratosKeys.details(), contratoId] as const,
}
