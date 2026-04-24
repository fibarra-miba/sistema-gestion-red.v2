import { useQuery } from '@tanstack/react-query'
import { usuariosService } from '../services/usuariosService'
import { usuariosKeys } from '../keys'

export function useUsuarios() {
  return useQuery({
    queryKey: usuariosKeys.list(),
    queryFn: usuariosService.list,
  })
}
