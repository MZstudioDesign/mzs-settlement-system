/**
 * MZS Settlement System - Test Scenarios and Edge Cases
 *
 * Comprehensive test scenarios covering:
 * - Normal business cases
 * - Edge cases and error conditions
 * - Validation scenarios
 * - Real-world examples
 * - Mathematical edge cases
 */

import {
  calculateNetFromGross,
  calculateProjectFees,
  calculateDesignerSettlement,
  calculateProjectSettlement,
  calculateContactSettlement,
  calculateFeedSettlement,
  calculateTeamTaskSettlement,
  calculateMileageSettlement,
  validateDesignerPercentages,
  validateBonusPercentage,
  validateProjectAmounts,
  previewSettlementCalculation,
  SETTLEMENT_RULES,
} from './settlement-calculations'

import type { DesignerAllocation, ContactType, FeedType } from '@/types/database'

// Test Data
export const TEST_DESIGNERS: DesignerAllocation[] = [
  { member_id: 'member-1', percent: 60, bonus_pct: 10 },
  { member_id: 'member-2', percent: 40, bonus_pct: 5 },
]

export const SINGLE_DESIGNER: DesignerAllocation[] = [
  { member_id: 'member-1', percent: 100, bonus_pct: 15 },
]

export const INVALID_DESIGNERS: DesignerAllocation[] = [
  { member_id: 'member-1', percent: 70, bonus_pct: 10 }, // Total 120%
  { member_id: 'member-2', percent: 50, bonus_pct: 5 },
]

// Test Scenarios Interface
export interface TestScenario {
  name: string
  description: string
  input: any
  expected: any
  shouldPass: boolean
  category: 'normal' | 'edge' | 'error' | 'validation'
}

// Basic Calculation Test Scenarios
export const BASIC_CALCULATION_TESTS: TestScenario[] = [
  {
    name: 'Standard Project Settlement',
    description: '일반적인 프로젝트 정산 - 부가세 포함 1,100,000원',
    category: 'normal',
    input: {
      grossAmount: 1100000,
      discountNet: 0,
      designers: TEST_DESIGNERS,
      channelFeeRate: 0,
    },
    expected: {
      netB: 1000000, // 1,100,000 / 1.1
      baseAmount: 1000000,
      totalFees: 130000, // ad 10% + program 3% = 13%
      designer1_beforeWithholding: 264000, // (1000000 * 0.4 * 0.6) + (240000 * 0.1)
      designer2_beforeWithholding: 172000, // (1000000 * 0.4 * 0.4) + (160000 * 0.05)
      totalWithholding: Math.round((264000 + 172000) * 0.033), // 3.3%
    },
    shouldPass: true,
  },

  {
    name: 'Project with Discount',
    description: '할인이 적용된 프로젝트 정산',
    category: 'normal',
    input: {
      grossAmount: 1100000,
      discountNet: 100000, // 10만원 할인
      designers: TEST_DESIGNERS,
      channelFeeRate: 0,
    },
    expected: {
      netB: 1000000,
      baseAmount: 1100000, // 1000000 + 100000 discount
      totalFees: 130000, // Fees calculated on netB, not base
      designer1_beforeWithholding: 290400, // (1100000 * 0.4 * 0.6) + (264000 * 0.1)
      designer2_beforeWithholding: 184800, // (1100000 * 0.4 * 0.4) + (176000 * 0.05)
    },
    shouldPass: true,
  },

  {
    name: 'Kmong Channel with 21% Fee',
    description: '크몽 채널 수수료 21% 적용',
    category: 'normal',
    input: {
      grossAmount: 1100000,
      discountNet: 0,
      designers: SINGLE_DESIGNER,
      channelFeeRate: 0.21, // 크몽 21%
    },
    expected: {
      netB: 1000000,
      baseAmount: 1000000,
      totalFees: 340000, // ad 10% + program 3% + channel 21% = 34%
      companyProfit: 260000, // 1000000 - 400000 (40% to designer) - 340000 (fees)
    },
    shouldPass: true,
  },

  {
    name: 'Maximum Bonus Scenario',
    description: '최대 보너스율 20% 적용',
    category: 'normal',
    input: {
      grossAmount: 1100000,
      discountNet: 0,
      designers: [{ member_id: 'member-1', percent: 100, bonus_pct: 20 }],
      channelFeeRate: 0,
    },
    expected: {
      designer_amount: 400000, // 1000000 * 0.4
      bonus_amount: 80000, // 400000 * 0.2
      beforeWithholding: 480000,
      withholdingTax: Math.round(480000 * 0.033),
    },
    shouldPass: true,
  },
]

