import { useMutation, useQueryClient } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type {
  DetalleInstalacionCreate,
  DetalleInstalacionOut,
} from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  instalacionId: number
  payload: DetalleInstalacionCreate
}

export function useCreateDetalleInstalacion() {
  const qc = useQueryClient()

  return useMutation<DetalleInstalacionOut, ApiError, Vars>({
    mutationFn: ({ instalacionId, payload }) =>
      instalacionesService.createDetalle(instalacionId, payload),
    onSuccess: (_d, { instalacionId }) => {
      qc.invalidateQueries({
        queryKey: instalacionesKeys.detalles(instalacionId),
      })
    },
  })
}
