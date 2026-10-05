import { useMutation, useQueryClient } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { CobroGarantiaCreate, CobroGarantiaOut } from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  garantiaId: number
  instalacionId: number
  payload: CobroGarantiaCreate
}

// Registra un cobro del depósito. Refresca cobros, garantías de la
// instalación, listado global y resumen (cobrado / pendiente).
export function useRegistrarCobroGarantia() {
  const qc = useQueryClient()

  return useMutation<CobroGarantiaOut, ApiError, Vars>({
    mutationFn: ({ garantiaId, payload }) =>
      instalacionesService.registrarCobroGarantia(garantiaId, payload),
    onSuccess: (_cobro, { garantiaId, instalacionId }) => {
      qc.invalidateQueries({ queryKey: instalacionesKeys.cobros(garantiaId) })
      qc.invalidateQueries({ queryKey: instalacionesKeys.garantias(instalacionId) })
      qc.invalidateQueries({ queryKey: instalacionesKeys.garantiasLists() })
      qc.invalidateQueries({ queryKey: instalacionesKeys.garantiasResumen() })
      qc.invalidateQueries({ queryKey: instalacionesKeys.garantiaDetail(garantiaId) })
    },
  })
}
