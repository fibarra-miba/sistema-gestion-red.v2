import { useQuery } from '@tanstack/react-query'
import { usuariosService } from '../services/usuariosService'
import { usuariosKeys } from '../keys'

// Los roles cambian muy poco — cacheamos agresivo.
export function useRoles() {
  return useQuery({
    queryKey: usuariosKeys.roles(),
    queryFn: usuariosService.listRoles,
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
  })
}
