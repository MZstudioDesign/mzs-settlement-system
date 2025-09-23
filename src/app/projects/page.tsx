/**
 * Projects List Page
 * 프로젝트 목록 페이지 - 검색, 필터링, 정렬, 페이지네이션 지원
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { useDebounce, createCurrencyFormatter, createNumberFormatter, perf } from '@/lib/performance'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  Calendar,
  CircleDollarSign,
  Users
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useProjects, useProjectStats, useBatchUpdateProjects, useBatchDeleteProjects } from '@/hooks/useProjects'
import { useAllSupportingData } from '@/hooks/useSupportingData'
import { toKRW } from '@/lib/currency'
import { calculateSettlement } from '@/lib/currency'
import type { ProjectWithRelations, ProjectStatus } from '@/types/database'

// 상태별 뱃지 스타일
const statusStyles = {
  PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 hover:bg-green-200',
  CANCELLED: 'bg-red-100 text-red-800 hover:bg-red-200',
}

const statusLabels = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  COMPLETED: '완료됨',
  CANCELLED: '취소됨',
}

export default function ProjectsPage() {
  const router = useRouter()

  // 필터 및 페이지네이션 상태
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Debounced search for better performance
  const debouncedSetSearch = useDebounce((value: string) => {
    setDebouncedSearch(value)
    setPage(1) // Reset to first page on search
  }, 300)

  // 선택된 프로젝트들
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    debouncedSetSearch(value)
  }, [debouncedSetSearch])

  // 쿼리
  const projectsQuery = useProjects({
    page,
    limit,
    search: debouncedSearch || undefined, // Use debounced search
    status: statusFilter || undefined,
    channel_id: channelFilter || undefined,
    category_id: categoryFilter || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  })

  const statsQuery = useProjectStats()
  const supportingDataQuery = useAllSupportingData()

  // 뮤테이션
  const batchUpdateMutation = useBatchUpdateProjects()
  const batchDeleteMutation = useBatchDeleteProjects()

  // 데이터 추출
  const projects = projectsQuery.data?.data || []
  const pagination = projectsQuery.data?.pagination
  const stats = statsQuery.data?.data
  const supportingData = supportingDataQuery.data?.data

  // 필터 옵션들
  const channelOptions = supportingData?.channels || []
  const categoryOptions = supportingData?.categories || []

  // 로딩 상태
  const isLoading = projectsQuery.isLoading || supportingDataQuery.isLoading

  // 전체 선택/해제
  const allSelected = projects.length > 0 && selectedProjects.length === projects.length
  const someSelected = selectedProjects.length > 0 && selectedProjects.length < projects.length

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(projects.map(p => p.id))
    }
  }

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  // 배치 작업
  const handleBatchStatusUpdate = async (status: ProjectStatus) => {
    if (selectedProjects.length === 0) return

    try {
      await batchUpdateMutation.mutateAsync({
        ids: selectedProjects,
        action: 'update_status',
        data: { status },
      })
      setSelectedProjects([])
    } catch (error) {
      console.error('Batch status update failed:', error)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedProjects.length === 0) return

    try {
      await batchDeleteMutation.mutateAsync(selectedProjects)
      setSelectedProjects([])
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Batch delete failed:', error)
    }
  }

  // Memoized formatters for performance
  const currencyFormatter = useMemo(() => createCurrencyFormatter(), [])
  const numberFormatter = useMemo(() => createNumberFormatter(), [])

  // Memoized 정산 금액 계산
  const getProjectSettlement = useCallback((project: ProjectWithRelations) => {
    const startTime = Date.now()

    const totalDesignerAmount = project.designers.reduce((sum, designer) => {
      const settlement = calculateSettlement(
        project.gross_amount,
        project.discount_net,
        designer.percent,
        designer.bonus_pct
      )
      return sum + settlement.afterWithholding
    }, 0)

    perf.logComputation('getProjectSettlement', startTime)
    return totalDesignerAmount
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">프로젝트 관리</h1>
          <p className="text-muted-foreground">
            전체 {pagination?.total || 0}개의 프로젝트
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            가져오기
          </Button>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              새 프로젝트
            </Link>
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                전체
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                대기중
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                승인됨
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                완료됨
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                취소됨
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="프로젝트명으로 검색..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  <SelectItem value="PENDING">대기중</SelectItem>
                  <SelectItem value="APPROVED">승인됨</SelectItem>
                  <SelectItem value="COMPLETED">완료됨</SelectItem>
                  <SelectItem value="CANCELLED">취소됨</SelectItem>
                </SelectContent>
              </Select>

              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="채널" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  {channelOptions.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  {categoryOptions.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 배치 작업 */}
      {selectedProjects.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedProjects.length}개 선택됨
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchStatusUpdate('APPROVED')}
                >
                  승인
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchStatusUpdate('COMPLETED')}
                >
                  완료
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 프로젝트 테이블 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(ref) => {
                      if (ref) {
                        ref.indeterminate = someSelected
                      }
                    }}
                  />
                </TableHead>
                <TableHead>프로젝트명</TableHead>
                <TableHead>채널</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>총 금액</TableHead>
                <TableHead>정산 금액</TableHead>
                <TableHead>디자이너</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>프로젝트 날짜</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(project => (
                <TableRow key={project.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleSelectProject(project.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{project.name}</div>
                    {project.notes && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {project.notes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{project.channel.name}</TableCell>
                  <TableCell>{project.category?.name || '-'}</TableCell>
                  <TableCell className="font-mono">
                    {currencyFormatter.format(project.gross_amount)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {currencyFormatter.format(getProjectSettlement(project))}
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {project.designers.slice(0, 3).map((designer, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-medium"
                        >
                          {designer.percent}%
                        </div>
                      ))}
                      {project.designers.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium">
                          +{project.designers.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusStyles[project.status]}
                    >
                      {statusLabels[project.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {new Date(project.project_date).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>작업</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          보기
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/projects/${project.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          편집
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} /
            {pagination.total}개
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage(page - 1)}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
            <DialogDescription>
              선택한 {selectedProjects.length}개의 프로젝트를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={batchDeleteMutation.isPending}
            >
              {batchDeleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}