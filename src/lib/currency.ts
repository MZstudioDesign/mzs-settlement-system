/**
 * Currency utility functions for MZS Settlement System
 * All amounts are stored as integers (in won, no decimal places)
 */

/**
 * Format number as Korean Won currency
 * @param amount - Amount in won (integer)
 * @returns Formatted string like "₩1,234,567"
 */
export function toKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number as Korean Won currency (alias for toKRW)
 * @param amount - Amount in won (integer)
 * @returns Formatted string like "₩1,234,567"
 */
export const formatCurrency = toKRW

/**
 * Format number with thousand separators (no currency symbol)
 * @param amount - Amount in won (integer)
 * @returns Formatted string like "1,234,567"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

/**
 * Parse formatted currency string to number
 * @param value - Currency string like "₩1,234,567" or "1,234,567"
 * @returns Number value
 */
export function parseKRW(value: string): number {
  const cleanValue = value.replace(/[₩,\s]/g, '')
  return parseInt(cleanValue, 10) || 0
}

/**
 * Calculate net amount from gross (remove VAT)
 * B = round(T / 1.1)
 * @param grossAmount - Gross amount including VAT
 * @returns Net amount excluding VAT
 */
export function calculateNetFromGross(grossAmount: number): number {
  return Math.round(grossAmount / 1.1)
}

/**
 * Calculate designer distribution amount
 * A = base × 0.40 × (designer percent / 100)
 * @param base - Base amount (net + discount)
 * @param designerPercent - Designer's percentage (0-100)
 * @returns Designer distribution amount
 */
export function calculateDesignerAmount(base: number, designerPercent: number): number {
  return Math.round(base * 0.40 * (designerPercent / 100))
}

/**
 * Calculate bonus amount
 * bonus = designer_amount × (bonus_pct / 100)
 * @param designerAmount - Base designer amount
 * @param bonusPct - Bonus percentage (0-20)
 * @returns Bonus amount
 */
export function calculateBonusAmount(designerAmount: number, bonusPct: number): number {
  return Math.round(designerAmount * (bonusPct / 100))
}

/**
 * Calculate withholding tax (3.3%)
 * @param amount - Amount before withholding
 * @returns Withholding tax amount
 */
export function calculateWithholdingTax(amount: number): number {
  return Math.round(amount * 0.033)
}

/**
 * Calculate complete settlement for a designer
 * @param grossAmount - Total deposit including VAT
 * @param discountNet - Discount amount (net)
 * @param designerPercent - Designer's percentage (0-100)
 * @param bonusPct - Bonus percentage (0-20)
 * @returns Complete settlement calculation
 */
export function calculateSettlement(
  grossAmount: number,
  discountNet: number,
  designerPercent: number,
  bonusPct: number = 0
) {
  // B = round(T / 1.1)
  const netB = calculateNetFromGross(grossAmount)

  // base = B + discount_net
  const base = netB + discountNet

  // Designer amount = base × 0.40 × percent
  const designerAmount = calculateDesignerAmount(base, designerPercent)

  // Bonus = designer_amount × bonus_pct
  const bonusAmount = calculateBonusAmount(designerAmount, bonusPct)

  // Before withholding = designer_amount + bonus
  const beforeWithholding = designerAmount + bonusAmount

  // Withholding tax = 3.3%
  const withholdingTax = calculateWithholdingTax(beforeWithholding)

  // After withholding = before - withholding
  const afterWithholding = beforeWithholding - withholdingTax

  return {
    grossT: grossAmount,
    netB,
    discountNet,
    base,
    designerAmount,
    bonusAmount,
    beforeWithholding,
    withholdingTax,
    afterWithholding,
  }
}

/**
 * Create settlement snapshot for storage
 * 지침서 요구사항: settlement_items에 snapshot_json과 관련 수치들 저장
 * @param projectData - Project data
 * @param memberData - Member data
 * @param channelData - Channel data
 * @param systemRules - Current system rules
 * @returns Settlement snapshot
 */
