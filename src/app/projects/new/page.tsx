/**
 * Project Creation Page
 * 새 프로젝트 생성 페이지
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calculator } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectForm } from '@/components/forms/project-form'
import { SettlementCalculator } from '@/components/calculator/settlement-calculator'
import { Breadcrumb } from '@/components/navigation/breadcrumb'

import { useCreateProject } from '@/hooks/useProjects'
import { useAllSupportingData } from '@/hooks/useSupportingData'
import type { CreateProjectForm } from '@/types/database'

export default function NewProjectPage() {
  const router = useRouter()
  const [showCalculator, setShowCalculator] = useState(false)

  // Queries
  const createProjectMutation = useCreateProject()
  const supportingDataQuery = useAllSupportingData()

  // 브레드크럼 아이템
  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '프로젝트 관리', href: '/projects' },
    { label: '새 프로젝트', href: '/projects/new', current: true },
  ]

  // 폼 제출 핸들러
  const handleSubmit = async (data: CreateProjectForm) => {
    try {
      const result = await createProjectMutation.mutateAsync(data)
      if (result.data) {
        router.push(`/projects/${result.data.id}`)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  // 로딩 상태
  if (supportingDataQuery.isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
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
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">새 프로젝트 생성</h1>
            <p className="text-muted-foreground">
              프로젝트 정보와 디자이너 배분을 입력하세요
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
                supportingData={supportingDataQuery.data?.data}
                onSubmit={handleSubmit}
                isLoading={createProjectMutation.isPending}
                submitLabel="프로젝트 생성"
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
                <SettlementCalculator />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}