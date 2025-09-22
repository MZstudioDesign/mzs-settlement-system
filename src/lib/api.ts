/**
 * API functions for MZS Settlement System
 * CRUD operations and data fetching utilities
 */

import { tables, views, functions } from './supabase'
import { mockApi, mockSupportingData } from './mock-data'
import type {
  Project,
  ProjectWithRelations,
  CreateProjectForm,
  UpdateProjectForm,
  ApiResponse,
  PaginatedResponse,
  Member,
  Channel,
  Category,
  ProjectFile,
  DesignerAllocation,
} from '@/types/database'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
}

// Error handling utility
function handleSupabaseError<T>(error: any): ApiResponse<T> {
  console.error('Supabase error:', error)
  return {
    error: error.message || 'Database operation failed',
  }
}

// Success response utility
function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    data,
    message,
  }
}

// Paginated response utility
function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Project API functions
export const projectsApi = {
  /**
   * Get all projects with optional filtering and pagination
   */
  async getProjects(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    channel_id?: string
    category_id?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<ProjectWithRelations>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getProjects(params)
    }

    const {
      page = 1,
      limit = 10,
      search,
      status,
      channel_id,
      category_id,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = params || {}

    try {
      let query = tables
        .projects()
        .select(`
          *,
          channel:channels(*),
          category:categories(*),
          project_files(*)
        `)

      // Apply filters
      if (search) {
        query = query.ilike('name', `%${search}%`)
      }
      if (status) {
        query = query.eq('status', status)
      }
      if (channel_id) {
        query = query.eq('channel_id', channel_id)
      }
      if (category_id) {
        query = query.eq('category_id', category_id)
      }

      // Get total count for pagination
      const { count } = await query.select('*', { count: 'exact', head: true })
      const total = count || 0

      // Apply sorting and pagination
      const { data, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range((page - 1) * limit, page * limit - 1)

      if (error) return handleSupabaseError(error)

      return paginatedResponse(data as ProjectWithRelations[], page, limit, total)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Get single project by ID with relations
   */
  async getProject(id: string): Promise<ApiResponse<ProjectWithRelations>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getProject(id)
    }

    try {
      const { data, error } = await tables
        .projects()
        .select(`
          *,
          channel:channels(*),
          category:categories(*),
          project_files(*)
        `)
        .eq('id', id)
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data as ProjectWithRelations)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Create new project
   */
  async createProject(projectData: CreateProjectForm): Promise<ApiResponse<Project>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.createProject(projectData)
    }

    try {
      // Validate designer percentages
      const { data: isValid } = await functions.validateDesignerPercentages(
        projectData.designers
      )

      if (!isValid) {
        return {
          error: 'Designer percentages must sum to 100%',
        }
      }

      // Validate bonus percentages
      for (const designer of projectData.designers) {
        const { data: bonusValid } = await functions.validateBonusPercentage(
          designer.bonus_pct
        )
        if (!bonusValid) {
          return {
            error: `Bonus percentage must be between 0% and 20% (got ${designer.bonus_pct}%)`,
          }
        }
      }

      const { data, error } = await tables
        .projects()
        .insert({
          name: projectData.name,
          channel_id: projectData.channel_id,
          category_id: projectData.category_id,
          gross_amount: projectData.gross_amount,
          discount_net: projectData.discount_net || 0,
          designers: projectData.designers,
          status: 'PENDING',
          project_date: projectData.project_date || new Date().toISOString().split('T')[0],
          payment_date: projectData.payment_date,
          notes: projectData.notes,
        })
        .select()
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data, 'Project created successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Update project
   */
  async updateProject(id: string, updates: UpdateProjectForm): Promise<ApiResponse<Project>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.updateProject(id, updates)
    }

    try {
      // Validate designer percentages if provided
      if (updates.designers) {
        const { data: isValid } = await functions.validateDesignerPercentages(
          updates.designers
        )

        if (!isValid) {
          return {
            error: 'Designer percentages must sum to 100%',
          }
        }

        // Validate bonus percentages
        for (const designer of updates.designers) {
          const { data: bonusValid } = await functions.validateBonusPercentage(
            designer.bonus_pct
          )
          if (!bonusValid) {
            return {
              error: `Bonus percentage must be between 0% and 20% (got ${designer.bonus_pct}%)`,
            }
          }
        }
      }

      const { data, error } = await tables
        .projects()
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data, 'Project updated successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.deleteProject(id)
    }

    try {
      // First delete related project files
      await tables.projectFiles().delete().eq('project_id', id)

      const { error } = await tables.projects().delete().eq('id', id)

      if (error) return handleSupabaseError(error)

      return successResponse(undefined, 'Project deleted successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Batch update project status
   */
  async batchUpdateStatus(
    ids: string[],
    status: string
  ): Promise<ApiResponse<Project[]>> {
    try {
      const { data, error } = await tables
        .projects()
        .update({ status })
        .in('id', ids)
        .select()

      if (error) return handleSupabaseError(error)

      return successResponse(data, `${data.length} projects updated successfully`)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Batch delete projects
   */
  async batchDelete(ids: string[]): Promise<ApiResponse<void>> {
    try {
      // Delete related project files first
      await tables.projectFiles().delete().in('project_id', ids)

      const { error } = await tables.projects().delete().in('id', ids)

      if (error) return handleSupabaseError(error)

      return successResponse(undefined, `${ids.length} projects deleted successfully`)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Get project statistics
   */
  async getStats(): Promise<ApiResponse<{
    total: number
    pending: number
    approved: number
    completed: number
    cancelled: number
  }>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getProjectStats()
    }

    try {
      const { data, error } = await tables
        .projects()
        .select('status')

      if (error) return handleSupabaseError(error)

      const stats = data.reduce(
        (acc, project) => {
          acc.total++
          acc[project.status.toLowerCase() as keyof typeof acc]++
          return acc
        },
        { total: 0, pending: 0, approved: 0, completed: 0, cancelled: 0 }
      )

      return successResponse(stats)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },
}

// Supporting data API functions
export const supportingDataApi = {
  /**
   * Get all active members
   */
  async getMembers(): Promise<ApiResponse<Member[]>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getMembers()
    }

    try {
      const { data, error } = await tables
        .members()
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) return handleSupabaseError(error)

      return successResponse(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Get all active channels
   */
  async getChannels(): Promise<ApiResponse<Channel[]>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getChannels()
    }

    try {
      const { data, error } = await tables
        .channels()
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) return handleSupabaseError(error)

      return successResponse(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Get all active categories
   */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getCategories()
    }

    try {
      const { data, error } = await tables
        .categories()
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) return handleSupabaseError(error)

      return successResponse(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },
}

// File upload API functions
export const fileApi = {
  /**
   * Upload project file
   */
  async uploadProjectFile(
    projectId: string,
    file: File
  ): Promise<ApiResponse<ProjectFile>> {
    try {
      // In a real implementation, you would upload to Supabase Storage
      // For now, we'll simulate with a placeholder URL
      const fileUrl = `https://placeholder.url/${file.name}`

      const { data, error } = await tables
        .projectFiles()
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_url: fileUrl,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: 'current_user', // Replace with actual user ID
        })
        .select()
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data, 'File uploaded successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Delete project file
   */
  async deleteProjectFile(fileId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await tables.projectFiles().delete().eq('id', fileId)

      if (error) return handleSupabaseError(error)

      return successResponse(undefined, 'File deleted successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },
}