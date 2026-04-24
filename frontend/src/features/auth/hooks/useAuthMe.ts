import { useQuery } from '@tanstack/react-query'
import { authKeys } from '../keys'
import { authService } from '../services/authService'
import { isApiError } from '@/types/api'

// Query de sesión: consulta /auth/me una vez y cachea el resultado.
// - Si el backend responde 401 la query falla y el ProtectedRoute redirige a /login.
// - No reintenta en 401 (sin sesión) para evitar loops al entrar por primera vez.
export function useAuthMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authService.me,
    retry: (failureCount, error) => {
      if (isApiError(error)) {
        if (error.status === 401) return false
        if (error.isNetworkError) return failureCount < 1
        return false
      }
      return false
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  })
}
