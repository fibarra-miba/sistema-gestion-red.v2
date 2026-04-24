import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pagosService } from '../services/pagosService'
import { cuentaKeys, pagosKeys } from '../keys'
import type {
  PatchFacturaBonificacionIn,
  PatchFacturaBonificacionOut,
} from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  facturaVentaId: number
  payload: PatchFacturaBonificacionIn
  // Para invalidaciones finas — opcional.
  pagoId?: number
  contratoId?: number
}

export function usePatchFactura() {
  const qc = useQueryClient()

  return useMutation<PatchFacturaBonificacionOut, ApiError, Vars>({
    mutationFn: ({ facturaVentaId, payload }) =>
      pagosService.patchFacturaBonificacion(facturaVentaId, payload),
    onSuccess: (_data, { pagoId, contratoId }) => {
      if (pagoId != null) {
        qc.invalidateQueries({ queryKey: pagosKeys.detail(pagoId) })
      }
      if (contratoId != null) {
        qc.invalidateQueries({
          queryKey: pagosKeys.byContratoAll(contratoId),
        })
      }
      qc.invalidateQueries({ queryKey: cuentaKeys.all })
    },
  })
}
