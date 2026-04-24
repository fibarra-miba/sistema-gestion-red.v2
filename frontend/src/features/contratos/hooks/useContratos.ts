import { useQuery } from '@tanstack/react-query'
import { contratosService } from '../services/contratosService'
import { contratosKeys } from '../keys'
import type { ListContratosParams } from '../types'

export function useContratos(params: ListContratosParams = {}) {
  return useQuery({
    queryKey: contratosKeys.list(params),
    queryFn: () => contratosService.list(params),
  })
}
