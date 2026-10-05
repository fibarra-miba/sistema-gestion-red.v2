import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'

// Recibo guardado (snapshot inmutable) → cache sin vencimiento.
export function useReciboGarantia(reciboId: number | undefined) {
  return useQuery({
    queryKey: instalacionesKeys.recibo(reciboId ?? 0),
    queryFn: () => instalacionesService.getReciboGarantia(reciboId as number),
    enabled: typeof reciboId === 'number' && reciboId > 0,
    staleTime: Infinity,
  })
}
