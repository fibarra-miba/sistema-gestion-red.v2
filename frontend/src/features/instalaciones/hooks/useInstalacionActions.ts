import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contratosKeys } from '@/features/contratos'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { InstalacionAccionOut, InstalacionCompletarIn } from '../types'
import type { ApiError } from '@/types/api'

// Transiciones sin payload. Mutations separadas para exponer
// isPending / error independientes por acción en la UI.
// Todas las transiciones pueden mover el estado del contrato
// (completar → ACTIVO, darBaja → PENDIENTE_INSTALACION, etc.), así
// que invalidamos contratos además de instalaciones/programaciones.
export function useInstalacionActions() {
  const qc = useQueryClient()

  const invalidate = (instalacionId: number) => {
    qc.invalidateQueries({ queryKey: instalacionesKeys.lists() })
    qc.invalidateQueries({ queryKey: instalacionesKeys.detail(instalacionId) })
    qc.invalidateQueries({ queryKey: instalacionesKeys.programacionesAll() })
    qc.invalidateQueries({ queryKey: contratosKeys.all })
  }

  // completar ahora acepta fecha_instalacion opcional (CompletarInstalacionDialog).
  const completar = useMutation<
    InstalacionAccionOut,
    ApiError,
    { instalacionId: number; payload?: InstalacionCompletarIn }
  >({
    mutationFn: ({ instalacionId, payload }) =>
      instalacionesService.completar(instalacionId, payload),
    onSuccess: (_d, { instalacionId }) => invalidate(instalacionId),
  })

  const cancelar = useMutation<InstalacionAccionOut, ApiError, number>({
    mutationFn: (id) => instalacionesService.cancelar(id),
    onSuccess: (_d, id) => invalidate(id),
  })

  const fallar = useMutation<InstalacionAccionOut, ApiError, number>({
    mutationFn: (id) => instalacionesService.fallar(id),
    onSuccess: (_d, id) => invalidate(id),
  })

  const darBaja = useMutation<InstalacionAccionOut, ApiError, number>({
    mutationFn: (id) => instalacionesService.darBaja(id),
    onSuccess: (_d, id) => invalidate(id),
  })

  return { completar, cancelar, fallar, darBaja }
}
