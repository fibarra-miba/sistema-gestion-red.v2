import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import { dashboardKeys } from '../keys'

export function useResumenClientes(enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.clientes(),
    queryFn: dashboardService.clientes,
    staleTime: 60_000,
    enabled,
  })
}
