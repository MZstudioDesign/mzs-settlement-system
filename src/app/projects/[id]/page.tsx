/**
 * Project Detail Page
 * 프로젝트 상세 페이지
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Calendar,
  CircleDollarSign,
  Users,
  Building,
  Tag,
  Download,
  Upload
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SettlementDetailCard } from '@/components/cards/settlement-detail-card'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

import { useProject, useDeleteProject } from '@/hooks/useProjects'
import { toKRW, calculateSettlement, calculateFees } from '@/lib/currency'
import type { ProjectWithRelations } from '@/types/database'

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

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Queries & Mutations
  const projectQuery = useProject(params.id)
  const deleteProjectMutation = useDeleteProject()

  const project = projectQuery.data?.data

  // 브레드크럼 아이템
  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '프로젝트 관리', href: '/projects' },
    { label: project?.name || '프로젝트 상세', href: `/projects/${params.id}`, current: true },
  ]

  // 삭제 핸들러
  const handleDelete = async () => {
    try {
      await deleteProjectMutation.mutateAsync(params.id)
      router.push('/projects')
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  // 정산 정보 계산
  const getSettlementInfo = (project: ProjectWithRelations) => {
    const channelFeeRate = project.channel.fee_rate
    const fees = calculateFees(project.gross_amount, project.discount_net, channelFeeRate)

    const designerSettlements = project.designers.map(designer => ({
      ...designer,
      settlement: calculateSettlement(
        project.gross_amount,
        project.discount_net,
        designer.percent,
        designer.bonus_pct
      )
    }))

    const totalDesignerAmount = designerSettlements.reduce(
      (sum, d) => sum + d.settlement.afterWithholding,
      0
    )

    const companyProfit = project.gross_amount - project.discount_net - fees.adFee - fees.programFee - fees.channelFee - totalDesignerAmount

    return {
      fees,
      designerSettlements,
      totalDesignerAmount,
      companyProfit
    }
  }

  // 로딩 상태
  if (projectQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (projectQuery.isError || !project) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">프로젝트를 찾을 수 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                요청한 프로젝트가 존재하지 않거나 접근 권한이 없습니다.
              </p>
              <Button asChild>
                <Link href="/projects">프로젝트 목록으로 돌아가기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const settlementInfo = getSettlementInfo(project)

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 브레드크럼 */}
      <Breadcrumb items={breadcrumbItems} />

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge
                variant="secondary"
                className={statusStyles[project.status]}
              >
                {statusLabels[project.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {new Date(project.created_at).toLocaleDateString('ko-KR')} 생성
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              편집
            </Link>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-4 w-4" />
                    채널
                  </div>
                  <div className="font-medium">{project.channel.name}</div>
                  <div className="text-sm text-muted-foreground">
                    수수료: {(project.channel.fee_rate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    카테고리
                  </div>
                  <div className="font-medium">{project.category?.name || '-'}</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    프로젝트 날짜
                  </div>
                  <div className="font-medium">
                    {new Date(project.project_date).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                {project.payment_date && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      지급 예정일
                    </div>
                    <div className="font-medium">
                      {new Date(project.payment_date).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CircleDollarSign className="h-4 w-4" />
                    총 금액 (VAT 포함)
                  </div>
                  <div className="font-mono text-lg font-bold">
                    {toKRW(project.gross_amount)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CircleDollarSign className="h-4 w-4" />
                    할인 금액
                  </div>
                  <div className="font-mono text-lg">
                    {toKRW(project.discount_net)}
                  </div>
                </div>
              </div>

              {project.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      메모
                    </div>
                    <div className="text-sm bg-muted p-3 rounded-md">
                      {project.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 디자이너 배분 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                디자이너 배분
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settlementInfo.designerSettlements.map((designer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {designer.percent}%
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">멤버 ID: {designer.member_id}</div>
                        <div className="text-sm text-muted-foreground">
                          보너스: {designer.bonus_pct}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">
                        {toKRW(designer.settlement.afterWithholding)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        (세전: {toKRW(designer.settlement.beforeWithholding)})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 파일 목록 */}
          {project.project_files && project.project_files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>첨부 파일</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.project_files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{file.file_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {file.file_size && `${(file.file_size / 1024 / 1024).toFixed(1)}MB`}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 우측 정산 정보 */}
        <div>
          <SettlementDetailCard
            grossAmount={project.gross_amount}
            discountNet={project.discount_net}
            channelFeeRate={project.channel.fee_rate}
            designers={project.designers}
          />
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
            <DialogDescription>
              &quot;{project.name}&quot; 프로젝트를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}