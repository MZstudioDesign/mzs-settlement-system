/**
 * MZS Settlement System - Comprehensive Settlement Calculation Engine
 *
 * This module implements the complete MZS Studio settlement calculation logic
 * following the business rules: T(gross) → B(net) → base → designer share → bonus → withholding
 *
 * Key Business Rules:
 * - VAT: 10% (T = gross including VAT, B = T / 1.1)
 * - Fees: Ad 10%, Program 3%, Channel varies (calculated from B)
 * - Designer Base Rate: 40% of base amount
 * - Bonus: 0-20% of designer amount
 * - Withholding Tax: 3.3% on all individual payments
 * - Multiple Revenue Sources: Projects, Contacts, Feeds, Team Tasks, Mileage
 */

import type {
  DesignerAllocation,
  ContactType,
  FeedType,
  SettlementCalculation,
  FeeCalculation,
} from '@/types/database'

import type {
  CompleteSettlementCalculation,
  DesignerSettlement,
  ProjectSettlementSummary,
  SettlementValidation,
  SettlementCalculationContext,
} from '@/types/settlement'

// Business rule constants
export const SETTLEMENT_RULES = {
  VAT_RATE: 0.10, // 10% VAT (T includes VAT, B excludes VAT)
  DESIGNER_BASE_RATE: 0.40, // 40% of base goes to designers
  WITHHOLDING_TAX_RATE: 0.033, // 3.3% withholding tax on individual payments
  AD_FEE_RATE: 0.10, // 10% advertising fee (from B)
  PROGRAM_FEE_RATE: 0.03, // 3% program fee (from B)

  // Bonus percentage limits
  BONUS_MIN: 0,
  BONUS_MAX: 20,

  // Contact event amounts
  CONTACT_AMOUNTS: {
    INCOMING: 1000,
    CHAT: 1000,
    GUIDE: 2000,
  },

  // Feed event amounts
  FEED_AMOUNTS: {
    BELOW3: 400, // 피드 3개 미만
    GTE3: 1000,  // 피드 3개 이상
  },

  // Channel fee rates (examples)
  CHANNEL_RATES: {
    KMONG: 0.21, // 크몽 21%
    DIRECT: 0.00, // 계좌입금 0%
  },
} as const

/**
 * Calculate net amount from gross (remove VAT)
 * Formula: B = round(T / 1.1)
 */
export function calculateNetFromGross(grossAmount: number): number {
  if (grossAmount <= 0) return 0
  return Math.round(grossAmount / 1.1)
}

/**
 * Calculate all fees from net amount
 * Fees are calculated from B (net amount)
 */
export function calculateProjectFees(
  netAmount: number,
  channelFeeRate: number = 0,
  adFeeRate: number = SETTLEMENT_RULES.AD_FEE_RATE,
  programFeeRate: number = SETTLEMENT_RULES.PROGRAM_FEE_RATE
): FeeCalculation {
  if (netAmount <= 0) {
    return { adFee: 0, programFee: 0, channelFee: 0 }
  }

  return {
    adFee: Math.round(netAmount * adFeeRate),
    programFee: Math.round(netAmount * programFeeRate),
    channelFee: Math.round(netAmount * channelFeeRate),
  }
}

/**
 * Calculate base amount after discount
 * Formula: base = B + discount_net
 */
export function calculateBaseAmount(netAmount: number, discountNet: number = 0): number {
  return netAmount + discountNet
}

/**
 * Calculate individual designer settlement
 * Formula: designer_amount = base * 0.40 * (percent / 100)
 * bonus_amount = designer_amount * (bonus_pct / 100)
 */
