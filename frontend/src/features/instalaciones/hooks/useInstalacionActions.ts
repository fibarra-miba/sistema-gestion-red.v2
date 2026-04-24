import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contratosKeys } from '@/features/contratos'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { InstalacionAccionOut } from '../types'
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

  const completar = useMutation<InstalacionAccionOut, ApiError, number>({
    mutationFn: (id) => instalacionesService.completar(id),
    onSuccess: (_d, id) => invalidate(id),
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
