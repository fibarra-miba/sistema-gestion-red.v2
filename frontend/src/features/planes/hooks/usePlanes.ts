import { useQuery } from '@tanstack/react-query'
import { planesService } from '../services/planesService'
import { planesKeys } from '../keys'

export function usePlanes() {
  return useQuery({
    queryKey: planesKeys.list(),
    queryFn: () => planesService.list(),
    staleTime: 60_000,
  })
}
