import { useQuery } from '@tanstack/react-query'
import { preciosService } from '../services/preciosService'
import { planesKeys } from '../keys'

export function usePlanPrices(planId: number | undefined) {
  return useQuery({
    queryKey:
      planId != null ? planesKeys.precios(planId) : [...planesKeys.all, 'precios'],
    queryFn: () => preciosService.list(planId as number),
    enabled: planId != null,
  })
}
