import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // Data retention time
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          // Don't retry client errors
          if ('status' in error && error.status >= 400 && error.status < 500) {
            return false
          }
          // Don't retry rate limit errors
          if (error.message.includes('Too many requests')) {
            return false
          }
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
      refetchOnMount: 'always',
      refetchInterval: (data) => {
        // Refetch frequency based on data type
        if (data?.type === 'analytics') return 5 * 60 * 1000 // 5 minutes
        if (data?.type === 'extraction') return false // Don't auto-refetch
        return false
      }
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('Too many requests')) {
          return false
        }
        return failureCount < 2
      },
      onError: (error) => {
        console.error('Mutation error:', error)
      }
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
