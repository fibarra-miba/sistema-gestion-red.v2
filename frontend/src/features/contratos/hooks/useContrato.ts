import { useQuery } from '@tanstack/react-query'
import { contratosService } from '../services/contratosService'
import { contratosKeys } from '../keys'

export function useContrato(contratoId: number | undefined) {
  return useQuery({
    queryKey:
      contratoId != null
        ? contratosKeys.detail(contratoId)
        : ['contratos', 'detail', 'disabled'],
    queryFn: () => contratosService.get(contratoId as number),
    enabled: typeof contratoId === 'number' && contratoId > 0,
  })
}
