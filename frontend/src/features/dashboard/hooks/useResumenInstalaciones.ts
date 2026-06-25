import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { dashboardKeys } from '../keys'

export function useResumenInstalaciones(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.instalaciones(),
    queryFn: dashboardService.instalaciones,
    staleTime: 60_000,
    enabled,
  })
}
