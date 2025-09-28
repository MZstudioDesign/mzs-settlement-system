'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { FloatingActionButton, type FABAction } from './floating-action-button'
import {
  MessageSquare,
  Phone,
  FileText,
  Star,
  ChevronUp,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  addQuickContact,
  addQuickFeed,
  getOfflineStats,
  isOnline,
  addNetworkListener,
  syncWithServer
} from '@/lib/offline-sync'

interface QuickLoggerFABProps {
  // 멤버 목록 (실제 구현시 API에서 가져올 데이터)
  members?: Array<{ id: string; name: string; code: string }>
  // 동기화 함수들 (실제 API 호출)
  onSyncContact?: (entry: any) => Promise<boolean>
  onSyncFeed?: (entry: any) => Promise<boolean>
  className?: string
}

export function QuickLoggerFAB({
  members = [
    { id: '1', name: '오유택', code: 'OY' },
    { id: '2', name: '이예천', code: 'LE' },
    { id: '3', name: '김연지', code: 'KY' },
    { id: '4', name: '김하늘', code: 'KH' },
    { id: '5', name: '이정수', code: 'IJ' },
    { id: '6', name: '박지윤', code: 'PJ' }
  ],
  onSyncContact,
  onSyncFeed,
  className
}: QuickLoggerFABProps) {
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [isOnlineStatus, setIsOnlineStatus] = useState(isOnline())
  const [offlineStats, setOfflineStats] = useState(getOfflineStats())
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // 네트워크 상태 모니터링
  useEffect(() => {
    const removeListener = addNetworkListener((online) => {
      setIsOnlineStatus(online)

      if (online) {
        toast.success('온라인 연결됨', {
          description: '저장된 데이터를 동기화합니다'
        })
        handleAutoSync()
      } else {
        toast.warning('오프라인 모드', {
          description: '데이터는 로컬에 저장되며 온라인 시 동기화됩니다'
        })
      }
    })

    return removeListener
  }, [])

  // 오프라인 통계 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setOfflineStats(getOfflineStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 자동 동기화
  const handleAutoSync = async () => {
    if (!isOnlineStatus || !onSyncContact || !onSyncFeed) return

    setIsSyncing(true)
    try {
      const result = await syncWithServer(onSyncContact, onSyncFeed)

      if (result.success > 0) {
        toast.success(`${result.success}건 동기화 완료`)
      }

      if (result.failed > 0) {
        toast.error(`${result.failed}건 동기화 실패`)
      }
    } catch (error) {
      console.error('Auto sync failed:', error)
      toast.error('동기화 중 오류 발생')
    } finally {
      setIsSyncing(false)
      setOfflineStats(getOfflineStats())
    }
  }

  // 컨택 빠른 입력
  const handleQuickContact = (eventType: 'INCOMING' | 'CHAT' | 'GUIDE') => {
    if (!selectedMember) {
      toast.error('멤버를 선택해주세요')
      return
    }

    const member = members.find(m => m.id === selectedMember)
    const entryId = addQuickContact(selectedMember, eventType)

    const eventLabels = {
      INCOMING: '유입',
      CHAT: '상담',
      GUIDE: '가이드'
    }

    const amounts = {
      INCOMING: '1,000원',
      CHAT: '1,000원',
      GUIDE: '2,000원'
    }

    if (isOnlineStatus) {
      toast.success(`${eventLabels[eventType]} 입력 완료`, {
        description: `${member?.name} - ${amounts[eventType]}`
      })
      // 온라인 상태라면 즉시 동기화 시도
      handleAutoSync()
    } else {
      toast.warning(`${eventLabels[eventType]} 입력 (오프라인)`, {
        description: `${member?.name} - ${amounts[eventType]} (로컬 저장됨)`
      })
    }

    setOfflineStats(getOfflineStats())
  }

  // 피드 빠른 입력
  const handleQuickFeed = (feeType: 'BELOW3' | 'GTE3') => {
    if (!selectedMember) {
      toast.error('멤버를 선택해주세요')
      return
    }

    const member = members.find(m => m.id === selectedMember)
    const entryId = addQuickFeed(selectedMember, feeType)

    const feeLabels = {
      BELOW3: '피드 3개 미만',
      GTE3: '피드 3개 이상'
    }

    const amounts = {
      BELOW3: '400원',
      GTE3: '1,000원'
    }

    if (isOnlineStatus) {
      toast.success(`${feeLabels[feeType]} 입력 완료`, {
        description: `${member?.name} - ${amounts[feeType]}`
      })
      // 온라인 상태라면 즉시 동기화 시도
      handleAutoSync()
    } else {
      toast.warning(`${feeLabels[feeType]} 입력 (오프라인)`, {
        description: `${member?.name} - ${amounts[feeType]} (로컬 저장됨)`
      })
    }

    setOfflineStats(getOfflineStats())
  }

  // FAB 액션 정의
  const actions: FABAction[] = [
    {
      id: 'contact-incoming',
      label: '유입 1000',
      icon: Phone,
      onClick: () => handleQuickContact('INCOMING'),
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
      disabled: !selectedMember
    },
    {
      id: 'contact-chat',
      label: '상담 1000',
      icon: MessageSquare,
      onClick: () => handleQuickContact('CHAT'),
      color: 'bg-green-50 hover:bg-green-100 text-green-600',
      disabled: !selectedMember
    },
    {
      id: 'contact-guide',
      label: '가이드 2000',
      icon: FileText,
      onClick: () => handleQuickContact('GUIDE'),
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
      disabled: !selectedMember
    },
    {
      id: 'feed-below3',
      label: '피드 3개 미만(400)',
      icon: Star,
      onClick: () => handleQuickFeed('BELOW3'),
      color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600',
      disabled: !selectedMember
    },
    {
      id: 'feed-gte3',
      label: '피드 3개 이상(1000)',
      icon: Star,
      onClick: () => handleQuickFeed('GTE3'),
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-600',
      disabled: !selectedMember
    }
  ]

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 md:hidden", className)} data-testid="mobile-fab">
      {/* 멤버 선택 패널 (확장 시에만 표시) */}
      {isExpanded && (
        <div className="mb-4 bg-white rounded-2xl shadow-lg border p-4 w-80">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">멤버 선택</Label>
              <div className="flex items-center gap-2">
                {isOnlineStatus ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  isOnlineStatus ? "text-green-600" : "text-red-600"
                )}>
                  {isOnlineStatus ? '온라인' : '오프라인'}
                </span>
              </div>
            </div>

            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="멤버를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} ({member.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 오프라인 데이터 상태 */}
            {offlineStats.unsynced > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span className="text-amber-600">
                    {offlineStats.unsynced}건 동기화 대기
                  </span>
                </div>
                {isOnlineStatus && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAutoSync}
                    disabled={isSyncing}
                    className="h-6 px-2 text-xs"
                  >
                    {isSyncing ? '동기화 중...' : '동기화'}
                  </Button>
                )}
              </div>
            )}

            {offlineStats.synced > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>{offlineStats.synced}건 동기화 완료</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB 컴포넌트 */}
      <FloatingActionButton
        actions={actions}
        mainIcon={ChevronUp}
        position="bottom-right"
        size="md"
        hideOnScroll={false}
        expandDirection="up"
        className="transition-all duration-300"
      />

      {/* 동기화 상태 뱃지 */}
      {offlineStats.unsynced > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -left-2 h-6 w-6 flex items-center justify-center p-0 text-xs animate-pulse"
        >
          {offlineStats.unsynced > 99 ? '99+' : offlineStats.unsynced}
        </Badge>
      )}
    </div>
  )
}