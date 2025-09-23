'use client'

import { MZSQuickLoggerFAB } from '@/components/fab/quick-logger-fab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, Database, Smartphone, Monitor } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function TestFABPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Online/offline simulation
  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
    // Simulate browser online/offline events
    if (typeof window !== 'undefined') {
      const event = new Event(isOnline ? 'offline' : 'online')
      window.dispatchEvent(event)
    }
  }

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MZS Quick Logger FAB 테스트
          </h1>
          <p className="text-gray-600">
            오프라인/온라인 기능을 테스트해보세요
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-500" />
                )}
                연결 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge
                  variant={isOnline ? "secondary" : "outline"}
                  className={isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                >
                  {isOnline ? '온라인' : '오프라인'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleOnlineStatus}
                >
                  {isOnline ? '오프라인으로' : '온라인으로'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Device Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {isMobile ? (
                  <Smartphone className="h-4 w-4 text-blue-600" />
                ) : (
                  <Monitor className="h-4 w-4 text-blue-600" />
                )}
                기기 유형
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800"
              >
                {isMobile ? '모바일' : '데스크톱'}
              </Badge>
            </CardContent>
          </Card>

          {/* Data Source */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-600" />
                데이터 소스
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-800"
              >
                Mock API
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>사용 방법</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm mb-2">1. FAB 열기</h3>
              <p className="text-sm text-gray-600">
                우측 하단의 주황색 플로팅 버튼을 클릭하여 빠른 로거를 열어보세요.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">2. 멤버 선택</h3>
              <p className="text-sm text-gray-600">
                드롭다운에서 멤버를 선택하세요. 오유택, 이예천, 김연지 등이 포함되어 있습니다.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">3. 빠른 액션 테스트</h3>
              <p className="text-sm text-gray-600">
                컨택1000, 상담1000, 가이드2000, 피드 버튼들을 눌러 로그를 기록해보세요.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-2">4. 오프라인 기능 테스트</h3>
              <p className="text-sm text-gray-600">
                위의 "오프라인으로" 버튼을 눌러 오프라인 상태로 만든 후, 로그를 기록해보세요.
                다시 온라인으로 전환하면 자동으로 동기화됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>주요 기능</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">오프라인 지원</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• LocalStorage에 오프라인 로그 저장</li>
                  <li>• 온라인 복귀 시 자동 동기화</li>
                  <li>• 재시도 로직 (최대 3회)</li>
                  <li>• 실패한 요청 시각적 표시</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">사용자 경험</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 반응형 모바일 디자인</li>
                  <li>• 스크롤 시 FAB 자동 숨김</li>
                  <li>• 실시간 상태 표시</li>
                  <li>• Toast 알림으로 피드백</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MZS Quick Logger FAB */}
      <MZSQuickLoggerFAB
        show={true}
        position="bottom-right"
        size="md"
        hideOnScroll={true}
      />
    </div>
  )
}