/**
 * React Query hooks for supporting data (members, channels, categories)
 */

import { useQuery } from '@tanstack/react-query'
import type { ApiResponse, Member, Channel, Category } from '@/types/database'

// Query keys
export const supportingDataKeys = {
  all: ['supporting-data'] as const,
  members: () => [...supportingDataKeys.all, 'members'] as const,
  channels: () => [...supportingDataKeys.all, 'channels'] as const,
  categories: () => [...supportingDataKeys.all, 'categories'] as const,
  allData: () => [...supportingDataKeys.all, 'all'] as const,
}

// API call functions
async function fetchSupportingData<T>(type: string): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/supporting-data?type=${type}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${type}`)
  }

  return response.json()
}

async function fetchAllSupportingData(): Promise<{
  data: {
    members: Member[]
    channels: Channel[]
    categories: Category[]
  }
}> {
  const response = await fetch('/api/supporting-data?type=all')

  if (!response.ok) {
    throw new Error('Failed to fetch supporting data')
  }

  return response.json()
}

// Hooks
export function useMembers() {
  return useQuery({
    queryKey: supportingDataKeys.members(),
    queryFn: () => fetchSupportingData<Member[]>('members'),
    staleTime: 1000 * 60 * 10, // 10 minutes - members don't change often
  })
}

export function useChannels() {
  return useQuery({
    queryKey: supportingDataKeys.channels(),
    queryFn: () => fetchSupportingData<Channel[]>('channels'),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useCategories() {
  return useQuery({
    queryKey: supportingDataKeys.categories(),
    queryFn: () => fetchSupportingData<Category[]>('categories'),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useAllSupportingData() {
  return useQuery({
    queryKey: supportingDataKeys.allData(),
    queryFn: fetchAllSupportingData,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}