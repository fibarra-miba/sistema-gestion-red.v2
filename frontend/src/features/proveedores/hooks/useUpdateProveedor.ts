import { useMutation, useQueryClient } from '@tanstack/react-query'
import { proveedoresService } from '../services/proveedoresService'
import { proveedoresKeys } from '../keys'
import type { ProveedorOut, ProveedorUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface UpdateArgs {
  proveedorId: number
  payload: ProveedorUpdate
}

export function useUpdateProveedor() {
  const qc = useQueryClient()

  return useMutation<ProveedorOut, ApiError, UpdateArgs>({
    mutationFn: ({ proveedorId, payload }) => proveedoresService.update(proveedorId, payload),
    onSuccess: (proveedor) => {
      qc.setQueryData(proveedoresKeys.detail(proveedor.proveedor_id), proveedor)
      qc.invalidateQueries({ queryKey: proveedoresKeys.lists() })
    },
  })
}
