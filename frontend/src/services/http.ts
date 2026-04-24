import axios, { AxiosError, AxiosInstance } from 'axios'
import type { ApiError } from '@/types/api'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const http: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // La sesión vive en cookie httpOnly — hay que enviarla en cada request.
  withCredentials: true,
  timeout: 30_000,
})

// Listener registrable para 401. Se invoca desde el AuthProvider para limpiar
// la cache de sesión y forzar redirección al login. Mantiene http.ts desacoplado
// de React Query y del router.
type UnauthorizedHandler = (error: ApiError) => void
let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler
}

// Endpoints que no deben disparar el handler global de 401: son los propios
// del flujo de auth, que manejan el 401 localmente (login fallido, me sin
// sesión, etc.) y no representan una sesión expirada durante la operación.
const AUTH_SILENT_PATHS = ['/auth/login', '/auth/me']

function isAuthSilent(url: string | undefined): boolean {
  if (!url) return false
  return AUTH_SILENT_PATHS.some((p) => url.includes(p))
}

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = toApiError(error)
    if (apiError.status === 401 && !isAuthSilent(error.config?.url) && onUnauthorized) {
      onUnauthorized(apiError)
    }
    return Promise.reject(apiError)
  },
)

function toApiError(error: AxiosError): ApiError {
  if (!error.response) {
    return {
      status: 0,
      detail: error.message || 'Error de red. Verificá la conexión al backend.',
      isNetworkError: true,
      original: error,
    }
  }

  const { status, data } = error.response
  const detail = extractDetail(data)

  return {
    status,
    detail,
    code: extractCode(data),
    isNetworkError: false,
    original: error,
  }
}

function extractDetail(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Error inesperado.'

  const d = (data as { detail?: unknown }).detail

  if (typeof d === 'string') return d

  if (Array.isArray(d)) {
    // FastAPI validation errors: [{ loc, msg, type }, ...]
    return d
      .map((e) => {
        if (typeof e !== 'object' || e === null) return ''
        const loc = (e as { loc?: unknown[] }).loc?.join('.') ?? ''
        const msg = (e as { msg?: string }).msg ?? ''
        return loc ? `${loc}: ${msg}` : msg
      })
      .filter(Boolean)
      .join(' | ')
  }

  return 'Error inesperado.'
}

function extractCode(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const d = (data as { detail?: unknown }).detail
  if (typeof d === 'string' && /^[A-Z_]+$/.test(d)) return d
  return undefined
}
