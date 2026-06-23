import { useQuery } from '@tanstack/react-query'
import { productosService } from '../services/productosService'
import { productosKeys } from '../keys'
import type { ListProductosParams } from '../types'

export function useProductos(params: ListProductosParams = {}) {
  return useQuery({
    queryKey: productosKeys.list(params),
    queryFn: () => productosService.list(params),
    staleTime: 60_000,
  })
}
