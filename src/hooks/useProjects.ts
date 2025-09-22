/**
 * React Query hooks for project management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  ProjectWithRelations,
  CreateProjectForm,
  UpdateProjectForm,
  PaginatedResponse,
  ApiResponse,
} from '@/types/database'

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
}

// API call functions
async function fetchProjects(params?: Record<string, any>): Promise<PaginatedResponse<ProjectWithRelations>> {
  const searchParams = new URLSearchParams()

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const response = await fetch(`/api/projects?${searchParams}`)

  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }

  return response.json()
}

async function fetchProject(id: string): Promise<ApiResponse<ProjectWithRelations>> {
  const response = await fetch(`/api/projects/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch project')
  }

  return response.json()
}

async function createProject(data: CreateProjectForm): Promise<ApiResponse<ProjectWithRelations>> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create project')
  }

  return response.json()
}

async function updateProject(id: string, data: UpdateProjectForm): Promise<ApiResponse<ProjectWithRelations>> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update project')
  }

  return response.json()
}

async function deleteProject(id: string): Promise<ApiResponse<void>> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete project')
  }

  return response.json()
}

async function batchUpdateProjects(ids: string[], action: string, data?: any): Promise<ApiResponse<any>> {
  const response = await fetch('/api/projects/batch', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids, action, ...data }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update projects')
  }

  return response.json()
}

async function batchDeleteProjects(ids: string[]): Promise<ApiResponse<void>> {
  const response = await fetch('/api/projects/batch', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete projects')
  }

  return response.json()
}

async function fetchProjectStats(): Promise<ApiResponse<any>> {
  const response = await fetch('/api/projects/stats')

  if (!response.ok) {
    throw new Error('Failed to fetch project stats')
  }

  return response.json()
}

// Hooks
export function useProjects(params?: Record<string, any>) {
  return useQuery({
    queryKey: projectKeys.list(params || {}),
    queryFn: () => fetchProjects(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
  })
}

export function useProjectStats() {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: fetchProjectStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      toast.success(data.message || 'Project created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectForm }) =>
      updateProject(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      toast.success(data.message || 'Project updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      toast.success(data.message || 'Project deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useBatchUpdateProjects() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, action, data }: { ids: string[]; action: string; data?: any }) =>
      batchUpdateProjects(ids, action, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      toast.success(data.message || 'Projects updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useBatchDeleteProjects() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: batchDeleteProjects,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      toast.success(data.message || 'Projects deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}