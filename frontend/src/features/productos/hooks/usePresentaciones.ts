import { useQuery } from '@tanstack/react-query'
import { productosService } from '../services/productosService'
import { productosKeys } from '../keys'

export function usePresentaciones(productoId: number | null) {
  return useQuery({
    queryKey: productosKeys.presentaciones(productoId ?? 0),
    queryFn: () => productosService.listPresentaciones(productoId as number),
    enabled: productoId != null,
    staleTime: 60_000,
  })
}
