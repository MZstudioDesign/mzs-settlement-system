/**
 * CSV 내보내기 및 ETL 기능
 * 지침서 요구사항: CSV 템플릿을 사용한 ETL, 정산 결과 CSV/PDF 내보내기
 */

// CSV 헤더 정의
export const CSV_HEADERS = {
  projects: [
    'work_date',
    'settle_date',
    'client_name',
    'channel_name',
    'category_code',
    'title',
    'qty',
    'deposit_gross_T',
    'discount_net',
    'invoice_requested',
    'designers_json',
    'notes',
    'status'
  ],
  contacts: [
    'date',
    'member_code',
    'event_type',
    'project_title',
    'amount',
    'notes'
  ],
  feed_logs: [
    'date',
    'member_code',
    'fee_type',
    'amount',
    'notes'
  ],
  team_tasks: [
    'date',
    'member_code',
    'project_title',
    'amount',
    'notes'
  ]
} as const

/**
 * 데이터를 CSV 문자열로 변환
 */
export function convertToCSV(data: Array<Record<string, any>>, headers: string[]): string {
  if (data.length === 0) {
    return headers.join(',') + '\n'
  }

  // 헤더 라인
  const csvLines = [headers.join(',')]

  // 데이터 라인들
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header]

      // null, undefined 처리
      if (value === null || value === undefined) {
        return ''
      }

      // 객체나 배열은 JSON 문자열로 변환
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      }

      // 문자열에 콤마나 따옴표가 있으면 따옴표로 감싸기
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }

      return stringValue
    })

    csvLines.push(values.join(','))
  })

  return csvLines.join('\n')
}

/**
 * CSV 파일 다운로드
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // BOM 추가 (Excel에서 한글 깨짐 방지)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * 프로젝트 데이터를 CSV로 내보내기
 */
export function exportProjectsToCSV(
  projects: Array<any>,
  channels: Record<string, any>,
  categories: Record<string, any>,
  members: Record<string, any>
): string {
  const csvData = projects.map(project => ({
    work_date: project.project_date || '',
    settle_date: project.payment_date || '',
    client_name: project.name || '',
    channel_name: channels[project.channel_id]?.name || '',
    category_code: categories[project.category_id]?.code || '',
    title: project.name || '',
    qty: 1,
    deposit_gross_T: project.gross_amount || 0,
    discount_net: project.discount_net || 0,
    invoice_requested: project.invoice_requested ? 'Y' : 'N',
    designers_json: JSON.stringify(project.designers || []),
    notes: project.notes || '',
    status: project.status || 'PENDING'
  }))

  return convertToCSV(csvData, CSV_HEADERS.projects)
}

/**
 * 컨택 데이터를 CSV로 내보내기
 */
export function exportContactsToCSV(
  contacts: Array<any>,
  members: Record<string, any>,
  projects: Record<string, any>
): string {
  const csvData = contacts.map(contact => ({
    date: contact.date || '',
    member_code: members[contact.member_id]?.code || '',
    event_type: contact.event_type || '',
    project_title: contact.project_id ? (projects[contact.project_id]?.name || '') : '',
    amount: contact.amount || 0,
    notes: contact.notes || ''
  }))

  return convertToCSV(csvData, CSV_HEADERS.contacts)
}

/**
 * 피드 데이터를 CSV로 내보내기
 */
export function exportFeedLogsToCSV(
  feedLogs: Array<any>,
  members: Record<string, any>
): string {
  const csvData = feedLogs.map(feed => ({
    date: feed.date || '',
    member_code: members[feed.member_id]?.code || '',
    fee_type: feed.fee_type || '',
    amount: feed.amount || 0,
    notes: feed.notes || ''
  }))

  return convertToCSV(csvData, CSV_HEADERS.feed_logs)
}

/**
 * 팀 업무 데이터를 CSV로 내보내기
 */
export function exportTeamTasksToCSV(
  teamTasks: Array<any>,
  members: Record<string, any>,
  projects: Record<string, any>
): string {
  const csvData = teamTasks.map(task => ({
    date: task.date || '',
    member_code: members[task.member_id]?.code || '',
    project_title: task.project_id ? (projects[task.project_id]?.name || '') : '',
    amount: task.amount || 0,
    notes: task.notes || ''
  }))

  return convertToCSV(csvData, CSV_HEADERS.team_tasks)
}

/**
 * 정산 결과를 CSV로 내보내기 (지침서 요구사항)
 */
