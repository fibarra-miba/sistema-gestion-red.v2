import { useMutation, useQueryClient } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { GarantiaCreate, GarantiaOut } from '../types'
import type { ApiError } from '@/types/api'

export function useCreateGarantia() {
  const qc = useQueryClient()

  return useMutation<GarantiaOut, ApiError, GarantiaCreate>({
    mutationFn: (payload) => instalacionesService.createGarantia(payload),
    onSuccess: (garantia) => {
      qc.invalidateQueries({
        queryKey: instalacionesKeys.garantias(garantia.instalacion_id),
      })
      // Un depósito nuevo suma al comprometido: hay que refrescar el KPI del
      // dashboard y el listado global, no solo la sección de la instalación.
      qc.invalidateQueries({ queryKey: instalacionesKeys.garantiasLists() })
      qc.invalidateQueries({ queryKey: instalacionesKeys.garantiasResumen() })
    },
  })
}
