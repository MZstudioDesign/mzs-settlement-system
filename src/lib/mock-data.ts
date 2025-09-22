/**
 * Mock data for development and testing
 */

import type {
  Member,
  Channel,
  Category,
  ProjectWithRelations,
  PaginatedResponse,
  ApiResponse
} from '@/types/database'

// Mock Members
export const mockMembers: Member[] = [
  {
    id: '1',
    name: '오유택',
    code: 'OYT',
    active: true,
    email: 'yutaek.oh@example.com',
    phone: '010-1234-5678',
    join_date: '2023-01-15',
    notes: '대표 디자이너',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: '이예천',
    code: 'LYC',
    active: true,
    email: 'yecheon.lee@example.com',
    phone: '010-2345-6789',
    join_date: '2023-02-01',
    notes: 'UI/UX 전문',
    created_at: '2023-02-01T00:00:00Z',
    updated_at: '2023-02-01T00:00:00Z'
  },
  {
    id: '3',
    name: '김연지',
    code: 'KYJ',
    active: true,
    email: 'yeonji.kim@example.com',
    phone: '010-3456-7890',
    join_date: '2023-03-10',
    notes: '브랜딩 전문',
    created_at: '2023-03-10T00:00:00Z',
    updated_at: '2023-03-10T00:00:00Z'
  },
  {
    id: '4',
    name: '김하늘',
    code: 'KHN',
    active: true,
    email: 'haneul.kim@example.com',
    phone: '010-4567-8901',
    join_date: '2023-04-05',
    notes: '웹디자인 전문',
    created_at: '2023-04-05T00:00:00Z',
    updated_at: '2023-04-05T00:00:00Z'
  },
  {
    id: '5',
    name: '이정수',
    code: 'LJS',
    active: true,
    email: 'jungsu.lee@example.com',
    phone: '010-5678-9012',
    join_date: '2023-05-20',
    notes: '모바일 앱 전문',
    created_at: '2023-05-20T00:00:00Z',
    updated_at: '2023-05-20T00:00:00Z'
  },
  {
    id: '6',
    name: '박지윤',
    code: 'PJY',
    active: true,
    email: 'jiyoon.park@example.com',
    phone: '010-6789-0123',
    join_date: '2023-06-15',
    notes: '일러스트레이션 전문',
    created_at: '2023-06-15T00:00:00Z',
    updated_at: '2023-06-15T00:00:00Z'
  }
]

// Mock Channels
export const mockChannels: Channel[] = [
  {
    id: 'ch1',
    name: '크몽',
    fee_rate: 0.21,
    active: true,
    description: '크리에이터 플랫폼',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'ch2',
    name: '숨고',
    fee_rate: 0.15,
    active: true,
    description: '전문가 매칭 플랫폼',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'ch3',
    name: '직접 의뢰',
    fee_rate: 0.0,
    active: true,
    description: '직접 고객 의뢰',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'ch4',
    name: '탈잉',
    fee_rate: 0.18,
    active: true,
    description: '재능 공유 플랫폼',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
]

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: '브랜드 아이덴티티',
    description: '로고, 브랜드 가이드라인 등',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'cat2',
    name: '웹 디자인',
    description: '홈페이지, 랜딩페이지 등',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'cat3',
    name: '앱 디자인',
    description: '모바일 앱 UI/UX',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'cat4',
    name: '인쇄물 디자인',
    description: '명함, 브로슈어, 포스터 등',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'cat5',
    name: '패키지 디자인',
    description: '제품 패키징',
    active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
]

// Mock Projects
export const mockProjects: ProjectWithRelations[] = [
  {
    id: 'proj1',
    name: '스타트업 A 브랜드 아이덴티티',
    channel_id: 'ch1',
    category_id: 'cat1',
    gross_amount: 5000000,
    discount_net: 0,
    designers: [
      { member_id: '1', percent: 60, bonus_pct: 10 },
      { member_id: '3', percent: 40, bonus_pct: 5 }
    ],
    status: 'COMPLETED',
    project_date: '2024-09-01',
    payment_date: '2024-09-15',
    notes: '로고 및 브랜드 가이드라인 제작',
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-15T00:00:00Z',
    channel: mockChannels[0],
    category: mockCategories[0],
    project_files: []
  },
  {
    id: 'proj2',
    name: '이커머스 웹사이트 디자인',
    channel_id: 'ch2',
    category_id: 'cat2',
    gross_amount: 8000000,
    discount_net: 500000,
    designers: [
      { member_id: '2', percent: 50, bonus_pct: 15 },
      { member_id: '4', percent: 50, bonus_pct: 10 }
    ],
    status: 'APPROVED',
    project_date: '2024-09-10',
    payment_date: '2024-09-25',
    notes: '반응형 웹사이트 및 관리자 패널',
    created_at: '2024-09-10T00:00:00Z',
    updated_at: '2024-09-10T00:00:00Z',
    channel: mockChannels[1],
    category: mockCategories[1],
    project_files: []
  },
  {
    id: 'proj3',
    name: '모바일 앱 UI/UX 디자인',
    channel_id: 'ch3',
    category_id: 'cat3',
    gross_amount: 12000000,
    discount_net: 1000000,
    designers: [
      { member_id: '5', percent: 70, bonus_pct: 20 },
      { member_id: '2', percent: 30, bonus_pct: 15 }
    ],
    status: 'PENDING',
    project_date: '2024-09-15',
    payment_date: '2024-10-01',
    notes: '금융 앱 전체 화면 설계',
    created_at: '2024-09-15T00:00:00Z',
    updated_at: '2024-09-15T00:00:00Z',
    channel: mockChannels[2],
    category: mockCategories[2],
    project_files: []
  },
  {
    id: 'proj4',
    name: '카페 브랜딩 패키지',
    channel_id: 'ch4',
    category_id: 'cat5',
    gross_amount: 3500000,
    discount_net: 0,
    designers: [
      { member_id: '6', percent: 80, bonus_pct: 10 },
      { member_id: '1', percent: 20, bonus_pct: 5 }
    ],
    status: 'COMPLETED',
    project_date: '2024-08-20',
    payment_date: '2024-09-05',
    notes: '로고, 메뉴판, 패키징 디자인',
    created_at: '2024-08-20T00:00:00Z',
    updated_at: '2024-09-05T00:00:00Z',
    channel: mockChannels[3],
    category: mockCategories[4],
    project_files: []
  },
  {
    id: 'proj5',
    name: '의료진 소개 브로슈어',
    channel_id: 'ch1',
    category_id: 'cat4',
    gross_amount: 1200000,
    discount_net: 100000,
    designers: [
      { member_id: '3', percent: 100, bonus_pct: 0 }
    ],
    status: 'CANCELLED',
    project_date: '2024-07-15',
    payment_date: undefined,
    notes: '클라이언트 사정으로 취소됨',
    created_at: '2024-07-15T00:00:00Z',
    updated_at: '2024-07-20T00:00:00Z',
    channel: mockChannels[0],
    category: mockCategories[3],
    project_files: []
  }
]

