import { useQuery } from '@tanstack/react-query'
import { auditoriaService } from '../services/auditoriaService'
import { auditoriaKeys } from '../keys'
import type { ListAuditoriaParams } from '../types'

export function useAuditoria(params: ListAuditoriaParams = {}) {
  return useQuery({
    queryKey: auditoriaKeys.list(params),
    queryFn: () => auditoriaService.list(params),
    staleTime: 15_000,
  })
}