export function exportSettlementToCSV(
  settlementItems: Array<any>,
  members: Record<string, any>,
  settlement: { ym: string; note?: string }
): string {
  const headers = [
    '정산월',
    '멤버코드',
    '멤버명',
    '소스유형',
    '총입금(T)',
    '실입금(B)',
    '할인금액',
    '광고수수료',
    '프로그램수수료',
    '채널수수료',
    '디자이너기본',
    '디자이너금액',
    '디자이너보너스',
    '컨택금액',
    '피드금액',
    '팀업무금액',
    '마일리지금액',
    '원천징수전',
    '원천징수액',
    '원천징수후',
    '지급여부',
    '지급일',
    '메모'
  ]

  const csvData = settlementItems.map(item => ({
    '정산월': settlement.ym,
    '멤버코드': members[item.member_id]?.code || '',
    '멤버명': members[item.member_id]?.name || '',
    '소스유형': item.source_type || '',
    '총입금(T)': item.gross_T || 0,
    '실입금(B)': item.net_B || 0,
    '할인금액': item.discount_net || 0,
    '광고수수료': item.ad_fee || 0,
    '프로그램수수료': item.program_fee || 0,
    '채널수수료': item.channel_fee || 0,
    '디자이너기본': item.designer_base || 0,
    '디자이너금액': item.designer_amount || 0,
    '디자이너보너스': item.designer_bonus_amount || 0,
    '컨택금액': item.contact_amount || 0,
    '피드금액': item.feed_amount || 0,
    '팀업무금액': item.team_amount || 0,
    '마일리지금액': item.mileage_amount || 0,
    '원천징수전': item.amount_before_withholding || 0,
    '원천징수액': item.withholding_3_3 || 0,
    '원천징수후': item.amount_after_withholding || 0,
    '지급여부': item.paid ? 'Y' : 'N',
    '지급일': item.paid_date || '',
    '메모': item.memo || ''
  }))

  return convertToCSV(csvData, headers)
}

/**
 * 멤버별 정산 요약을 CSV로 내보내기
 */
export function exportMemberSettlementSummaryToCSV(
  settlementItems: Array<any>,
  members: Record<string, any>,
  settlement: { ym: string; note?: string }
): string {
  // 멤버별로 그룹화
  const memberGroups = settlementItems.reduce((acc, item) => {
    const memberId = item.member_id
    if (!acc[memberId]) {
      acc[memberId] = []
    }
    acc[memberId].push(item)
    return acc
  }, {} as Record<string, any[]>)

  const headers = [
    '정산월',
    '멤버코드',
    '멤버명',
    '프로젝트수',
    '총디자인금액',
    '총컨택금액',
    '총피드금액',
    '총팀업무금액',
    '총마일리지금액',
    '원천징수전합계',
    '원천징수액합계',
    '실지급액합계',
    '지급완료건수',
    '미지급건수'
  ]

  const csvData = Object.entries(memberGroups).map(([memberId, items]) => {
    const member = members[memberId]
    const projectItems = items.filter(item => item.source_type === 'project')

    return {
      '정산월': settlement.ym,
      '멤버코드': member?.code || '',
      '멤버명': member?.name || '',
      '프로젝트수': projectItems.length,
      '총디자인금액': items.reduce((sum, item) => sum + (item.designer_amount || 0) + (item.designer_bonus_amount || 0), 0),
      '총컨택금액': items.reduce((sum, item) => sum + (item.contact_amount || 0), 0),
      '총피드금액': items.reduce((sum, item) => sum + (item.feed_amount || 0), 0),
      '총팀업무금액': items.reduce((sum, item) => sum + (item.team_amount || 0), 0),
      '총마일리지금액': items.reduce((sum, item) => sum + (item.mileage_amount || 0), 0),
      '원천징수전합계': items.reduce((sum, item) => sum + (item.amount_before_withholding || 0), 0),
      '원천징수액합계': items.reduce((sum, item) => sum + (item.withholding_3_3 || 0), 0),
      '실지급액합계': items.reduce((sum, item) => sum + (item.amount_after_withholding || 0), 0),
      '지급완료건수': items.filter(item => item.paid).length,
      '미지급건수': items.filter(item => !item.paid).length
    }
  })

  return convertToCSV(csvData, headers)
}

/**
 * 정산 데이터 일괄 내보내기
 */
