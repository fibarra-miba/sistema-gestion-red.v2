import { useQuery } from '@tanstack/react-query'
import { stockService } from '../services/stockService'
import { stockKeys } from '../keys'
import type { ListExistenciasParams } from '../types'

export function useExistencias(params: ListExistenciasParams = {}) {
  return useQuery({
    queryKey: stockKeys.existenciasList(params),
    queryFn: () => stockService.existencias(params),
    staleTime: 30_000,
  })
}
