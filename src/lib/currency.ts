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