// Contact Event Test Scenarios
export const CONTACT_TESTS: TestScenario[] = [
  {
    name: 'INCOMING Contact',
    description: '인커밍 컨택 1,000원 정산',
    category: 'normal',
    input: { contactType: 'INCOMING' as ContactType },
    expected: {
      gross: 1000,
      beforeWithholding: 1000,
      withholdingTax: 33, // 1000 * 0.033 = 33
      afterWithholding: 967,
    },
    shouldPass: true,
  },

  {
    name: 'CHAT Contact',
    description: '채팅 컨택 1,000원 정산',
    category: 'normal',
    input: { contactType: 'CHAT' as ContactType },
    expected: {
      gross: 1000,
      beforeWithholding: 1000,
      withholdingTax: 33,
      afterWithholding: 967,
    },
    shouldPass: true,
  },

  {
    name: 'GUIDE Contact',
    description: '가이드 컨택 2,000원 정산',
    category: 'normal',
    input: { contactType: 'GUIDE' as ContactType },
    expected: {
      gross: 2000,
      beforeWithholding: 2000,
      withholdingTax: 66, // 2000 * 0.033 = 66
      afterWithholding: 1934,
    },
    shouldPass: true,
  },
]

// Feed Event Test Scenarios
export const FEED_TESTS: TestScenario[] = [
  {
    name: 'BELOW3 Feed',
    description: '피드 3개 미만 400원 정산',
    category: 'normal',
    input: { feedType: 'BELOW3' as FeedType },
    expected: {
      gross: 400,
      beforeWithholding: 400,
      withholdingTax: 13, // 400 * 0.033 = 13.2 → 13
      afterWithholding: 387,
    },
    shouldPass: true,
  },

  {
    name: 'GTE3 Feed',
    description: '피드 3개 이상 1,000원 정산',
    category: 'normal',
    input: { feedType: 'GTE3' as FeedType },
    expected: {
      gross: 1000,
      beforeWithholding: 1000,
      withholdingTax: 33,
      afterWithholding: 967,
    },
    shouldPass: true,
  },
]

// Validation Test Scenarios
export const VALIDATION_TESTS: TestScenario[] = [
  {
    name: 'Valid Designer Percentages',
    description: '올바른 디자이너 지분율 (100%)',
    category: 'validation',
    input: { designers: TEST_DESIGNERS }, // 60% + 40% = 100%
    expected: {
      valid: true,
      total_percentage: 100,
    },
    shouldPass: true,
  },

  {
    name: 'Invalid Designer Percentages - Over 100%',
    description: '잘못된 디자이너 지분율 (120%)',
    category: 'validation',
    input: { designers: INVALID_DESIGNERS }, // 70% + 50% = 120%
    expected: {
      valid: false,
      total_percentage: 120,
      errors: ['총 지분율이 120.0%입니다. 정확히 100%여야 합니다.'],
    },
    shouldPass: false,
  },

  {
    name: 'Valid Bonus Percentage',
    description: '올바른 보너스율 (15%)',
    category: 'validation',
    input: { bonusPct: 15 },
    expected: { valid: true },
    shouldPass: true,
  },

  {
    name: 'Invalid Bonus Percentage - Over Maximum',
    description: '잘못된 보너스율 (25%)',
    category: 'validation',
    input: { bonusPct: 25 },
    expected: {
      valid: false,
      error: '보너스율은 20% 이하여야 합니다.',
    },
    shouldPass: false,
  },

  {
    name: 'Invalid Bonus Percentage - Negative',
    description: '잘못된 보너스율 (-5%)',
    category: 'validation',
    input: { bonusPct: -5 },
    expected: {
      valid: false,
      error: '보너스율은 0% 이상이어야 합니다.',
    },
    shouldPass: false,
  },
]

