import { useQuery } from '@tanstack/react-query'
import { planesService } from '../services/planesService'
import { planesKeys } from '../keys'

export function usePlan(planId: number | undefined) {
  return useQuery({
    queryKey: planId != null ? planesKeys.detail(planId) : planesKeys.details(),
    queryFn: () => planesService.get(planId as number),
    enabled: planId != null,
  })
}