export function calculateDesignerSettlement(
  baseAmount: number,
  designerPercent: number,
  bonusPct: number = 0
): SettlementCalculation {
  if (baseAmount <= 0 || designerPercent <= 0) {
    return {
      grossT: 0,
      netB: 0,
      discountNet: 0,
      base: baseAmount,
      designerAmount: 0,
      bonusAmount: 0,
      beforeWithholding: 0,
      withholdingTax: 0,
      afterWithholding: 0,
    }
  }

  // Calculate designer base amount
  const designerAmount = Math.round(baseAmount * SETTLEMENT_RULES.DESIGNER_BASE_RATE * (designerPercent / 100))

  // Calculate bonus
  const bonusAmount = Math.round(designerAmount * (bonusPct / 100))

  // Total before withholding
  const beforeWithholding = designerAmount + bonusAmount

  // Calculate withholding tax
  const withholdingTax = Math.round(beforeWithholding * SETTLEMENT_RULES.WITHHOLDING_TAX_RATE)

  // Final amount after withholding
  const afterWithholding = beforeWithholding - withholdingTax

  return {
    grossT: 0, // Set by caller
    netB: 0, // Set by caller
    discountNet: 0, // Set by caller
    base: baseAmount,
    designerAmount,
    bonusAmount,
    beforeWithholding,
    withholdingTax,
    afterWithholding,
  }
}

/**
 * Calculate complete project settlement with multiple designers
 */
export function calculateProjectSettlement(
  grossAmount: number,
  discountNet: number = 0,
  designers: DesignerAllocation[],
  channelFeeRate: number = 0,
  adFeeRate?: number,
  programFeeRate?: number
): {
  projectCalculation: CompleteSettlementCalculation
  designerCalculations: DesignerSettlement[]
  summary: {
    totalDesignerAllocation: number
    totalCompanyAllocation: number
    totalFees: number
  }
} {
  // Step 1: Calculate basic amounts
  const netB = calculateNetFromGross(grossAmount)
  const baseAmount = calculateBaseAmount(netB, discountNet)

  // Step 2: Calculate fees
  const fees = calculateProjectFees(netB, channelFeeRate, adFeeRate, programFeeRate)
  const totalFees = fees.adFee + fees.programFee + fees.channelFee

  // Step 3: Calculate designer settlements
  const designerCalculations: DesignerSettlement[] = designers.map(designer => {
    const calculation = calculateDesignerSettlement(baseAmount, designer.percent, designer.bonus_pct)

    // Set the gross/net values for completeness
    calculation.grossT = grossAmount
    calculation.netB = netB
    calculation.discountNet = discountNet

    return {
      member_id: designer.member_id,
      member_name: '', // To be filled by caller
      member_code: '', // To be filled by caller
      percent: designer.percent,
      bonus_pct: designer.bonus_pct,
      calculation,
    }
  })

  // Step 4: Calculate totals
  const totalDesignerAllocation = designerCalculations.reduce((sum, d) => sum + d.calculation.afterWithholding, 0)
  const totalDesignerBeforeWithholding = designerCalculations.reduce((sum, d) => sum + d.calculation.beforeWithholding, 0)
  const totalWithholdingTax = designerCalculations.reduce((sum, d) => sum + d.calculation.withholdingTax, 0)

  // Company share = base - total designer base amounts - total fees
  const totalDesignerBase = designerCalculations.reduce((sum, d) => sum + d.calculation.designerAmount + d.calculation.bonusAmount, 0)
  const companyShare = baseAmount - totalDesignerBase - totalFees

  // Step 5: Create project calculation summary
  const projectCalculation: CompleteSettlementCalculation = {
    grossT: grossAmount,
    netB,
    discountNet,
    base: baseAmount,
    designerAmount: totalDesignerBeforeWithholding,
    bonusAmount: designerCalculations.reduce((sum, d) => sum + d.calculation.bonusAmount, 0),
    beforeWithholding: totalDesignerBeforeWithholding,
    withholdingTax: totalWithholdingTax,
    afterWithholding: totalDesignerAllocation,
    fees,
    totalFees,
    companyShare,
  }

  return {
    projectCalculation,
    designerCalculations,
    summary: {
      totalDesignerAllocation,
      totalCompanyAllocation: companyShare,
      totalFees,
    },
  }
}

/**
 * Calculate contact event settlement
 * Fixed amounts based on contact type
 */
export function calculateContactSettlement(
  contactType: ContactType,
  customAmount?: number
): SettlementCalculation {
  const amount = customAmount ?? SETTLEMENT_RULES.CONTACT_AMOUNTS[contactType]
  const withholdingTax = Math.round(amount * SETTLEMENT_RULES.WITHHOLDING_TAX_RATE)
  const afterWithholding = amount - withholdingTax

  return {
    grossT: amount,
    netB: amount, // No VAT on contact payments
    discountNet: 0,
    base: amount,
    designerAmount: amount,
    bonusAmount: 0,
    beforeWithholding: amount,
    withholdingTax,
    afterWithholding,
  }
}