export function createSettlementSnapshot(
  projectData: {
    id: string
    name: string
    gross_amount: number
    discount_net: number
    designers: Array<{ member_id: string; percent: number; bonus_pct: number }>
  },
  memberData: Record<string, { name: string; code: string }>,
  channelData: { name: string; fee_rate: number },
  systemRules: {
    designer_rate: number
    ad_rate: number
    program_rate: number
    withholding_rate: number
    contact_rates: Record<string, number>
    feed_rates: Record<string, number>
  }
) {
  const netB = calculateNetFromGross(projectData.gross_amount)
  const base = netB + projectData.discount_net

  // 수수료 계산
  const fees = calculateFees(netB, systemRules.ad_rate, systemRules.program_rate, channelData.fee_rate)

  // 디자이너별 계산
  const designerCalculations = projectData.designers.map(designer => {
    const settlement = calculateSettlement(
      projectData.gross_amount,
      projectData.discount_net,
      designer.percent,
      designer.bonus_pct
    )

    return {
      member_id: designer.member_id,
      member_name: memberData[designer.member_id]?.name || 'Unknown',
      member_code: memberData[designer.member_id]?.code || 'XX',
      percent: designer.percent,
      bonus_pct: designer.bonus_pct,
      ...settlement
    }
  })

  // 스냅샷 데이터 구성
  const snapshot = {
    project: {
      id: projectData.id,
      name: projectData.name,
      gross_amount: projectData.gross_amount,
      discount_net: projectData.discount_net
    },
    channel: channelData,
    calculation_rules: systemRules,
    calculated_at: new Date().toISOString(),
    amounts: {
      gross_T: projectData.gross_amount,
      net_B: netB,
      discount_net: projectData.discount_net,
      base: base,
      ad_fee: fees.adFee,
      program_fee: fees.programFee,
      channel_fee: fees.channelFee
    },
    designers: designerCalculations,
    totals: {
      designer_base_total: designerCalculations.reduce((sum, d) => sum + d.designerAmount, 0),
      designer_bonus_total: designerCalculations.reduce((sum, d) => sum + d.bonusAmount, 0),
      before_withholding_total: designerCalculations.reduce((sum, d) => sum + d.beforeWithholding, 0),
      withholding_total: designerCalculations.reduce((sum, d) => sum + d.withholdingTax, 0),
      after_withholding_total: designerCalculations.reduce((sum, d) => sum + d.afterWithholding, 0)
    }
  }

  return snapshot
}

/**
 * Calculate settlement items for monthly settlement
 * 지침서 요구사항: 월별 정산 시 모든 항목의 스냅샷 생성
 */
