import { useQuery } from '@tanstack/react-query'
import { stockService } from '../services/stockService'
import { stockKeys } from '../keys'

export function useKardex(productoId: number | null) {
  return useQuery({
    queryKey: stockKeys.kardex(productoId ?? 0),
    queryFn: () => stockService.kardex(productoId as number),
    enabled: productoId != null,
    staleTime: 15_000,
  })
}
