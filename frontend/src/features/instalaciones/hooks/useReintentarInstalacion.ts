import { useMutation, useQueryClient } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type {
  ProgramacionInstalacionOut,
  ReintentarInstalacionIn,
} from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  instalacionId: number
  payload: ReintentarInstalacionIn
}

// Reintentar NO muta la instalación: crea una programación nueva.
// La instalación original queda en su estado terminal.
export function useReintentarInstalacion() {
  const qc = useQueryClient()

  return useMutation<ProgramacionInstalacionOut, ApiError, Vars>({
    mutationFn: ({ instalacionId, payload }) =>
      instalacionesService.reintentar(instalacionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instalacionesKeys.programacionesAll() })
      // La instalación original no cambia pero la lista sí (para reflejar
      // que tiene una programación nueva asociada si se muestra).
      qc.invalidateQueries({ queryKey: instalacionesKeys.lists() })
    },
  })
}
