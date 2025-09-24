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

  // 로딩 상태 - 5초 후 에러 시에도 폼 표시 (성능 개선)
  const showContent = !supportingDataQuery.isLoading || supportingDataQuery.isError

  // 기본 데이터 (API 실패 시 fallback)
  const fallbackData = {
    members: [
      { id: '1', name: '오유택', code: 'OY' },
      { id: '2', name: '이예천', code: 'LE' },
      { id: '3', name: '김연지', code: 'KY' },
      { id: '4', name: '김하늘', code: 'KH' },
      { id: '5', name: '이정수', code: 'IJ' },
      { id: '6', name: '박지윤', code: 'PJ' }
    ],
    channels: [
      { id: '1', name: '크몽', fee_rate: 0.21 },
      { id: '2', name: '계좌입금', fee_rate: 0 }
    ],
    categories: [
      { id: '1', name: '카드뉴스' },
      { id: '2', name: '포스터' },
      { id: '3', name: '현수막/배너' },
      { id: '4', name: '메뉴판' },
      { id: '5', name: '블로그스킨' }
    ]
  }

  const supportingData = supportingDataQuery.data?.data || fallbackData

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
                supportingData={supportingData}
                onSubmit={handleSubmit}
                isLoading={createProjectMutation.isPending}
                submitLabel="프로젝트 생성"
              />
              {supportingDataQuery.isError && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    ⚠️ 네트워크 문제로 최신 데이터를 불러오지 못했습니다. 기본 설정으로 진행합니다.
                  </p>
                </div>
              )}
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