/**
 * Calculate feed event settlement
 * Fixed amounts based on feed type
 */
export function calculateFeedSettlement(
  feedType: FeedType,
  customAmount?: number
): SettlementCalculation {
  const amount = customAmount ?? SETTLEMENT_RULES.FEED_AMOUNTS[feedType]
  const withholdingTax = Math.round(amount * SETTLEMENT_RULES.WITHHOLDING_TAX_RATE)
  const afterWithholding = amount - withholdingTax

  return {
    grossT: amount,
    netB: amount, // No VAT on feed payments
    discountNet: 0,
    base: amount,
    designerAmount: amount,
    bonusAmount: 0,
    beforeWithholding: amount,
    withholdingTax,
    afterWithholding,
  }
}

/**
 * Calculate team task settlement
 * Direct amount with withholding tax
 */
export function calculateTeamTaskSettlement(amount: number): SettlementCalculation {
  if (amount <= 0) {
    return {
      grossT: 0, netB: 0, discountNet: 0, base: 0,
      designerAmount: 0, bonusAmount: 0, beforeWithholding: 0,
      withholdingTax: 0, afterWithholding: 0,
    }
  }

  const withholdingTax = Math.round(amount * SETTLEMENT_RULES.WITHHOLDING_TAX_RATE)
  const afterWithholding = amount - withholdingTax

  return {
    grossT: amount,
    netB: amount, // No VAT on team task payments
    discountNet: 0,
    base: amount,
    designerAmount: amount,
    bonusAmount: 0,
    beforeWithholding: amount,
    withholdingTax,
    afterWithholding,
  }
}

/**
 * Calculate mileage settlement
 * Direct amount with withholding tax
 */
export function calculateMileageSettlement(amount: number): SettlementCalculation {
  if (amount <= 0) {
    return {
      grossT: 0, netB: 0, discountNet: 0, base: 0,
      designerAmount: 0, bonusAmount: 0, beforeWithholding: 0,
      withholdingTax: 0, afterWithholding: 0,
    }
  }

  const withholdingTax = Math.round(amount * SETTLEMENT_RULES.WITHHOLDING_TAX_RATE)
  const afterWithholding = amount - withholdingTax

  return {
    grossT: amount,
    netB: amount, // No VAT on mileage payments
    discountNet: 0,
    base: amount,
    designerAmount: amount,
    bonusAmount: 0,
    beforeWithholding: amount,
    withholdingTax,
    afterWithholding,
  }
}

// Validation Functions

/**
 * Validate designer percentage allocations
 * Must sum to exactly 100%
 */
export function validateDesignerPercentages(designers: DesignerAllocation[]): SettlementValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!designers || designers.length === 0) {
    errors.push('최소 한 명의 디자이너가 할당되어야 합니다.')
    return { valid: false, errors, warnings, total_percentage: 0, total_bonus_pct: 0 }
  }

  // Check individual percentages
  designers.forEach((designer, index) => {
    if (designer.percent <= 0) {
      errors.push(`디자이너 ${index + 1}: 지분율은 0%보다 커야 합니다.`)
    }
    if (designer.percent > 100) {
      errors.push(`디자이너 ${index + 1}: 지분율은 100%를 초과할 수 없습니다.`)
    }
  })

  // Check total percentage
  const totalPercentage = designers.reduce((sum, d) => sum + d.percent, 0)
  if (Math.abs(totalPercentage - 100) > 0.01) { // Allow small floating point differences
    errors.push(`총 지분율이 ${totalPercentage.toFixed(1)}%입니다. 정확히 100%여야 합니다.`)
  }

  // Calculate total bonus percentage for informational purposes
  const totalBonusPct = designers.reduce((sum, d) => sum + d.bonus_pct, 0)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    total_percentage: totalPercentage,
    total_bonus_pct: totalBonusPct,
  }
}

/**
 * Validate individual bonus percentage
 * Must be between 0-20%
 */