// Edge Case Test Scenarios
export const EDGE_CASE_TESTS: TestScenario[] = [
  {
    name: 'Zero Gross Amount',
    description: '총 금액이 0원인 경우',
    category: 'edge',
    input: {
      grossAmount: 0,
      designers: TEST_DESIGNERS,
    },
    expected: {
      netB: 0,
      baseAmount: 0,
      totalFees: 0,
      totalDesignerPayout: 0,
      companyProfit: 0,
    },
    shouldPass: true,
  },

  {
    name: 'Very Small Amount',
    description: '아주 작은 금액 (11원)',
    category: 'edge',
    input: {
      grossAmount: 11, // 11 / 1.1 = 10
      designers: SINGLE_DESIGNER,
    },
    expected: {
      netB: 10,
      baseAmount: 10,
      designerAmount: 4, // 10 * 0.4 = 4
    },
    shouldPass: true,
  },

  {
    name: 'Very Large Amount',
    description: '아주 큰 금액 (10억원)',
    category: 'edge',
    input: {
      grossAmount: 1000000000, // 10억
      designers: SINGLE_DESIGNER,
    },
    expected: {
      netB: 909090909, // 1000000000 / 1.1 rounded
      baseAmount: 909090909,
      designerAmount: 363636364, // 909090909 * 0.4 rounded
    },
    shouldPass: true,
  },

  {
    name: 'Single Won Rounding',
    description: '1원 단위 반올림 테스트',
    category: 'edge',
    input: {
      grossAmount: 1000003, // Produces fractional results
      designers: [{ member_id: 'member-1', percent: 33.33, bonus_pct: 0 }],
    },
    expected: {
      // All results should be integers (rounded)
      allResultsAreIntegers: true,
    },
    shouldPass: true,
  },

  {
    name: 'Empty Designer Array',
    description: '디자이너가 없는 경우',
    category: 'edge',
    input: {
      grossAmount: 1100000,
      designers: [],
    },
    expected: {
      validation: {
        valid: false,
        errors: ['최소 한 명의 디자이너가 할당되어야 합니다.'],
      },
    },
    shouldPass: false,
  },

  {
    name: 'Discount Exceeds Net Amount',
    description: '할인이 순 금액을 초과하는 경우',
    category: 'edge',
    input: {
      grossAmount: 1100000, // net = 1000000
      discountNet: 1500000, // discount > net
    },
    expected: {
      validation: {
        valid: false,
        errors: ['할인 금액이 순 금액을 초과할 수 없습니다.'],
      },
    },
    shouldPass: false,
  },
]

// Error Handling Test Scenarios
export const ERROR_TESTS: TestScenario[] = [
  {
    name: 'Negative Gross Amount',
    description: '음수 총 금액',
    category: 'error',
    input: { grossAmount: -1000000 },
    expected: {
      validation: {
        valid: false,
        errors: ['총 프로젝트 금액은 0보다 커야 합니다.'],
      },
    },
    shouldPass: false,
  },

  {
    name: 'Negative Discount',
    description: '음수 할인 금액',
    category: 'error',
    input: {
      grossAmount: 1100000,
      discountNet: -100000,
    },
    expected: {
      validation: {
        valid: false,
        errors: ['할인 금액은 음수일 수 없습니다.'],
      },
    },
    shouldPass: false,
  },

  {
    name: 'Zero Percentage Designer',
    description: '0% 지분율을 가진 디자이너',
    category: 'error',
    input: {
      designers: [
        { member_id: 'member-1', percent: 0, bonus_pct: 0 },
        { member_id: 'member-2', percent: 100, bonus_pct: 0 },
      ],
    },
    expected: {
      validation: {
        valid: false,
        errors: ['디자이너 1: 지분율은 0%보다 커야 합니다.'],
      },
    },
    shouldPass: false,
  },

  {
    name: 'Over 100% Individual Designer',
    description: '100%를 초과하는 개별 디자이너 지분율',
    category: 'error',
    input: {
      designers: [
        { member_id: 'member-1', percent: 150, bonus_pct: 0 },
      ],
    },
    expected: {
      validation: {
        valid: false,
        errors: [
          '디자이너 1: 지분율은 100%를 초과할 수 없습니다.',
          '총 지분율이 150.0%입니다. 정확히 100%여야 합니다.',
        ],
      },
    },
    shouldPass: false,
  },
]

