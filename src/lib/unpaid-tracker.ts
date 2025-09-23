/**
 * 미지급 금액 추적 및 관리 유틸리티
 * 지침서 요구사항: 대시보드에서 미지급 합계, settlement_items의 paid 토글
 */

import { supabase } from '@/lib/supabase'

export interface UnpaidSummary {
  totalUnpaidAmount: number
  totalUnpaidCount: number
  unpaidByMember: Array<{
    memberId: string
    memberName: string
    memberCode: string
    unpaidAmount: number
    unpaidCount: number
    lastSettlementDate?: string
  }>
  unpaidByType: {
    design: number
    contact: number
    feed: number
    team: number
    mileage: number
  }
}

export interface UnpaidItem {
  id: string
  settlementId: string
  settlementYm: string
  sourceType: 'project' | 'contact' | 'feed' | 'team' | 'mileage'
  sourceId: string
  memberId: string
  memberName: string
  memberCode: string
  amountBeforeWithholding: number
  amountAfterWithholding: number
  withholdingTax: number
  description: string
  settleDate: string
  createdAt: string
  memo?: string
}

/**
 * 전체 미지급 금액 요약 정보 조회
 */
export async function getUnpaidSummary(): Promise<UnpaidSummary> {

  const { data: unpaidItems, error } = await supabase
    .from('settlement_items')
    .select(`
      id,
      amount_before_withholding,
      amount_after_withholding,
      withholding_3_3,
      source_type,
      settlements!inner(ym),
      members!inner(id, name, code)
    `)
    .eq('paid', false)

  if (error) {
    console.error('미지급 데이터 조회 실패:', error)
    return {
      totalUnpaidAmount: 0,
      totalUnpaidCount: 0,
      unpaidByMember: [],
      unpaidByType: {
        design: 0,
        contact: 0,
        feed: 0,
        team: 0,
        mileage: 0
      }
    }
  }

  const totalUnpaidAmount = unpaidItems.reduce((sum, item) => sum + item.amount_after_withholding, 0)
  const totalUnpaidCount = unpaidItems.length

  // 멤버별 미지급 금액 집계
  const memberMap = new Map<string, {
    memberId: string
    memberName: string
    memberCode: string
    unpaidAmount: number
    unpaidCount: number
  }>()

  // 타입별 미지급 금액 집계
  const unpaidByType = {
    design: 0,
    contact: 0,
    feed: 0,
    team: 0,
    mileage: 0
  }

  for (const item of unpaidItems) {
    const member = item.members
    const memberId = member.id

    if (!memberMap.has(memberId)) {
      memberMap.set(memberId, {
        memberId,
        memberName: member.name,
        memberCode: member.code,
        unpaidAmount: 0,
        unpaidCount: 0
      })
    }

    const memberData = memberMap.get(memberId)!
    memberData.unpaidAmount += item.amount_after_withholding
    memberData.unpaidCount += 1

    // 타입별 집계
    const sourceType = item.source_type as keyof typeof unpaidByType
    if (sourceType === 'project') {
      unpaidByType.design += item.amount_after_withholding
    } else if (unpaidByType[sourceType] !== undefined) {
      unpaidByType[sourceType] += item.amount_after_withholding
    }
  }

  const unpaidByMember = Array.from(memberMap.values())
    .sort((a, b) => b.unpaidAmount - a.unpaidAmount)

  return {
    totalUnpaidAmount,
    totalUnpaidCount,
    unpaidByMember,
    unpaidByType
  }
}

/**
 * 특정 멤버의 미지급 항목 상세 조회
 */
