'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calculator } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProjectForm } from '@/components/forms/project-form'
import { SettlementCalculator } from '@/components/calculator/settlement-calculator'
import { useCreateProject } from '@/hooks/useProjects'
import { useAllSupportingData } from '@/hooks/useSupportingData'
import type { CreateProjectForm } from '@/types/database'

interface NewProjectModalProps {
  children: React.ReactNode
}

export function NewProjectModal({ children }: NewProjectModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)

  // Queries
  const createProjectMutation = useCreateProject()
  const supportingDataQuery = useAllSupportingData()

  // 폼 제출 핸들러
  const handleSubmit = async (data: CreateProjectForm) => {
    try {
      const result = await createProjectMutation.mutateAsync(data)
      if (result.data) {
        setOpen(false)
        router.push(`/projects/${result.data.id}`)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>새 프로젝트 생성</DialogTitle>
              <DialogDescription>
                프로젝트 정보와 디자이너 배분을 입력하세요
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <Calculator className="h-4 w-4 mr-2" />
              {showCalculator ? '계산기 숨기기' : '정산 계산기'}
            </Button>
          </div>
        </DialogHeader>

        <div className={`grid gap-6 ${showCalculator ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* 프로젝트 폼 */}
          <div className="space-y-4">
            {supportingDataQuery.isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <ProjectForm
                supportingData={supportingDataQuery.data?.data}
                onSubmit={handleSubmit}
                isLoading={createProjectMutation.isPending}
                submitLabel="프로젝트 생성"
              />
            )}
          </div>

          {/* 정산 계산기 */}
          {showCalculator && (
            <div className="border-l pl-6 space-y-4">
              <h3 className="text-lg font-semibold">정산 계산기</h3>
              <SettlementCalculator />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}