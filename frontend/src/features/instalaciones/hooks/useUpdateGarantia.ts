import { useMutation, useQueryClient } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { GarantiaOut, GarantiaUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  garantiaId: number
  payload: GarantiaUpdate
}

// Update genérico de garantía: corrige monto, fechas, motivo, resolución
// y/o estado. Lo usa EditarGarantiaDialog (corrección libre, incluso sobre
// una garantía ANULADA). Invalida todo lo que puede quedar desactualizado:
// el detalle de la instalación dueña, el listado de garantías de esa
// instalación, el listado global (pantalla /garantias) y el resumen.
export function useUpdateGarantia() {
  const qc = useQueryClient()

  return useMutation<GarantiaOut, ApiError, Vars>({
    mutationFn: ({ garantiaId, payload }) =>
      instalacionesService.updateGarantia(garantiaId, payload),
    onSuccess: (garantia) => {
      qc.invalidateQueries({
        queryKey: instalacionesKeys.detail(garantia.instalacion_id),
      })
      qc.invalidateQueries({
        queryKey: instalacionesKeys.garantias(garantia.instalacion_id),
      })
      qc.invalidateQueries({ queryKey: instalacionesKeys.garantiasLists() })
      qc.invalidateQueries({ queryKey: instalacionesKeys.garantiasResumen() })
    },
  })
}
