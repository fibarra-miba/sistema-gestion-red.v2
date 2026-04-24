import { useQuery } from '@tanstack/react-query'
import { pagosService } from '../services/pagosService'
import { pagosKeys } from '../keys'
import type { ListPagosContratoParams } from '../types'

export function usePagosContrato(
  contratoId: number | undefined,
  params: ListPagosContratoParams = {},
) {
  return useQuery({
    queryKey:
      contratoId != null
        ? pagosKeys.byContrato(contratoId, params)
        : [...pagosKeys.all, 'by-contrato', 'disabled'],
    queryFn: () => pagosService.listByContrato(contratoId as number, params),
    enabled: contratoId != null,
  })
}
