'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Users,
  DollarSign,
  Calendar,
  TrendingDown,
  ArrowLeft,
  FileText,
  Download,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { PaymentManager } from '@/components/settlement/payment-manager'
import { UnpaidSummaryCard } from '@/components/dashboard/unpaid-summary'
import {
  getUnpaidSummary,
  getUnpaidStatsByMonth,
  type UnpaidSummary
} from '@/lib/unpaid-tracker'
import { toKRW } from '@/lib/currency'

export default function UnpaidManagementPage() {
  const [summary, setSummary] = useState<UnpaidSummary | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<Array<{
    ym: string
    totalAmount: number
    totalCount: number
    memberCount: number
  }>>([])
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [summaryData, monthlyData] = await Promise.all([
        getUnpaidSummary(),
        getUnpaidStatsByMonth()
      ])
      setSummary(summaryData)
      setMonthlyStats(monthlyData)
    } catch (error) {
      console.error('미지급 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMemberSelect = (memberId: string) => {
    setSelectedMember(memberId)
  }

  if (loading) {
    return (
      <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settlements">
                <ArrowLeft className="h-4 w-4 mr-2" />
                정산 관리로 돌아가기
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="animate-pulse space-y-4">
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="animate-pulse space-y-4">
                <div className="h-96 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* 네비게이션 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settlements">
              <ArrowLeft className="h-4 w-4 mr-2" />
              정산 관리로 돌아가기
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSV 내보내기
            </Button>
          </div>
        </div>

        {summary && summary.totalUnpaidAmount === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              모든 정산이 완료되었습니다! 🎉
            </h2>
            <p className="text-muted-foreground mb-6">
              현재 미지급 항목이 없습니다
            </p>
            <Button asChild>
              <Link href="/settlements">
                정산 관리로 돌아가기
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 사이드바 - 요약 및 멤버 목록 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 미지급 요약 */}
              <UnpaidSummaryCard compact={false} />

              {/* 월별 미지급 통계 */}
              {monthlyStats.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 text-primary" />
                      월별 미지급 현황
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {monthlyStats.slice(0, 6).map((stat) => (
                      <div key={stat.ym} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium">{stat.ym}</div>
                          <div className="text-xs text-muted-foreground">
                            {stat.memberCount}명 • {stat.totalCount}건
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-orange-600">
                            {toKRW(stat.totalAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 멤버 선택 */}
              {summary && summary.unpaidByMember.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-5 w-5 text-primary" />
                      멤버별 미지급
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {summary.unpaidByMember.map((member) => (
                      <button
                        key={member.memberId}
                        onClick={() => handleMemberSelect(member.memberId)}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
                          selectedMember === member.memberId
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {member.memberCode}
                            </Badge>
                            <span className="font-medium text-sm">
                              {member.memberName}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-orange-600">
                              {toKRW(member.unpaidAmount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.unpaidCount}건
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 메인 콘텐츠 - 미지급 항목 관리 */}
            <div className="lg:col-span-2">
              {selectedMember ? (
                <PaymentManager
                  memberId={selectedMember}
                  compact={false}
                />
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="h-5 w-5 text-primary" />
                      지급 관리
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        멤버를 선택하세요
                      </h3>
                      <p className="text-muted-foreground">
                        왼쪽 목록에서 미지급 항목을 관리할 멤버를 선택하세요
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
    </div>
  )
}