export function validateBonusPercentage(bonusPct: number): { valid: boolean; error?: string } {
  if (bonusPct < SETTLEMENT_RULES.BONUS_MIN) {
    return { valid: false, error: `보너스율은 ${SETTLEMENT_RULES.BONUS_MIN}% 이상이어야 합니다.` }
  }

  if (bonusPct > SETTLEMENT_RULES.BONUS_MAX) {
    return { valid: false, error: `보너스율은 ${SETTLEMENT_RULES.BONUS_MAX}% 이하여야 합니다.` }
  }

  return { valid: true }
}

/**
 * Validate project amounts
 */
export function validateProjectAmounts(grossAmount: number, discountNet: number = 0): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (grossAmount <= 0) {
    errors.push('총 프로젝트 금액은 0보다 커야 합니다.')
  }

  if (discountNet < 0) {
    errors.push('할인 금액은 음수일 수 없습니다.')
  }

  // Check if discount exceeds reasonable limits
  const netAmount = calculateNetFromGross(grossAmount)
  if (discountNet > netAmount) {
    errors.push('할인 금액이 순 금액을 초과할 수 없습니다.')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Create settlement calculation context with current rules
 * Useful for forms and validation
 */
export function createSettlementContext(): SettlementCalculationContext {
  return {
    vat_rate: SETTLEMENT_RULES.VAT_RATE,
    designer_distribution_rate: SETTLEMENT_RULES.DESIGNER_BASE_RATE,
    withholding_tax_rate: SETTLEMENT_RULES.WITHHOLDING_TAX_RATE,
    ad_fee_rate: SETTLEMENT_RULES.AD_FEE_RATE,
    program_fee_rate: SETTLEMENT_RULES.PROGRAM_FEE_RATE,
    contact_amounts: SETTLEMENT_RULES.CONTACT_AMOUNTS,
    feed_amounts: SETTLEMENT_RULES.FEED_AMOUNTS,
    bonus_range: { min: SETTLEMENT_RULES.BONUS_MIN, max: SETTLEMENT_RULES.BONUS_MAX },
  }
}

// Utility Functions for Complex Calculations

/**
 * Calculate 2.5x conversion ranking (mentioned in requirements)
 * This seems to be a performance metric
 */
export function calculate2_5xRanking(memberEarnings: { member_id: string; total_earnings: number }[]): {
  member_id: string
  total_earnings: number
  converted_score: number
  rank: number
}[] {
  const withScores = memberEarnings.map(member => ({
    ...member,
    converted_score: member.total_earnings * 2.5,
  }))

  // Sort by converted score descending
  withScores.sort((a, b) => b.converted_score - a.converted_score)

  // Add ranks
  return withScores.map((member, index) => ({
    ...member,
    rank: index + 1,
  }))
}

/**
 * Calculate company profit from project
 * This is base - total designer allocations - total fees
 */
export function calculateCompanyProfit(
  baseAmount: number,
  totalDesignerAllocations: number,
  totalFees: number
): number {
  return Math.max(0, baseAmount - totalDesignerAllocations - totalFees)
}

/**
 * Preview calculation for real-time updates
 * Simplified version for UI responsiveness
 */
export function previewSettlementCalculation(
  grossAmount: number,
  designers: { percent: number; bonus_pct: number }[],
  channelFeeRate: number = 0
): {
  netAmount: number
  baseAmount: number
  totalFees: number
  totalDesignerPayout: number
  companyProfit: number
} {
  if (grossAmount <= 0 || designers.length === 0) {
    return {
      netAmount: 0,
      baseAmount: 0,
      totalFees: 0,
      totalDesignerPayout: 0,
      companyProfit: 0,
    }
  }

  const netAmount = calculateNetFromGross(grossAmount)
  const baseAmount = calculateBaseAmount(netAmount, 0) // No discount for preview
  const fees = calculateProjectFees(netAmount, channelFeeRate)
  const totalFees = fees.adFee + fees.programFee + fees.channelFee

  // Calculate total designer payout
  let totalDesignerPayout = 0
  for (const designer of designers) {
    const calculation = calculateDesignerSettlement(baseAmount, designer.percent, designer.bonus_pct)
    totalDesignerPayout += calculation.afterWithholding
  }

  const companyProfit = calculateCompanyProfit(baseAmount, totalDesignerPayout, totalFees)

  return {
    netAmount,
    baseAmount,
    totalFees,
    totalDesignerPayout,
    companyProfit,
  }
}