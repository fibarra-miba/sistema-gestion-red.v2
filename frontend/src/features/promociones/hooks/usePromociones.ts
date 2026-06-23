import { useQuery } from '@tanstack/react-query'
import { promocionesService } from '../services/promocionesService'
import { promocionesKeys } from '../keys'
import type { ListPromocionesParams } from '../types'

export function usePromociones(params: ListPromocionesParams = {}) {
  return useQuery({
    queryKey: promocionesKeys.list(params),
    queryFn: () => promocionesService.list(params),
    staleTime: 60_000,
  })
}