export async function getMemberUnpaidItems(memberId: string): Promise<UnpaidItem[]> {

  const { data: items, error } = await supabase
    .from('settlement_items')
    .select(`
      id,
      settlement_id,
      source_type,
      source_id,
      amount_before_withholding,
      amount_after_withholding,
      withholding_3_3,
      memo,
      created_at,
      settlements!inner(ym),
      members!inner(id, name, code),
      projects(client_name, title),
      contacts(event_type),
      feed_logs(fee_type),
      team_tasks(notes),
      mileage(reason)
    `)
    .eq('members.id', memberId)
    .eq('paid', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('멤버 미지급 데이터 조회 실패:', error)
    return []
  }

  return items.map(item => {
    let description = ''

    switch (item.source_type) {
      case 'project':
        description = `${item.projects?.client_name || '미명시'} - ${item.projects?.title || '프로젝트'}`
        break
      case 'contact':
        const eventTypeLabels = {
          'INCOMING': '유입',
          'CHAT': '상담',
          'GUIDE': '가이드'
        }
        description = `컨택 (${eventTypeLabels[item.contacts?.event_type as keyof typeof eventTypeLabels] || '기타'})`
        break
      case 'feed':
        const feeTypeLabels = {
          'BELOW3': '피드 3개 미만',
          'GTE3': '피드 3개 이상'
        }
        description = `피드 (${feeTypeLabels[item.feed_logs?.fee_type as keyof typeof feeTypeLabels] || '기타'})`
        break
      case 'team':
        description = `팀업무 - ${item.team_tasks?.notes || '메모 없음'}`
        break
      case 'mileage':
        description = `마일리지 - ${item.mileage?.reason || '사유 없음'}`
        break
      default:
        description = `${item.source_type} 항목`
    }

    return {
      id: item.id,
      settlementId: item.settlement_id,
      settlementYm: item.settlements.ym,
      sourceType: item.source_type,
      sourceId: item.source_id,
      memberId: item.members.id,
      memberName: item.members.name,
      memberCode: item.members.code,
      amountBeforeWithholding: item.amount_before_withholding,
      amountAfterWithholding: item.amount_after_withholding,
      withholdingTax: item.withholding_3_3,
      description,
      settleDate: item.settlements.ym,
      createdAt: item.created_at,
      memo: item.memo
    }
  })
}

/**
 * 정산 항목의 지급 상태 변경
 */
export async function updatePaymentStatus(
  itemId: string,
  paid: boolean,
  memo?: string
): Promise<{ success: boolean; error?: string }> {

  const updateData: any = {
    paid,
    paid_date: paid ? new Date().toISOString() : null
  }

  if (memo !== undefined) {
    updateData.memo = memo
  }

  const { error } = await supabase
    .from('settlement_items')
    .update(updateData)
    .eq('id', itemId)

  if (error) {
    console.error('지급 상태 업데이트 실패:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * 여러 정산 항목의 지급 상태 일괄 변경
 */
export async function bulkUpdatePaymentStatus(
  itemIds: string[],
  paid: boolean,
  memo?: string
): Promise<{ success: boolean; updated: number; error?: string }> {

  const updateData: any = {
    paid,
    paid_date: paid ? new Date().toISOString() : null
  }

  if (memo !== undefined) {
    updateData.memo = memo
  }

  const { data, error } = await supabase
    .from('settlement_items')
    .update(updateData)
    .in('id', itemIds)
    .select('id')

  if (error) {
    console.error('일괄 지급 상태 업데이트 실패:', error)
    return { success: false, updated: 0, error: error.message }
  }

  return { success: true, updated: data?.length || 0 }
}

/**
 * 특정 정산의 모든 항목 지급 완료 처리
 */
export async function markSettlementAsPaid(
  settlementId: string,
  memo?: string
): Promise<{ success: boolean; updated: number; error?: string }> {

  const updateData: any = {
    paid: true,
    paid_date: new Date().toISOString()
  }

  if (memo !== undefined) {
    updateData.memo = memo
  }

  const { data, error } = await supabase
    .from('settlement_items')
    .update(updateData)
    .eq('settlement_id', settlementId)
    .eq('paid', false)
    .select('id')

  if (error) {
    console.error('정산 완료 처리 실패:', error)
    return { success: false, updated: 0, error: error.message }
  }

  return { success: true, updated: data?.length || 0 }
}

/**
 * 월별 미지급 통계 조회
 */
export async function getUnpaidStatsByMonth(): Promise<Array<{
  ym: string
  totalAmount: number
  totalCount: number
  memberCount: number
}>> {

  const { data: items, error } = await supabase
    .from('settlement_items')
    .select(`
      amount_after_withholding,
      settlements!inner(ym),
      members!inner(id)
    `)
    .eq('paid', false)

  if (error) {
    console.error('월별 미지급 통계 조회 실패:', error)
    return []
  }

  const monthMap = new Map<string, {
    ym: string
    totalAmount: number
    totalCount: number
    memberIds: Set<string>
  }>()

  for (const item of items) {
    const ym = item.settlements.ym

    if (!monthMap.has(ym)) {
      monthMap.set(ym, {
        ym,
        totalAmount: 0,
        totalCount: 0,
        memberIds: new Set()
      })
    }

    const monthData = monthMap.get(ym)!
    monthData.totalAmount += item.amount_after_withholding
    monthData.totalCount += 1
    monthData.memberIds.add(item.members.id)
  }

  return Array.from(monthMap.values())
    .map(({ ym, totalAmount, totalCount, memberIds }) => ({
      ym,
      totalAmount,
      totalCount,
      memberCount: memberIds.size
    }))
    .sort((a, b) => b.ym.localeCompare(a.ym))
}