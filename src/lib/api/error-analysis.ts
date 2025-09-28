/**
 * Network Error Analysis and Mock Guard System
 * 네트워크 오류 분석 및 목업 가드 시스템
 */

export interface NetworkError {
  type: 'timeout' | 'connection' | 'server' | 'client' | 'validation'
  statusCode?: number
  url: string
  method: string
  timestamp: number
  message: string
  stack?: string
  requestData?: any
  responseData?: any
}

export interface ErrorPattern {
  pattern: RegExp
  type: NetworkError['type']
  suggestion: string
  mockResponse?: any
}

// 에러 로그 저장소
const errorLog: NetworkError[] = []

// 400 에러 패턴 분석
const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /\/api\/supporting-data/,
    type: 'validation',
    suggestion: 'supporting-data API에 유효하지 않은 type 파라미터가 전달됨',
    mockResponse: {
      data: {
        members: [],
        channels: [],
        categories: []
      }
    }
  },
  {
    pattern: /\/api\/projects/,
    type: 'validation',
    suggestion: 'projects API에 필수 필드가 누락되거나 잘못된 형식의 데이터가 전달됨',
    mockResponse: {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    }
  },
  {
    pattern: /\/api\/settlements/,
    type: 'validation',
    suggestion: 'settlements API에 잘못된 정산 데이터가 전달됨',
    mockResponse: {
      data: [],
      error: null
    }
  },
  {
    pattern: /\/_next\/static\/chunks/,
    type: 'client',
    suggestion: 'Next.js 청크 로딩 실패 - 빌드 캐시 문제일 가능성',
    mockResponse: null
  }
]

// 에러 분석 함수
export function analyzeError(error: NetworkError): {
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  possibleCauses: string[]
  solutions: string[]
  mockData?: any
} {
  // 패턴 매칭
  const matchedPattern = ERROR_PATTERNS.find(pattern =>
    pattern.pattern.test(error.url)
  )

  // 에러 로그에 추가
  errorLog.push(error)

  // 로그 크기 제한 (최대 100개)
  if (errorLog.length > 100) {
    errorLog.shift()
  }

  // 400 에러 상세 분석
  if (error.statusCode === 400) {
    return analyze400Error(error, matchedPattern)
  }

  // 타임아웃 에러 분석
  if (error.type === 'timeout') {
    return {
      category: 'Performance',
      severity: 'medium',
      possibleCauses: [
        '서버 응답 지연',
        '네트워크 연결 불안정',
        '대용량 데이터 처리'
      ],
      solutions: [
        '요청 타임아웃 시간 조정',
        '페이지네이션 구현',
        '로딩 상태 표시 개선'
      ]
    }
  }

  // 일반 에러 분석
  return {
    category: 'General',
    severity: 'medium',
    possibleCauses: ['네트워크 연결 문제', '서버 일시적 장애'],
    solutions: ['재시도 로직 구현', '오프라인 모드 지원']
  }
}

// 400 에러 상세 분석
function analyze400Error(error: NetworkError, pattern?: ErrorPattern) {
  const analysis = {
    category: 'Validation',
    severity: 'high' as const,
    possibleCauses: [] as string[],
    solutions: [] as string[],
    mockData: pattern?.mockResponse
  }

  // URL별 상세 분석
  if (error.url.includes('/api/supporting-data')) {
    analysis.possibleCauses = [
      'type 파라미터가 유효하지 않음 (members, channels, categories, all만 허용)',
      'URL 파라미터 형식 오류',
      'API 호출 시점 문제'
    ]
    analysis.solutions = [
      'API 호출 전 파라미터 유효성 검증',
      'type 파라미터 기본값 설정',
      '에러 핸들링 및 목업 데이터 폴백'
    ]
  } else if (error.url.includes('/api/projects')) {
    analysis.possibleCauses = [
      '필수 필드 누락 (name, channel_id, gross_amount, designers)',
      '잘못된 데이터 타입',
      'designers 배열이 비어있음'
    ]
    analysis.solutions = [
      '프론트엔드 폼 유효성 검증 강화',
      'TypeScript 타입 정의 활용',
      '서버 에러 메시지 상세화'
    ]
  }

  return analysis
}

// 목업 가드 시스템
export class MockGuard {
  private static instance: MockGuard
  private mockEnabled = process.env.NODE_ENV === 'development'
  private failureThreshold = 3 // 연속 실패 임계값

  static getInstance(): MockGuard {
    if (!MockGuard.instance) {
      MockGuard.instance = new MockGuard()
    }
    return MockGuard.instance
  }

