import { useQuery } from '@tanstack/react-query'
import { pagosService } from '../services/pagosService'
import { pagosKeys } from '../keys'

export function usePagoDetalle(pagoId: number | undefined) {
  return useQuery({
    queryKey:
      pagoId != null
        ? pagosKeys.detail(pagoId)
        : [...pagosKeys.details(), 'disabled'],
    queryFn: () => pagosService.getDetalle(pagoId as number),
    enabled: pagoId != null,
  })
}