export function exportAllSettlementData(
  settlement: any,
  settlementItems: Array<any>,
  members: Record<string, any>,
  filename?: string
) {
  const baseFilename = filename || `settlement_${settlement.ym}`

  // 상세 정산 내역
  const detailCSV = exportSettlementToCSV(settlementItems, members, settlement)
  downloadCSV(detailCSV, `${baseFilename}_detail.csv`)

  // 멤버별 요약
  const summaryCSV = exportMemberSettlementSummaryToCSV(settlementItems, members, settlement)
  downloadCSV(summaryCSV, `${baseFilename}_summary.csv`)
}

/**
 * CSV 파일에서 데이터 파싱 (ETL용)
 */
export function parseCSV(csvContent: string, expectedHeaders: string[]): {
  data: Array<Record<string, any>>
  errors: Array<{ row: number; message: string }>
} {
  const lines = csvContent.trim().split('\n')
  const errors: Array<{ row: number; message: string }> = []

  if (lines.length === 0) {
    return { data: [], errors: [{ row: 0, message: 'CSV 파일이 비어있습니다' }] }
  }

  // 헤더 파싱
  const headerLine = lines[0]
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  // 헤더 검증
  const missingHeaders = expectedHeaders.filter(expected => !headers.includes(expected))
  if (missingHeaders.length > 0) {
    errors.push({
      row: 0,
      message: `필수 헤더가 누락되었습니다: ${missingHeaders.join(', ')}`
    })
  }

  const data: Array<Record<string, any>> = []

  // 데이터 라인 파싱
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)

      if (values.length !== headers.length) {
        errors.push({
          row: i + 1,
          message: `컬럼 수가 맞지 않습니다. 예상: ${headers.length}, 실제: ${values.length}`
        })
        continue
      }

      const row: Record<string, any> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })

      data.push(row)
    } catch (error) {
      errors.push({
        row: i + 1,
        message: `파싱 오류: ${error instanceof Error ? error.message : String(error)}`
      })
    }
  }

  return { data, errors }
}

/**
 * CSV 라인 파싱 (따옴표 처리 포함)
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 이스케이프된 따옴표
        current += '"'
        i += 2
      } else {
        // 따옴표 토글
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // 컬럼 구분자
      values.push(current.trim())
      current = ''
      i++
    } else {
      current += char
      i++
    }
  }

  // 마지막 값 추가
  values.push(current.trim())

  return values
}

/**
 * ETL 검증 규칙
 */
export interface ETLValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'date' | 'boolean' | 'json'
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: any) => string | null
}

/**
 * ETL 데이터 검증
 */
export function validateETLData(
  data: Array<Record<string, any>>,
  rules: ETLValidationRule[]
): Array<{ row: number; field: string; message: string }> {
  const errors: Array<{ row: number; field: string; message: string }> = []

  data.forEach((row, index) => {
    rules.forEach(rule => {
      const value = row[rule.field]
      const rowNumber = index + 2 // 헤더 다음부터 시작하므로 +2

      // 필수 필드 검증
      if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push({
          row: rowNumber,
          field: rule.field,
          message: '필수 필드입니다'
        })
        return
      }

      // 값이 없으면 다른 검증은 스킵
      if (value === null || value === undefined || value === '') {
        return
      }

      // 타입 검증
      if (rule.type) {
        const typeError = validateFieldType(value, rule.type)
        if (typeError) {
          errors.push({
            row: rowNumber,
            field: rule.field,
            message: typeError
          })
          return
        }
      }

      // 커스텀 검증
      if (rule.validator) {
        const customError = rule.validator(value)
        if (customError) {
          errors.push({
            row: rowNumber,
            field: rule.field,
            message: customError
          })
        }
      }
    })
  })

  return errors
}

/**
 * 필드 타입 검증
 */
function validateFieldType(value: any, type: string): string | null {
  switch (type) {
    case 'number':
      if (isNaN(Number(value))) {
        return '숫자 형식이 아닙니다'
      }
      break
    case 'date':
      if (isNaN(Date.parse(value))) {
        return '날짜 형식이 아닙니다'
      }
      break
    case 'boolean':
      if (!['true', 'false', 'Y', 'N', '1', '0'].includes(String(value).toLowerCase())) {
        return '불린 값이 아닙니다 (true/false, Y/N, 1/0)'
      }
      break
    case 'json':
      try {
        JSON.parse(value)
      } catch {
        return '유효한 JSON 형식이 아닙니다'
      }
      break
  }

  return null
}