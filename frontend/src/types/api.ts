export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500 | number

export interface ApiError {
  status: ApiErrorStatus
  detail: string
  code?: string
  isNetworkError: boolean
  original?: unknown
}

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'detail' in err &&
    'isNetworkError' in err
  )
}

export interface Paginated<T> {
  items: T[]
  total?: number
  limit: number
  offset: number
}

export interface ListEnvelope<T> {
  items: T[]
}
