/**
 * Project Edit Page
 * 프로젝트 편집 페이지
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calculator, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectForm } from '@/components/forms/project-form'
import { SettlementCalculator } from '@/components/calculator/settlement-calculator'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

import { useProject, useUpdateProject } from '@/hooks/useProjects'
import { useAllSupportingData } from '@/hooks/useSupportingData'
import type { UpdateProjectForm } from '@/types/database'

interface ProjectEditPageProps {
  params: {
    id: string
  }
}

export default function ProjectEditPage({ params }: ProjectEditPageProps) {
  const router = useRouter()
  const [showCalculator, setShowCalculator] = useState(false)

  // Queries
  const projectQuery = useProject(params.id)
  const updateProjectMutation = useUpdateProject()
  const supportingDataQuery = useAllSupportingData()

  const project = projectQuery.data?.data

  // 브레드크럼 아이템
  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '프로젝트 관리', href: '/projects' },
    { label: project?.name || '프로젝트', href: `/projects/${params.id}` },
    { label: '편집', href: `/projects/${params.id}/edit`, current: true },
  ]

  // 폼 제출 핸들러
  const handleSubmit = async (data: UpdateProjectForm) => {
    try {
      await updateProjectMutation.mutateAsync({
        id: params.id,
        data
      })
      router.push(`/projects/${params.id}`)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  // 로딩 상태
  if (projectQuery.isLoading || supportingDataQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 브레드크럼 */}
      <Breadcrumb items={breadcrumbItems} />

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/projects/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">프로젝트 편집</h1>
            <p className="text-muted-foreground">
              &quot;{project.name}&quot; 프로젝트 정보를 수정하세요
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowCalculator(!showCalculator)}
        >
          <Calculator className="h-4 w-4 mr-2" />
          {showCalculator ? '계산기 숨기기' : '정산 계산기'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 프로젝트 폼 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectForm
                initialData={project}
                supportingData={supportingDataQuery.data?.data}
                onSubmit={handleSubmit}
                isLoading={updateProjectMutation.isPending}
                submitLabel="변경사항 저장"
                submitIcon={<Save className="h-4 w-4" />}
              />
            </CardContent>
          </Card>
        </div>

        {/* 정산 계산기 */}
        {showCalculator && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>정산 계산기</CardTitle>
              </CardHeader>
              <CardContent>
                <SettlementCalculator
                  initialGrossAmount={project.gross_amount}
                  initialDiscountNet={project.discount_net}
                  initialDesigners={project.designers}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}