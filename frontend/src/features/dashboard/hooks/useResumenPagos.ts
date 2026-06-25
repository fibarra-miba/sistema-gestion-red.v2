import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { dashboardKeys } from '../keys'

export function useResumenPagos(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.pagos(),
    queryFn: dashboardService.pagos,
    staleTime: 60_000,
    enabled,
  })
}
