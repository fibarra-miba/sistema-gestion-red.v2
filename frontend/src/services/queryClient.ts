import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/types/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (isApiError(error)) {
          if (error.isNetworkError) return failureCount < 2
          if (error.status >= 500) return failureCount < 1
          return false
        }
        return failureCount < 1
      },
    },
    mutations: {
      retry: false,
    },
  },
})
