import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contratosService } from '../services/contratosService'
import { contratosKeys } from '../keys'
import type { ContractActionResponse, ContractBajaIn, ContractOut } from '../types'
import type { ApiError } from '@/types/api'

// Transiciones de estado sin payload. Todas devuelven { message }.
// Usamos mutations separadas (no una sola con variante) para exponer
// isPending / error independientes por acción en la UI.
export function useContratoActions() {
  const qc = useQueryClient()

  const invalidate = (contratoId: number) => {
    qc.invalidateQueries({ queryKey: contratosKeys.lists() })
    qc.invalidateQueries({ queryKey: contratosKeys.detail(contratoId) })
  }

  const activate = useMutation<ContractActionResponse, ApiError, number>({
    mutationFn: (id) => contratosService.activate(id),
    onSuccess: (_data, id) => invalidate(id),
  })

  const suspend = useMutation<ContractActionResponse, ApiError, number>({
    mutationFn: (id) => contratosService.suspend(id),
    onSuccess: (_data, id) => invalidate(id),
  })

  const resume = useMutation<ContractActionResponse, ApiError, number>({
    mutationFn: (id) => contratosService.resume(id),
    onSuccess: (_data, id) => invalidate(id),
  })

  // cancel/terminate ahora aceptan fecha_fin_contrato/motivo opcionales
  // (BajaContratoDialog) — variables con forma { contratoId, payload }.
  const cancel = useMutation<
    ContractActionResponse,
    ApiError,
    { contratoId: number; payload?: ContractBajaIn }
  >({
    mutationFn: ({ contratoId, payload }) =>
      contratosService.cancel(contratoId, payload),
    onSuccess: (_data, { contratoId }) => invalidate(contratoId),
  })

  const terminate = useMutation<
    ContractActionResponse,
    ApiError,
    { contratoId: number; payload?: ContractBajaIn }
  >({
    mutationFn: ({ contratoId, payload }) =>
      contratosService.terminate(contratoId, payload),
    onSuccess: (_data, { contratoId }) => invalidate(contratoId),
  })

  const asignarPromo = useMutation<
    ContractOut,
    ApiError,
    { contratoId: number; promocionId: number }
  >({
    mutationFn: ({ contratoId, promocionId }) =>
      contratosService.asignarPromocion(contratoId, { promocion_id: promocionId }),
    onSuccess: (_data, { contratoId }) => invalidate(contratoId),
  })

  const quitarPromo = useMutation<ContractOut, ApiError, number>({
    mutationFn: (id) => contratosService.quitarPromocion(id),
    onSuccess: (_data, id) => invalidate(id),
  })

  return { activate, suspend, resume, cancel, terminate, asignarPromo, quitarPromo }
}