export function calculateMonthlySettlement(
  projects: Array<any>,
  contacts: Array<any>,
  feeds: Array<any>,
  teamTasks: Array<any>,
  members: Record<string, any>,
  channels: Record<string, any>,
  systemRules: any
) {
  const settlementItems: Array<any> = []

  // 프로젝트별 정산 항목 생성
  projects.forEach(project => {
    const snapshot = createSettlementSnapshot(
      project,
      members,
      channels[project.channel_id],
      systemRules
    )

    // 각 디자이너별로 settlement_item 생성
    snapshot.designers.forEach(designer => {
      settlementItems.push({
        source_type: 'project',
        source_id: project.id,
        member_id: designer.member_id,
        snapshot_json: JSON.stringify(snapshot),
        gross_T: snapshot.amounts.gross_T,
        net_B: snapshot.amounts.net_B,
        discount_net: snapshot.amounts.discount_net,
        ad_fee: snapshot.amounts.ad_fee,
        program_fee: snapshot.amounts.program_fee,
        channel_fee: snapshot.amounts.channel_fee,
        designer_base: designer.designerAmount,
        designer_amount: designer.designerAmount,
        designer_bonus_amount: designer.bonusAmount,
        contact_amount: 0,
        feed_amount: 0,
        team_amount: 0,
        mileage_amount: 0,
        amount_before_withholding: designer.beforeWithholding,
        withholding_3_3: designer.withholdingTax,
        amount_after_withholding: designer.afterWithholding,
        paid: false,
        paid_date: null,
        memo: null
      })
    })
  })

  // 컨택 항목 추가
  const contactsByMember = contacts.reduce((acc, contact) => {
    if (!acc[contact.member_id]) acc[contact.member_id] = []
    acc[contact.member_id].push(contact)
    return acc
  }, {} as Record<string, any[]>)

  Object.entries(contactsByMember).forEach(([memberId, memberContacts]) => {
    const totalAmount = memberContacts.reduce((sum, contact) => sum + contact.amount, 0)
    const withholdingTax = calculateWithholdingTax(totalAmount)

    settlementItems.push({
      source_type: 'contact',
      source_id: null,
      member_id: memberId,
      snapshot_json: JSON.stringify({
        contacts: memberContacts,
        calculated_at: new Date().toISOString(),
        total_amount: totalAmount
      }),
      gross_T: 0,
      net_B: 0,
      discount_net: 0,
      ad_fee: 0,
      program_fee: 0,
      channel_fee: 0,
      designer_base: 0,
      designer_amount: 0,
      designer_bonus_amount: 0,
      contact_amount: totalAmount,
      feed_amount: 0,
      team_amount: 0,
      mileage_amount: 0,
      amount_before_withholding: totalAmount,
      withholding_3_3: withholdingTax,
      amount_after_withholding: totalAmount - withholdingTax,
      paid: false,
      paid_date: null,
      memo: null
    })
  })

  // 피드 항목, 팀 업무 항목도 비슷하게 처리...

  return settlementItems
}

/**
 * Calculate fees for a project
 * @param netB - Net amount (B)
 * @param adRate - Advertisement fee rate (default 0.10)
 * @param programRate - Program fee rate (default 0.03)
 * @param channelFeeRate - Channel fee rate (varies by channel)
 * @returns Fee calculation
 */
export function calculateFees(
  netB: number,
  adRate: number = 0.10,
  programRate: number = 0.03,
  channelFeeRate: number = 0
) {
  return {
    adFee: Math.round(netB * adRate),
    programFee: Math.round(netB * programRate),
    channelFee: Math.round(netB * channelFeeRate),
  }
}

/**
 * Validate designer percentages sum to 100
 * @param designers - Array of designers with percent property
 * @returns True if sum equals 100
 */
export function validateDesignerPercentages(designers: Array<{ percent: number }>): boolean {
  const total = designers.reduce((sum, designer) => sum + designer.percent, 0)
  return total === 100
}

/**
 * Validate bonus percentage is within 0-20% range
 * @param bonusPct - Bonus percentage to validate
 * @returns True if valid
 */
export function validateBonusPercentage(bonusPct: number): boolean {
  return bonusPct >= 0 && bonusPct <= 20
}

/**
 * Format percentage with one decimal place
 * @param value - Percentage value (0-100)
 * @returns Formatted percentage string like "15.5%"
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Format large numbers with Korean units (만, 억)
 * @param amount - Amount in won
 * @returns Formatted string with Korean units like "15만원", "1억2천만원"
 */
export function formatKoreanUnits(amount: number): string {
  if (amount === 0) return '0원'

  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absAmount >= 100000000) { // 억 단위
    const eok = Math.floor(absAmount / 100000000)
    const remainder = absAmount % 100000000
    const man = Math.floor(remainder / 10000)

    if (man === 0) {
      return `${sign}${eok}억원`
    } else if (man < 1000) {
      return `${sign}${eok}억${man}만원`
    } else {
      const thousand = Math.floor(man / 1000)
      const remainingMan = man % 1000
      if (remainingMan === 0) {
        return `${sign}${eok}억${thousand}천만원`
      } else {
        return `${sign}${eok}억${thousand}천${remainingMan}만원`
      }
    }
  } else if (absAmount >= 10000) { // 만 단위
    const man = Math.floor(absAmount / 10000)
    const remainder = absAmount % 10000

    if (remainder === 0) {
      return `${sign}${man}만원`
    } else if (remainder < 1000) {
      return `${sign}${man}만${remainder}원`
    } else {
      const thousand = Math.floor(remainder / 1000)
      const remainingAmount = remainder % 1000
      if (remainingAmount === 0) {
        return `${sign}${man}만${thousand}천원`
      } else {
        return `${sign}${man}만${thousand}천${remainingAmount}원`
      }
    }
  } else {
    return `${sign}${absAmount}원`
  }
}

