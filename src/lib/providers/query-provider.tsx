'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Optimized cache times for settlement system
            staleTime: 1000 * 60 * 10, // 10 minutes (longer for stable data)
            gcTime: 1000 * 60 * 30, // 30 minutes (keep in memory longer)

            // Retry strategy optimized for API patterns
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error instanceof Error && error.message.includes('4')) {
                return false
              }
              // Exponential backoff for retries
              return failureCount < 2
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Refetch options for better UX
            refetchOnWindowFocus: false, // Prevent unnecessary refetches
            refetchOnReconnect: true, // Refetch when network reconnects
            refetchOnMount: false, // Use cache when component mounts
          },
          mutations: {
            // Retry mutations with exponential backoff
            retry: (failureCount, error) => {
              if (error instanceof Error && error.message.includes('4')) {
                return false
              }
              return failureCount < 2
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}