import { useQuery } from '@tanstack/react-query'
import { catalogosService } from '../services/catalogosService'
import { catalogosKeys } from '../keys'

const STALE = 10 * 60 * 1000
const GC = 60 * 60 * 1000

export function useTiposProducto() {
  return useQuery({
    queryKey: catalogosKeys.tiposProducto(),
    queryFn: () => catalogosService.tiposProducto(),
    staleTime: STALE,
    gcTime: GC,
  })
}