/**
 * Calculate and format tax-exclusive amount from tax-inclusive amount
 * @param taxInclusiveAmount - Amount including tax
 * @param taxRate - Tax rate (e.g., 0.1 for 10%)
 * @returns Object with formatted amounts
 */
export function formatTaxBreakdown(taxInclusiveAmount: number, taxRate: number = 0.1) {
  const taxExclusiveAmount = Math.round(taxInclusiveAmount / (1 + taxRate))
  const taxAmount = taxInclusiveAmount - taxExclusiveAmount

  return {
    inclusive: toKRW(taxInclusiveAmount),
    exclusive: toKRW(taxExclusiveAmount),
    tax: toKRW(taxAmount),
    taxRate: formatPercentage(taxRate * 100)
  }
}

/**
 * Format amount with both regular and Korean unit formats
 * @param amount - Amount in won
 * @returns Object with both formats
 */
export function formatAmountBoth(amount: number) {
  return {
    standard: toKRW(amount),
    korean: formatKoreanUnits(amount),
    number: formatNumber(amount)
  }
}

/**
 * Format settlement summary for display
 * @param grossT - Gross amount including VAT
 * @param netB - Net amount excluding VAT
 * @param designerTotal - Total designer payout
 * @param companyTotal - Company profit
 * @returns Formatted summary object
 */
export function formatSettlementSummary(
  grossT: number,
  netB: number,
  designerTotal: number,
  companyTotal: number
) {
  const designerPercent = netB > 0 ? (designerTotal / netB) * 100 : 0
  const companyPercent = netB > 0 ? (companyTotal / netB) * 100 : 0

  return {
    gross: formatAmountBoth(grossT),
    net: formatAmountBoth(netB),
    designer: {
      amount: formatAmountBoth(designerTotal),
      percentage: formatPercentage(designerPercent)
    },
    company: {
      amount: formatAmountBoth(companyTotal),
      percentage: formatPercentage(companyPercent)
    },
    vatAmount: formatAmountBoth(grossT - netB)
  }
}

/**
 * Validate and parse currency input string
 * @param input - User input string
 * @returns Parsed amount or null if invalid
 */
export function safeParseCurrency(input: string): number | null {
  if (!input || typeof input !== 'string') return null

  // Remove all non-digit characters except for negative sign
  const cleaned = input.replace(/[^\d-]/g, '')

  if (cleaned === '' || cleaned === '-') return null

  const parsed = parseInt(cleaned, 10)

  // Validate reasonable range (0 to 10억)
  if (isNaN(parsed) || parsed < 0 || parsed > 1000000000) {
    return null
  }

  return parsed
}

/**
 * Format currency for input field (remove currency symbol)
 * @param amount - Amount in won
 * @returns Plain number string with commas
 */
export function formatCurrencyInput(amount: number): string {
  if (amount === 0) return ''
  return formatNumber(amount)
}

/**
 * Calculate compound amounts for settlement preview
 * @param amounts - Array of individual amounts
 * @returns Summary with totals and breakdowns
 */
export function calculateCompoundAmounts(amounts: number[]) {
  const total = amounts.reduce((sum, amount) => sum + amount, 0)
  const withholding = Math.round(total * 0.033) // 3.3% withholding tax
  const afterWithholding = total - withholding

  return {
    individual: amounts.map(amount => ({
      gross: toKRW(amount),
      withholding: toKRW(Math.round(amount * 0.033)),
      net: toKRW(amount - Math.round(amount * 0.033))
    })),
    totals: {
      gross: toKRW(total),
      withholding: toKRW(withholding),
      net: toKRW(afterWithholding)
    }
  }
}