// Real-world Test Scenarios
export const REAL_WORLD_TESTS: TestScenario[] = [
  {
    name: 'Typical Kmong Project',
    description: '일반적인 크몽 프로젝트 (300,000원)',
    category: 'normal',
    input: {
      grossAmount: 330000, // 부가세 포함 33만원
      discountNet: 0,
      designers: [
        { member_id: 'designer-A', percent: 70, bonus_pct: 10 },
        { member_id: 'designer-B', percent: 30, bonus_pct: 5 },
      ],
      channelFeeRate: 0.21, // 크몽 21%
    },
    expected: {
      netB: 300000,
      baseAmount: 300000,
      totalFees: 102000, // 10% + 3% + 21% = 34% of 300,000
      designer_A_final: Math.round((84000 + 8400) * 0.967), // After withholding
      designer_B_final: Math.round((36000 + 1800) * 0.967), // After withholding
    },
    shouldPass: true,
  },

  {
    name: 'Large Corporate Project',
    description: '대기업 프로젝트 (5,000,000원)',
    category: 'normal',
    input: {
      grossAmount: 5500000, // 부가세 포함 550만원
      discountNet: 500000, // 50만원 할인
      designers: [
        { member_id: 'senior-designer', percent: 50, bonus_pct: 15 },
        { member_id: 'junior-designer-1', percent: 30, bonus_pct: 8 },
        { member_id: 'junior-designer-2', percent: 20, bonus_pct: 5 },
      ],
      channelFeeRate: 0, // 직접 입금
    },
    expected: {
      netB: 5000000,
      baseAmount: 5500000, // 5M + 500K discount
      totalFees: 650000, // 13% of 5M (no channel fee)
      totalDesignerAllocation: 2200000, // 40% of 5.5M base
      companyProfit: 2650000, // 5.5M - 2.2M - 650K
    },
    shouldPass: true,
  },

  {
    name: 'Freelance Direct Payment',
    description: '개인 직접 입금 프로젝트',
    category: 'normal',
    input: {
      grossAmount: 1100000,
      discountNet: 100000,
      designers: [{ member_id: 'freelancer', percent: 100, bonus_pct: 20 }],
      channelFeeRate: 0, // 직접 입금, 채널 수수료 없음
    },
    expected: {
      netB: 1000000,
      baseAmount: 1100000,
      totalFees: 130000, // Only ad + program fees
      designerAmount: 440000, // 1.1M * 40%
      bonusAmount: 88000, // 440K * 20%
      companyProfit: 442000, // 1.1M - 528K - 130K
    },
    shouldPass: true,
  },
]

