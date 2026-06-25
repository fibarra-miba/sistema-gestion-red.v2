import { useQuery } from '@tanstack/react-query'
import { auditoriaService } from '../services/auditoriaService'
import { auditoriaKeys } from '../keys'

// Listas canónicas de módulos/acciones para poblar los filtros. Cambian poco.
export function useAuditoriaTipos() {
  return useQuery({
    queryKey: auditoriaKeys.tipos(),
    queryFn: () => auditoriaService.tipos(),
    staleTime: 60 * 60_000,
  })
}
