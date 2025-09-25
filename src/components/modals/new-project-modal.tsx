'use client'

import { useState, lazy, Suspense, useEffect, memo, useCallback } from 'react'
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
import { ModalLoading, FormSkeleton } from '@/components/ui/loading'
import { useCreateProject } from '@/hooks/useProjects'
import { useAllSupportingData } from '@/hooks/useSupportingData'
import type { CreateProjectForm } from '@/types/database'

// Lazy load heavy components
const LazyProjectForm = lazy(() => import('@/components/forms/project-form').then(module => ({ default: module.ProjectForm })))
const LazySettlementCalculator = lazy(() => import('@/components/calculator/settlement-calculator').then(module => ({ default: module.SettlementCalculator })))

interface NewProjectModalProps {
  children: React.ReactNode
}

export const NewProjectModal = memo(function NewProjectModal({ children }: NewProjectModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [shouldLoadData, setShouldLoadData] = useState(false)

  // Only initialize queries when modal opens (deferred loading)
  const createProjectMutation = useCreateProject()
  const supportingDataQuery = useAllSupportingData({
    enabled: shouldLoadData // Only fetch when modal opens
  })

  // Deferred data loading when modal opens
  useEffect(() => {
    if (open && !shouldLoadData) {
      setShouldLoadData(true)
    }
  }, [open, shouldLoadData])

  // Memoized handlers for better performance
  const handleSubmit = useCallback(async (data: CreateProjectForm) => {
    try {
      const result = await createProjectMutation.mutateAsync(data)
      if (result.data) {
        setOpen(false)
        router.push(`/projects/${result.data.id}`)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }, [createProjectMutation, router])

  const handleModalClose = useCallback(() => {
    setOpen(false)
    setShowCalculator(false)
  }, [])

  const toggleCalculator = useCallback(() => {
    setShowCalculator(prev => !prev)
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
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
              onClick={toggleCalculator}
            >
              <Calculator className="h-4 w-4 mr-2" />
              {showCalculator ? '계산기 숨기기' : '정산 계산기'}
            </Button>
          </div>
        </DialogHeader>

        <div className={`grid gap-6 ${showCalculator ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* 프로젝트 폼 - Lazy Loaded */}
          <div className="space-y-4">
            {!shouldLoadData ? (
              <ModalLoading text="데이터 로딩 중..." />
            ) : (
              <Suspense fallback={<FormSkeleton rows={6} />}>
                <LazyProjectForm
                  supportingData={supportingDataQuery.data?.data}
                  onSubmit={handleSubmit}
                  isLoading={createProjectMutation.isPending}
                  submitLabel="프로젝트 생성"
                />
              </Suspense>
            )}
          </div>

          {/* 정산 계산기 - Lazy Loaded */}
          {showCalculator && (
            <div className="border-l pl-6 space-y-4">
              <h3 className="text-lg font-semibold">정산 계산기</h3>
              <Suspense fallback={<ModalLoading text="계산기 로딩 중..." />}>
                <LazySettlementCalculator />
              </Suspense>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})