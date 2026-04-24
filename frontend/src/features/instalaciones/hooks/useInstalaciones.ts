import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { ListInstalacionesParams } from '../types'

export function useInstalaciones(params: ListInstalacionesParams = {}) {
  return useQuery({
    queryKey: instalacionesKeys.list(params),
    queryFn: () => instalacionesService.list(params),
  })
}