// Performance Test Scenarios
export const PERFORMANCE_TESTS: TestScenario[] = [
  {
    name: 'Multiple Designers (10)',
    description: '다수 디자이너 배분 (10명)',
    category: 'normal',
    input: {
      grossAmount: 11000000, // 1천만원
      designers: Array.from({ length: 10 }, (_, i) => ({
        member_id: `designer-${i}`,
        percent: 10, // Each gets 10%
        bonus_pct: i % 20, // Varying bonus 0-19%
      })),
      channelFeeRate: 0.1,
    },
    expected: {
      totalPercentage: 100,
      allCalculationsComplete: true,
      performanceWithinLimits: true,
    },
    shouldPass: true,
  },

  {
    name: 'Precision Test',
    description: '부동소수점 정밀도 테스트',
    category: 'edge',
    input: {
      grossAmount: 999999, // Results in 909,090.09... when divided by 1.1
      designers: [
        { member_id: 'designer-1', percent: 33.33, bonus_pct: 0 },
        { member_id: 'designer-2', percent: 33.33, bonus_pct: 0 },
        { member_id: 'designer-3', percent: 33.34, bonus_pct: 0 },
      ],
    },
    expected: {
      allCalculationsAreIntegers: true,
      totalPercentageIsExact: 100,
    },
    shouldPass: true,
  },
]

// Test Runner Functions
export function runTestScenario(scenario: TestScenario): boolean {
  try {
    switch (scenario.category) {
      case 'normal':
      case 'edge':
        return runCalculationTest(scenario)
      case 'validation':
        return runValidationTest(scenario)
      case 'error':
        return runErrorTest(scenario)
      default:
        return false
    }
  } catch (error) {
    console.error(`Test failed: ${scenario.name}`, error)
    return false
  }
}

function runCalculationTest(scenario: TestScenario): boolean {
  const { input, expected } = scenario

  if (input.grossAmount !== undefined && input.designers) {
    const result = calculateProjectSettlement(
      input.grossAmount,
      input.discountNet || 0,
      input.designers,
      input.channelFeeRate || 0
    )

    // Verify key calculations
    return (
      Math.abs(result.projectCalculation.netB - expected.netB) <= 1 && // Allow 1 won rounding difference
      result.designerCalculations.length === input.designers.length
    )
  }

  if (input.contactType) {
    const result = calculateContactSettlement(input.contactType)
    return result.afterWithholding === expected.afterWithholding
  }

  if (input.feedType) {
    const result = calculateFeedSettlement(input.feedType)
    return result.afterWithholding === expected.afterWithholding
  }

  return false
}

function runValidationTest(scenario: TestScenario): boolean {
  const { input, expected, shouldPass } = scenario

  if (input.designers) {
    const result = validateDesignerPercentages(input.designers)
    return result.valid === shouldPass
  }

  if (input.bonusPct !== undefined) {
    const result = validateBonusPercentage(input.bonusPct)
    return result.valid === shouldPass
  }

  return false
}

function runErrorTest(scenario: TestScenario): boolean {
  const { input, shouldPass } = scenario

  if (input.grossAmount !== undefined) {
    const result = validateProjectAmounts(input.grossAmount, input.discountNet)
    return result.valid === shouldPass
  }

  return false
}

// Export all test suites
export const ALL_TEST_SCENARIOS = [
  ...BASIC_CALCULATION_TESTS,
  ...CONTACT_TESTS,
  ...FEED_TESTS,
  ...VALIDATION_TESTS,
  ...EDGE_CASE_TESTS,
  ...ERROR_TESTS,
  ...REAL_WORLD_TESTS,
  ...PERFORMANCE_TESTS,
]

// Test Summary Interface
export interface TestSummary {
  total: number
  passed: number
  failed: number
  categories: Record<string, { passed: number; failed: number }>
  failedTests: string[]
}

// Run all tests and return summary
export function runAllTests(): TestSummary {
  const summary: TestSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {},
    failedTests: [],
  }

  for (const scenario of ALL_TEST_SCENARIOS) {
    summary.total++

    if (!summary.categories[scenario.category]) {
      summary.categories[scenario.category] = { passed: 0, failed: 0 }
    }

    const passed = runTestScenario(scenario)

    if (passed) {
      summary.passed++
      summary.categories[scenario.category].passed++
    } else {
      summary.failed++
      summary.categories[scenario.category].failed++
      summary.failedTests.push(scenario.name)
    }
  }

  return summary
}