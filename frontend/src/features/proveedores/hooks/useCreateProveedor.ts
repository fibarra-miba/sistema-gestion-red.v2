import { useMutation, useQueryClient } from '@tanstack/react-query'
import { proveedoresService } from '../services/proveedoresService'
import { proveedoresKeys } from '../keys'
import type { ProveedorCreate, ProveedorOut } from '../types'
import type { ApiError } from '@/types/api'

export function useCreateProveedor() {
  const qc = useQueryClient()

  return useMutation<ProveedorOut, ApiError, ProveedorCreate>({
    mutationFn: (payload) => proveedoresService.create(payload),
    onSuccess: (proveedor) => {
      qc.setQueryData(proveedoresKeys.detail(proveedor.proveedor_id), proveedor)
      qc.invalidateQueries({ queryKey: proveedoresKeys.lists() })
    },
  })
}
