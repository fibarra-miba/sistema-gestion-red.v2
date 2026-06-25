import { useQuery } from '@tanstack/react-query'
import { comprasService } from '../services/comprasService'
import { comprasKeys } from '../keys'

export function useCompra(facturaCompraId: number | null) {
  return useQuery({
    queryKey: comprasKeys.detail(facturaCompraId ?? 0),
    queryFn: () => comprasService.get(facturaCompraId as number),
    enabled: facturaCompraId != null,
    staleTime: 15_000,
  })
}
