import { useMutation, useQueryClient } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { InstalacionOut, InstalacionUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  instalacionId: number
  payload: InstalacionUpdate
}

export function useUpdateInstalacion() {
  const qc = useQueryClient()

  return useMutation<InstalacionOut, ApiError, Vars>({
    mutationFn: ({ instalacionId, payload }) =>
      instalacionesService.update(instalacionId, payload),
    onSuccess: (_d, { instalacionId }) => {
      qc.invalidateQueries({
        queryKey: instalacionesKeys.detail(instalacionId),
      })
      qc.invalidateQueries({ queryKey: instalacionesKeys.lists() })
    },
  })
}
