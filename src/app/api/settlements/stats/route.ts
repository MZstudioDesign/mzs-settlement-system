/**
 * API Route: /api/settlements/stats
 * Handles settlement statistics and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { settlementsApi } from '@/lib/api/settlements'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const type = searchParams.get('type') || 'overview' // overview, member, source, timeline

    switch (type) {
      case 'overview':
        return await getOverviewStats(year, month)

      case 'member':
        return await getMemberStats(year, month)

      case 'source':
        return await getSourceStats(year, month)

      case 'timeline':
        return await getTimelineStats(year)

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: overview, member, source, timeline' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('GET /api/settlements/stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getOverviewStats(year?: number, month?: number) {
  try {
    const result = await settlementsApi.getSettlementStats(year, month)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const stats = result.data!

    const overview = {
      period: year && month ? `${year}-${month.toString().padStart(2, '0')}` : 'All Time',
      settlements: stats.totalSettlements,
      totalAmount: stats.totalAmount,
      paidAmount: stats.totalPaid,
      unpaidAmount: stats.totalUnpaid,
      paymentRate: stats.totalAmount > 0 ? (stats.totalPaid / stats.totalAmount) * 100 : 0,
      averageAmount: stats.totalSettlements > 0 ? stats.totalAmount / stats.totalSettlements : 0,
      memberCount: Object.keys(stats.memberBreakdown).length,
    }

    return NextResponse.json({ data: overview })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get overview stats' },
      { status: 500 }
    )
  }
}

async function getMemberStats(year?: number, month?: number) {
  try {
    const result = await settlementsApi.getSettlementStats(year, month)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const stats = result.data!

    const memberStats = Object.entries(stats.memberBreakdown).map(([memberId, data]) => ({
      memberId,
      name: data.name,
      totalAmount: data.amount,
      paidAmount: data.paid,
      unpaidAmount: data.amount - data.paid,
      paymentRate: data.amount > 0 ? (data.paid / data.amount) * 100 : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount)

    return NextResponse.json({ data: memberStats })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get member stats' },
      { status: 500 }
    )
  }
}

async function getSourceStats(year?: number, month?: number) {
  try {
    // Get all settlements for the period
    const settlementsResult = await settlementsApi.getSettlements({
      year,
      month,
      limit: 1000, // Get all settlements
    })

    if (settlementsResult.error) {
      return NextResponse.json({ error: settlementsResult.error }, { status: 400 })
    }

    const sourceStats = {
      PROJECT: { count: 0, amount: 0 },
      CONTACT: { count: 0, amount: 0 },
      FEED: { count: 0, amount: 0 },
    }

    settlementsResult.data.forEach(settlement => {
      settlement.settlement_items?.forEach(item => {
        const amount = item.amount_after_withholding || 0
        if (sourceStats[item.source_type]) {
          sourceStats[item.source_type].count += 1
          sourceStats[item.source_type].amount += amount
        }
      })
    })

    const totalAmount = Object.values(sourceStats).reduce((sum, stat) => sum + stat.amount, 0)

    const statsWithPercentage = Object.entries(sourceStats).map(([source, data]) => ({
      source,
      count: data.count,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }))

    return NextResponse.json({ data: statsWithPercentage })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get source stats' },
      { status: 500 }
    )
  }
}

async function getTimelineStats(year?: number) {
  try {
    const currentYear = year || new Date().getFullYear()
    const timeline = []

    // Get stats for each month of the year
    for (let month = 1; month <= 12; month++) {
      const result = await settlementsApi.getSettlementStats(currentYear, month)

      if (result.error) {
        timeline.push({
          year: currentYear,
          month,
          period: `${currentYear}-${month.toString().padStart(2, '0')}`,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          settlements: 0,
        })
      } else {
        const stats = result.data!
        timeline.push({
          year: currentYear,
          month,
          period: `${currentYear}-${month.toString().padStart(2, '0')}`,
          totalAmount: stats.totalAmount,
          paidAmount: stats.totalPaid,
          unpaidAmount: stats.totalUnpaid,
          settlements: stats.totalSettlements,
        })
      }
    }

    return NextResponse.json({ data: timeline })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get timeline stats' },
      { status: 500 }
    )
  }
}