// Mock API functions
export const mockApi = {
  getProjects: async (params?: any): Promise<PaginatedResponse<ProjectWithRelations>> => {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay

    let filteredProjects = [...mockProjects]

    // Apply filters
    if (params?.search) {
      filteredProjects = filteredProjects.filter(p =>
        p.name.toLowerCase().includes(params.search.toLowerCase())
      )
    }

    if (params?.status) {
      filteredProjects = filteredProjects.filter(p => p.status === params.status)
    }

    if (params?.channel_id) {
      filteredProjects = filteredProjects.filter(p => p.channel_id === params.channel_id)
    }

    if (params?.category_id) {
      filteredProjects = filteredProjects.filter(p => p.category_id === params.category_id)
    }

    // Apply pagination
    const page = params?.page || 1
    const limit = params?.limit || 10
    const start = (page - 1) * limit
    const end = start + limit

    const data = filteredProjects.slice(start, end)

    return {
      data,
      pagination: {
        page,
        limit,
        total: filteredProjects.length,
        totalPages: Math.ceil(filteredProjects.length / limit)
      }
    }
  },

  getProject: async (id: string): Promise<ApiResponse<ProjectWithRelations>> => {
    await new Promise(resolve => setTimeout(resolve, 300))

    const project = mockProjects.find(p => p.id === id)
    if (!project) {
      return { error: 'Project not found' }
    }

    return { data: project }
  },

  getMembers: async (): Promise<ApiResponse<Member[]>> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { data: mockMembers }
  },

  getChannels: async (): Promise<ApiResponse<Channel[]>> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { data: mockChannels }
  },

  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return { data: mockCategories }
  },

  getProjectStats: async (): Promise<ApiResponse<any>> => {
    await new Promise(resolve => setTimeout(resolve, 300))

    const stats = {
      total: mockProjects.length,
      pending: mockProjects.filter(p => p.status === 'PENDING').length,
      approved: mockProjects.filter(p => p.status === 'APPROVED').length,
      completed: mockProjects.filter(p => p.status === 'COMPLETED').length,
      cancelled: mockProjects.filter(p => p.status === 'CANCELLED').length,
    }

    return { data: stats }
  },

  createProject: async (data: any): Promise<ApiResponse<ProjectWithRelations>> => {
    await new Promise(resolve => setTimeout(resolve, 800))

    // Simple validation
    if (!data.name || !data.channel_id || !data.gross_amount || !data.designers?.length) {
      return { error: 'Missing required fields' }
    }

    const channel = mockChannels.find(c => c.id === data.channel_id)
    const category = data.category_id ? mockCategories.find(c => c.id === data.category_id) : undefined

    if (!channel) {
      return { error: 'Invalid channel' }
    }

    const newProject: ProjectWithRelations = {
      id: `proj${Date.now()}`,
      name: data.name,
      channel_id: data.channel_id,
      category_id: data.category_id,
      gross_amount: data.gross_amount,
      discount_net: data.discount_net || 0,
      designers: data.designers,
      status: 'PENDING',
      project_date: data.project_date || new Date().toISOString().split('T')[0],
      payment_date: data.payment_date,
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      channel: channel!,
      category,
      project_files: []
    }

    mockProjects.unshift(newProject)

    return {
      data: newProject,
      message: 'Project created successfully'
    }
  },

  updateProject: async (id: string, data: any): Promise<ApiResponse<ProjectWithRelations>> => {
    await new Promise(resolve => setTimeout(resolve, 600))

    const projectIndex = mockProjects.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      return { error: 'Project not found' }
    }

    const existingProject = mockProjects[projectIndex]
    const channel = data.channel_id ? mockChannels.find(c => c.id === data.channel_id) : existingProject.channel
    const category = data.category_id ? mockCategories.find(c => c.id === data.category_id) : existingProject.category

    const updatedProject: ProjectWithRelations = {
      ...existingProject,
      ...data,
      channel: channel!,
      category,
      updated_at: new Date().toISOString()
    }

    mockProjects[projectIndex] = updatedProject

    return {
      data: updatedProject,
      message: 'Project updated successfully'
    }
  },

  deleteProject: async (id: string): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 400))

    const projectIndex = mockProjects.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      return { error: 'Project not found' }
    }

    mockProjects.splice(projectIndex, 1)

    return { message: 'Project deleted successfully' }
  }
}

// Supporting data helper
export const mockSupportingData = {
  members: mockMembers,
  channels: mockChannels,
  categories: mockCategories
}