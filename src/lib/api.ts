/**
 * API functions for MZS Settlement System
 * CRUD operations and data fetching utilities
 */

import { tables, views, functions } from './supabase'
import { mockApi, mockSupportingData } from './mock-data'
import { settlementsApi } from './api/settlements'
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
  Contact,
  ContactWithRelations,
  CreateContactForm,
  FeedLog,
  FeedLogWithMember,
  CreateFeedLogForm,
  Settlement,
  SettlementWithItems,
  CreateSettlementForm,
  UpdateSettlementForm,
  SettlementItem,
  CreateSettlementItemForm,
} from '@/types/database'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
}

// Error handling utility
function handleSupabaseError<T>(error: any): ApiResponse<T> {
  // Better error handling for different error types
  let errorMessage = 'Database operation failed'

  if (error) {
    if (typeof error === 'string') {
      errorMessage = error
    } else if (error.message) {
      errorMessage = error.message
    } else if (error.error_description) {
      errorMessage = error.error_description
    } else if (error.details) {
      errorMessage = error.details
    } else {
      // If error is an object but no recognizable message field
      errorMessage = `Database error: ${JSON.stringify(error)}`
    }
  }

  console.error('Supabase error:', error)
  console.error('Processed error message:', errorMessage)

  return {
    error: errorMessage,
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

// Contact API functions
export const contactsApi = {
  /**
   * Get contacts with optional filtering and pagination
   */
  async getContacts(params?: {
    page?: number
    limit?: number
    member_id?: string
    project_id?: string
    contact_type?: string
    date_from?: string
    date_to?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<ContactWithRelations>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getContacts(params)
    }

    const {
      page = 1,
      limit = 10,
      member_id,
      project_id,
      contact_type,
      date_from,
      date_to,
      sort_by = 'event_date',
      sort_order = 'desc',
    } = params || {}

    try {
      let query = tables
        .contacts()
        .select(`
          *,
          member:members(*),
          project:projects(*)
        `)

      // Apply filters
      if (member_id) {
        query = query.eq('member_id', member_id)
      }
      if (project_id) {
        query = query.eq('project_id', project_id)
      }
      if (contact_type) {
        query = query.eq('contact_type', contact_type)
      }
      if (date_from) {
        query = query.gte('event_date', date_from)
      }
      if (date_to) {
        query = query.lte('event_date', date_to)
      }

      // Get total count for pagination
      const { count } = await query.select('*', { count: 'exact', head: true })
      const total = count || 0

      // Apply sorting and pagination
      const { data, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range((page - 1) * limit, page * limit - 1)

      if (error) return handleSupabaseError(error)

      return paginatedResponse(data as ContactWithRelations[], page, limit, total)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Create new contact
   */
  async createContact(contactData: CreateContactForm): Promise<ApiResponse<Contact>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.createContact(contactData)
    }

    try {
      // Get the fixed amount for the contact type
      const contactAmounts = {
        INCOMING: 1000,
        CHAT: 1000,
        GUIDE: 2000,
      }

      const { data, error } = await tables
        .contacts()
        .insert({
          member_id: contactData.member_id,
          project_id: contactData.project_id,
          contact_type: contactData.contact_type,
          amount: contactAmounts[contactData.contact_type],
          event_date: contactData.event_date || new Date().toISOString().split('T')[0],
          notes: contactData.notes,
        })
        .select()
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data, 'Contact logged successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Update contact
   */
  async updateContact(id: string, updates: Partial<CreateContactForm>): Promise<ApiResponse<Contact>> {
    try {
      const { data, error } = await tables
        .contacts()
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data, 'Contact updated successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Delete contact
   */
  async deleteContact(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await tables.contacts().delete().eq('id', id)

      if (error) return handleSupabaseError(error)

      return successResponse(undefined, 'Contact deleted successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Get contact statistics
   */
  async getContactStats(memberId?: string): Promise<ApiResponse<{
    total: number
    incoming: number
    chat: number
    guide: number
    totalAmount: number
  }>> {
    try {
      let query = tables.contacts().select('contact_type, amount')

      if (memberId) {
        query = query.eq('member_id', memberId)
      }

      const { data, error } = await query

      if (error) return handleSupabaseError(error)

      const stats = data.reduce(
        (acc, contact) => {
          acc.total++
          acc.totalAmount += contact.amount
          acc[contact.contact_type.toLowerCase() as keyof typeof acc]++
          return acc
        },
        { total: 0, incoming: 0, chat: 0, guide: 0, totalAmount: 0 }
      )

      return successResponse(stats)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },
}

// Feed Log API functions
export const feedLogsApi = {
  /**
   * Get feed logs with optional filtering and pagination
   */
  async getFeedLogs(params?: {
    page?: number
    limit?: number
    member_id?: string
    feed_type?: string
    date_from?: string
    date_to?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<FeedLogWithMember>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getFeedLogs(params)
    }

    const {
      page = 1,
      limit = 10,
      member_id,
      feed_type,
      date_from,
      date_to,
      sort_by = 'event_date',
      sort_order = 'desc',
    } = params || {}

    try {
      let query = tables
        .feedLogs()
        .select(`
          *,
          member:members(*)
        `)

      // Apply filters
      if (member_id) {
        query = query.eq('member_id', member_id)
      }
      if (feed_type) {
        query = query.eq('feed_type', feed_type)
      }
      if (date_from) {
        query = query.gte('event_date', date_from)
      }
      if (date_to) {
        query = query.lte('event_date', date_to)
      }

      // Get total count for pagination
      const { count } = await query.select('*', { count: 'exact', head: true })
      const total = count || 0

      // Apply sorting and pagination
      const { data, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range((page - 1) * limit, page * limit - 1)

      if (error) return handleSupabaseError(error)

      return paginatedResponse(data as FeedLogWithMember[], page, limit, total)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Create new feed log
   */
  async createFeedLog(feedData: CreateFeedLogForm): Promise<ApiResponse<FeedLog>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.createFeedLog(feedData)
    }

    try {
      // Get the fixed amount for the feed type
      const feedAmounts = {
        BELOW3: 400,
        GTE3: 1000,
      }

      const { data, error } = await tables
        .feedLogs()
        .insert({
          member_id: feedData.member_id,
          feed_type: feedData.feed_type,
          amount: feedAmounts[feedData.feed_type],
          event_date: feedData.event_date || new Date().toISOString().split('T')[0],
          notes: feedData.notes,
        })
        .select()
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data, 'Feed log created successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Update feed log
   */
  async updateFeedLog(id: string, updates: Partial<CreateFeedLogForm>): Promise<ApiResponse<FeedLog>> {
    try {
      const { data, error } = await tables
        .feedLogs()
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data, 'Feed log updated successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Delete feed log
   */
  async deleteFeedLog(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await tables.feedLogs().delete().eq('id', id)

      if (error) return handleSupabaseError(error)

      return successResponse(undefined, 'Feed log deleted successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Get feed log statistics
   */
  async getFeedStats(memberId?: string): Promise<ApiResponse<{
    total: number
    below3: number
    gte3: number
    totalAmount: number
  }>> {
    try {
      let query = tables.feedLogs().select('feed_type, amount')

      if (memberId) {
        query = query.eq('member_id', memberId)
      }

      const { data, error } = await query

      if (error) return handleSupabaseError(error)

      const stats = data.reduce(
        (acc, feed) => {
          acc.total++
          acc.totalAmount += feed.amount
          if (feed.feed_type === 'BELOW3') {
            acc.below3++
          } else {
            acc.gte3++
          }
          return acc
        },
        { total: 0, below3: 0, gte3: 0, totalAmount: 0 }
      )

      return successResponse(stats)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },
}