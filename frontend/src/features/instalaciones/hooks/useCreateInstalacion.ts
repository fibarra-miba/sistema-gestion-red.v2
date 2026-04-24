import { useMutation, useQueryClient } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { InstalacionCreate, InstalacionOut } from '../types'
import type { ApiError } from '@/types/api'

export function useCreateInstalacion() {
  const qc = useQueryClient()

  return useMutation<InstalacionOut, ApiError, InstalacionCreate>({
    mutationFn: (payload) => instalacionesService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instalacionesKeys.lists() })
      // La programación pasa a COMPLETADA cuando se crea la instalación.
      qc.invalidateQueries({ queryKey: instalacionesKeys.programacionesAll() })
    },
  })
}
