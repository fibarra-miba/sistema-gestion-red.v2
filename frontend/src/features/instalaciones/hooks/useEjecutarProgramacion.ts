import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contratosKeys } from '@/features/contratos'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { EjecutarProgramacionIn, InstalacionOut } from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  programacionId: number
  payload: EjecutarProgramacionIn
}

// Ejecutar una programación crea una instalación PENDIENTE y pasa la
// programación a COMPLETADA. No cambia el estado del contrato por sí
// sola — eso ocurre al completar la instalación. Aún así invalidamos
// contratos por si el backend ajusta estados derivados.
export function useEjecutarProgramacion() {
  const qc = useQueryClient()

  return useMutation<InstalacionOut, ApiError, Vars>({
    mutationFn: ({ programacionId, payload }) =>
      instalacionesService.ejecutarProgramacion(programacionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instalacionesKeys.lists() })
      qc.invalidateQueries({ queryKey: instalacionesKeys.programacionesAll() })
      qc.invalidateQueries({ queryKey: contratosKeys.all })
    },
  })
}
