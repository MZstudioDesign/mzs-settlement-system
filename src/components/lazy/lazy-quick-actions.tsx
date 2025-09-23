'use client'

import { lazy, Suspense, memo } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calculator, Users, BarChart3, FileText } from 'lucide-react'

// Loading skeleton component
const QuickActionsSkeleton = () => (
  <section className="bg-muted/50 rounded-2xl p-6">
    <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  </section>
)

// Main quick actions component
const QuickActionsComponent = memo(() => (
  <section className="bg-muted/50 rounded-2xl p-6">
    <h3 className="text-xl font-semibold mb-4">빠른 작업</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button className="h-auto p-4 flex-col gap-2" variant="outline" asChild>
        <Link href="/projects/new">
          <Calculator className="h-6 w-6" />
          <span className="text-sm">새 프로젝트</span>
        </Link>
      </Button>
      <Button className="h-auto p-4 flex-col gap-2" variant="outline" asChild>
        <Link href="/contacts">
          <Users className="h-6 w-6" />
          <span className="text-sm">컨택 입력</span>
        </Link>
      </Button>
      <Button className="h-auto p-4 flex-col gap-2" variant="outline" asChild>
        <Link href="/feed">
          <BarChart3 className="h-6 w-6" />
          <span className="text-sm">피드 입력</span>
        </Link>
      </Button>
      <Button className="h-auto p-4 flex-col gap-2" variant="outline" asChild>
        <Link href="/settlements">
          <FileText className="h-6 w-6" />
          <span className="text-sm">정산 생성</span>
        </Link>
      </Button>
    </div>
  </section>
))
QuickActionsComponent.displayName = 'QuickActionsComponent'

// Lazy-loaded wrapper with Suspense
export const LazyQuickActions = () => (
  <Suspense fallback={<QuickActionsSkeleton />}>
    <QuickActionsComponent />
  </Suspense>
)