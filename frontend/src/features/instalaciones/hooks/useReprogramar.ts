import { useMutation, useQueryClient } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type {
  ReprogramacionInstalacionOut,
  ReprogramarInstalacionIn,
} from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  programacionId: number
  payload: ReprogramarInstalacionIn
}

export function useReprogramar() {
  const qc = useQueryClient()

  return useMutation<ReprogramacionInstalacionOut, ApiError, Vars>({
    mutationFn: ({ programacionId, payload }) =>
      instalacionesService.reprogramar(programacionId, payload),
    onSuccess: (_d, { programacionId }) => {
      qc.invalidateQueries({ queryKey: instalacionesKeys.programacionesAll() })
      qc.invalidateQueries({
        queryKey: instalacionesKeys.reprogramaciones(programacionId),
      })
    },
  })
}
