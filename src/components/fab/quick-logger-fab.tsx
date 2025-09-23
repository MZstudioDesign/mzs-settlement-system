'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  Plus,
  X,
  MessageSquare,
  Users,
  Star,
  PhoneCall,
  BookOpen,
  WifiOff,
  Wifi,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { useOfflineLogger, QUICK_ACTIONS, type QuickLogAction } from "@/hooks/use-offline-logger"
import { supportingDataApi } from "@/lib/api"
import type { Member } from "@/types/database"
import { toast } from "sonner"

interface MZSQuickLoggerFABProps {
  /**
   * Whether to show the FAB (typically only when user is logged in)
   */
  show?: boolean

  /**
   * Position of the FAB
   */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'

  /**
   * Size of the FAB
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Hide on scroll
   */
  hideOnScroll?: boolean

  /**
   * Custom className
   */
  className?: string
}

// Map action types to icons
const actionIcons = {
  INCOMING: PhoneCall,
  CHAT: MessageSquare,
  GUIDE: BookOpen,
  BELOW3: Star,
  GTE3: Star,
}

// Map action types to colors
const actionColors = {
  INCOMING: 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200',
  CHAT: 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200',
  GUIDE: 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200',
  BELOW3: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border-yellow-200',
  GTE3: 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200',
}

export function MZSQuickLoggerFAB({
  show = true,
  position = 'bottom-right',
  size = 'md',
  hideOnScroll = true,
  className
}: MZSQuickLoggerFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [members, setMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const {
    pendingCount,
    isOnline,
    isLoading: isSyncing,
    addOfflineLog,
    syncOfflineLogs,
    getUnsyncedLogs
  } = useOfflineLogger()

  // Load members when component mounts
  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setIsLoadingMembers(true)
    try {
      const response = await supportingDataApi.getMembers()
      if (response.data) {
        setMembers(response.data)
        // Auto-select first member if none selected
        if (response.data.length > 0 && !selectedMember) {
          setSelectedMember(response.data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load members:', error)
      toast.error('멤버 목록을 불러올 수 없습니다')
    } finally {
      setIsLoadingMembers(false)
    }
  }

  // Scroll handling
  useEffect(() => {
    if (!hideOnScroll) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
        setIsOpen(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, hideOnScroll])

  // Handle quick action
  const handleQuickAction = async (action: QuickLogAction) => {
    if (!selectedMember) {
      toast.error('멤버를 먼저 선택해주세요')
      return
    }

    setActionInProgress(action.subtype)

    try {
      const success = await addOfflineLog(action, selectedMember)

      if (success) {
        if (isOnline) {
          toast.success(`${action.label} 로그가 성공적으로 기록되었습니다`)
        } else {
          toast.success(`${action.label} 로그가 오프라인으로 저장되었습니다`)
        }
      } else {
        toast.error(`${action.label} 로그 기록에 실패했습니다`)
      }
    } catch (error) {
      console.error('Quick action failed:', error)
      toast.error('로그 기록 중 오류가 발생했습니다')
    } finally {
      setActionInProgress(null)
    }
  }

  // Size configurations
  const sizeConfig = {
    sm: {
      main: 'h-12 w-12',
      icon: 'h-5 w-5',
    },
    md: {
      main: 'h-14 w-14',
      icon: 'h-6 w-6',
    },
    lg: {
      main: 'h-16 w-16',
      icon: 'h-7 w-7',
    }
  }

  const positionConfig = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  if (!show) return null

  const config = sizeConfig[size]
  const selectedMemberData = members.find(m => m.id === selectedMember)
  const unsyncedLogs = getUnsyncedLogs()

  return (
    <div className={cn(
      "fixed z-50 transition-all duration-300",
      positionConfig[position],
      !isVisible && "translate-y-20 opacity-0",
      className
    )}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            className={cn(
              config.main,
              "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
              "bg-[#f68b1f] hover:bg-[#e57a0e] text-white",
              "focus-visible:ring-2 focus-visible:ring-[#f68b1f] focus-visible:ring-offset-2"
            )}
            aria-label="빠른 로거 열기"
          >
            <div className="relative">
              <Plus className={config.icon} />

              {/* Pending count badge */}
              {pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </Badge>
              )}

              {/* Online/Offline indicator */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                isOnline ? "bg-green-500" : "bg-gray-400"
              )}>
                {isOnline ? (
                  <Wifi className="w-2 h-2 text-white" />
                ) : (
                  <WifiOff className="w-2 h-2 text-white" />
                )}
              </div>
            </div>
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-auto max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#f68b1f]" />
              빠른 로거
              {!isOnline && (
                <Badge variant="secondary" className="text-xs">
                  <WifiOff className="w-3 h-3 mr-1" />
                  오프라인
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 pb-4">
            {/* Member Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  멤버 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedMember}
                  onValueChange={setSelectedMember}
                  disabled={isLoadingMembers}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="멤버를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-xs text-muted-foreground">({member.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedMemberData && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    선택된 멤버: <span className="font-medium text-foreground">{selectedMemberData.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">빠른 액션</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {QUICK_ACTIONS.map((action) => {
                    const IconComponent = actionIcons[action.subtype as keyof typeof actionIcons]
                    const isInProgress = actionInProgress === action.subtype
                    const colorClass = actionColors[action.subtype as keyof typeof actionColors]

                    return (
                      <Button
                        key={`${action.type}-${action.subtype}`}
                        variant="outline"
                        className={cn(
                          "justify-start h-auto p-4 border-2",
                          colorClass,
                          isInProgress && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => handleQuickAction(action)}
                        disabled={!selectedMember || isInProgress}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5" />
                            <div className="text-left">
                              <div className="font-medium">{action.label}</div>
                              <div className="text-xs opacity-70">
                                {action.amount.toLocaleString()}원
                              </div>
                            </div>
                          </div>
                          {isInProgress && (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Status Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  상태 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Online/Offline Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">연결 상태</span>
                  <div className="flex items-center gap-1">
                    {isOnline ? (
                      <>
                        <Wifi className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">온라인</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-500">오프라인</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Pending Logs */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">대기 중인 로그</span>
                  <div className="flex items-center gap-1">
                    {pendingCount > 0 ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-600">{pendingCount}개</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">모두 동기화됨</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Sync Status */}
                {isSyncing && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">동기화 상태</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium text-blue-600">동기화 중...</span>
                    </div>
                  </div>
                )}

                {/* Manual Sync Button */}
                {isOnline && pendingCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={syncOfflineLogs}
                    disabled={isSyncing}
                  >
                    {isSyncing ? '동기화 중...' : '수동 동기화'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Unsynced Logs List */}
            {unsyncedLogs.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">대기 중인 로그</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {unsyncedLogs.slice(0, 5).map((log) => {
                      const action = QUICK_ACTIONS.find(a =>
                        a.type === log.type &&
                        (log.type === 'contact' ? a.subtype === (log.data as any).contact_type : a.subtype === (log.data as any).feed_type)
                      )
                      const member = members.find(m => m.id === (log.data as any).member_id)

                      return (
                        <div key={log.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded text-xs">
                          <div>
                            <span className="font-medium">{action?.label}</span>
                            <span className="text-muted-foreground ml-1">- {member?.name}</span>
                          </div>
                          <div className="text-muted-foreground">
                            재시도 {log.retryCount}/3
                          </div>
                        </div>
                      )
                    })}
                    {unsyncedLogs.length > 5 && (
                      <div className="text-center text-xs text-muted-foreground pt-1">
                        +{unsyncedLogs.length - 5}개 더
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}