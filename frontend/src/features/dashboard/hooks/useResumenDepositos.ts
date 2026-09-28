import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { dashboardKeys } from '../keys'

export function useResumenDepositos(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.depositos(),
    queryFn: dashboardService.depositos,
    staleTime: 60_000,
    enabled,
  })
}