  // API 요청 래퍼
  async guardedRequest<T>(
    url: string,
    options: RequestInit = {},
    mockData?: T
  ): Promise<T> {
    const method = options.method || 'GET'
    const startTime = Date.now()

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // 성공적인 응답 로깅
      this.logSuccess(url, method, Date.now() - startTime)

      return data
    } catch (error) {
      // 에러 로깅 및 분석
      const networkError: NetworkError = {
        type: this.classifyError(error),
        statusCode: this.extractStatusCode(error),
        url,
        method,
        timestamp: Date.now(),
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestData: options.body ? JSON.parse(options.body as string) : undefined
      }

      const analysis = analyzeError(networkError)
      console.error('🚨 Network Error Analysis:', {
        error: networkError,
        analysis
      })

      // 목업 데이터 반환 조건 확인
      if (this.shouldUseMockData(networkError, analysis)) {
        console.warn('🔄 Using mock data fallback for:', url)
        return this.getMockResponse(url, mockData, analysis.mockData)
      }

      throw error
    }
  }

  // 에러 분류
  private classifyError(error: any): NetworkError['type'] {
    const message = String(error.message).toLowerCase()

    if (message.includes('timeout')) return 'timeout'
    if (message.includes('network') || message.includes('connection')) return 'connection'
    if (message.includes('400') || message.includes('validation')) return 'validation'
    if (message.includes('500') || message.includes('502') || message.includes('503')) return 'server'

    return 'client'
  }

  // 상태 코드 추출
  private extractStatusCode(error: any): number | undefined {
    const message = String(error.message)
    const match = message.match(/HTTP (\d{3})/)
    return match ? parseInt(match[1]) : undefined
  }

  // 목업 데이터 사용 여부 결정
  private shouldUseMockData(error: NetworkError, analysis: any): boolean {
    if (!this.mockEnabled) return false

    // 개발 환경에서만 목업 사용
    return process.env.NODE_ENV === 'development' && (
      error.statusCode === 400 ||
      error.type === 'timeout' ||
      error.type === 'connection' ||
      analysis.mockData !== undefined
    )
  }

  // 목업 응답 생성
  private getMockResponse<T>(url: string, mockData?: T, patternMockData?: any): T {
    // 명시적 목업 데이터가 있으면 사용
    if (mockData) return mockData

    // 패턴 매칭 목업 데이터가 있으면 사용
    if (patternMockData) return patternMockData

    // 기본 목업 데이터 생성
    return this.generateDefaultMockData(url) as T
  }

  // 기본 목업 데이터 생성
  private generateDefaultMockData(url: string): any {
    if (url.includes('/api/supporting-data')) {
      return {
        data: {
          members: [
            { id: 'mock-1', name: '목업 멤버 1', code: 'M1', active: true },
            { id: 'mock-2', name: '목업 멤버 2', code: 'M2', active: true }
          ],
          channels: [
            { id: 'mock-1', name: '목업 채널 1', active: true },
            { id: 'mock-2', name: '목업 채널 2', active: true }
          ],
          categories: [
            { id: 'mock-1', name: '목업 카테고리 1', active: true },
            { id: 'mock-2', name: '목업 카테고리 2', active: true }
          ]
        }
      }
    }

    if (url.includes('/api/projects')) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    }

    return { data: null, error: 'Mock response generated' }
  }

  // 성공 로깅
  private logSuccess(url: string, method: string, duration: number) {
    if (duration > 1000) {
      console.warn(`🐌 Slow request: ${method} ${url} (${duration}ms)`)
    }
  }
}

// 에러 통계 조회
export function getErrorStats() {
  const now = Date.now()
  const lastHour = now - (60 * 60 * 1000)
  const recentErrors = errorLog.filter(error => error.timestamp > lastHour)

  const errorsByType = recentErrors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const errorsByUrl = recentErrors.reduce((acc, error) => {
    const key = error.url.split('?')[0] // 쿼리 파라미터 제외
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalErrors: errorLog.length,
    recentErrors: recentErrors.length,
    errorsByType,
    errorsByUrl,
    mostCommonError: Object.entries(errorsByUrl)
      .sort(([,a], [,b]) => b - a)[0]?.[0],
    recommendations: generateRecommendations(recentErrors)
  }
}

// 개선 권장사항 생성
function generateRecommendations(errors: NetworkError[]): string[] {
  const recommendations: string[] = []

  // 400 에러가 많은 경우
  const validationErrors = errors.filter(e => e.statusCode === 400).length
  if (validationErrors > 3) {
    recommendations.push('API 요청 데이터 유효성 검증 강화 필요')
    recommendations.push('프론트엔드 폼 검증 로직 개선')
  }

  // 타임아웃 에러가 많은 경우
  const timeoutErrors = errors.filter(e => e.type === 'timeout').length
  if (timeoutErrors > 2) {
    recommendations.push('API 응답 성능 최적화 필요')
    recommendations.push('클라이언트 타임아웃 설정 조정')
  }

  // 특정 API 에러가 집중된 경우
  const apiErrors = errors.filter(e => e.url.includes('/api/')).length
  if (apiErrors > errors.length * 0.7) {
    recommendations.push('백엔드 API 안정성 점검 필요')
    recommendations.push('API 에러 핸들링 개선')
  }

  return recommendations
}

// 싱글톤 인스턴스 내보내기
export const mockGuard = MockGuard.getInstance()