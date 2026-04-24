import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pagosService } from '../services/pagosService'
import { cuentaKeys, pagosKeys } from '../keys'
import type { PagoDetalleOut, PagoMovimientoIn } from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  pagoId: number
  payload: PagoMovimientoIn
}

export function useRegistrarMovimiento() {
  const qc = useQueryClient()

  return useMutation<PagoDetalleOut, ApiError, Vars>({
    mutationFn: ({ pagoId, payload }) =>
      pagosService.registrarMovimiento(pagoId, payload),
    onSuccess: (data) => {
      // El backend devuelve el detalle actualizado — lo sembramos en cache.
      qc.setQueryData(pagosKeys.detail(data.pago.pago_id), data)
      qc.invalidateQueries({
        queryKey: pagosKeys.byContratoAll(data.pago.contrato_id),
      })
      qc.invalidateQueries({ queryKey: cuentaKeys.all })
    },
  })
}
