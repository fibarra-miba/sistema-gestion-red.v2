import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler } from '@/services/http'
import { isApiError } from '@/types/api'
import { authKeys } from './keys'
import { useAuthMe } from './hooks/useAuthMe'
import type { AuthMe, CapabilityKey, CodigoRol } from './types'

interface AuthContextValue {
  user: AuthMe | null
  isLoading: boolean
  // Error de red o backend impidiendo autenticar — NO es "sin sesión" (401).
  isError: boolean
  hasCapability: (cap: CapabilityKey) => boolean
  hasRole: (...roles: CodigoRol[]) => boolean
  // Fuerza re-fetch de /auth/me. Útil tras acciones que cambian el usuario.
  refresh: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const query = useAuthMe()

  // Limpiamos la cache de sesión cuando cualquier endpoint devuelve 401.
  // Esto dispara el redirect en ProtectedRoute sin acoplar http.ts al router.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(authKeys.me(), null)
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  const user = query.data ?? null
  const isUnauthenticated =
    query.isError && isApiError(query.error) && query.error.status === 401
  const isLoading = query.isLoading || query.isFetching
  // Diferenciamos "sin sesión" (401 → usuario anónimo, no es error) de errores reales.
  const isError = query.isError && !isUnauthenticated

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: isLoading && !user && !isUnauthenticated,
      isError,
      hasCapability: (cap) => !!user?.capabilities?.[cap],
      hasRole: (...roles) => !!user && roles.includes(user.rol.codigo_rol as CodigoRol),
      refresh: () => {
        queryClient.invalidateQueries({ queryKey: authKeys.me() })
      },
    }),
    [user, isLoading, isUnauthenticated, isError, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
