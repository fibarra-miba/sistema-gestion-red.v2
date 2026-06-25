import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { dashboardKeys } from '../keys'

export function useResumenContratos(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.contratos(),
    queryFn: dashboardService.contratos,
    staleTime: 60_000,
    enabled,
  })
}
