import { useMutation, useQueryClient } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { GarantiaOut, GarantiaUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface AnularArgs {
  garantiaId: number
  payload: GarantiaUpdate
}

// Anular = PATCH a estado ANULADA + resolución. El backend valida la transición
// y completa fecha_fin si no se envía.
export function useAnularGarantia() {
  const qc = useQueryClient()

  return useMutation<GarantiaOut, ApiError, AnularArgs>({
    mutationFn: ({ garantiaId, payload }) =>
      instalacionesService.updateGarantia(garantiaId, payload),
    onSuccess: (garantia) => {
      qc.invalidateQueries({
        queryKey: instalacionesKeys.garantias(garantia.instalacion_id),
      })
    },
  })
}
