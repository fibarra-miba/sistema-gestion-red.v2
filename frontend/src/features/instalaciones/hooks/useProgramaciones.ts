import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { ListProgramacionesParams } from '../types'

export function useProgramaciones(params: ListProgramacionesParams = {}) {
  return useQuery({
    queryKey: instalacionesKeys.programacionesList(params),
    queryFn: () => instalacionesService.listProgramaciones(params),
  })
}
