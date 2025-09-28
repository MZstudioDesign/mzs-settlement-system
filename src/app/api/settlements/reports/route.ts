/**
 * API Route: /api/settlements/reports
 * Handles settlement report generation (PDF, CSV, Excel)
 */

import { NextRequest, NextResponse } from 'next/server'
import { settlementsApi } from '@/lib/api/settlements'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const settlementId = searchParams.get('settlement_id')
    const format = searchParams.get('format') || 'json' // json, pdf, csv, excel
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    if (!settlementId && (!year || !month)) {
      return NextResponse.json(
        { error: 'Either settlement_id or year/month is required' },
        { status: 400 }
      )
    }

    let settlement
    if (settlementId) {
      const result = await settlementsApi.getSettlement(settlementId)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }
      settlement = result.data
    } else {
      // Get settlement by year/month
      const result = await settlementsApi.getSettlements({
        year,
        month,
        limit: 1,
      })
      if (result.error || !result.data.length) {
        return NextResponse.json(
          { error: 'Settlement not found for the specified period' },
          { status: 404 }
        )
      }
      settlement = result.data[0]
    }

    // Generate report based on format
    switch (format) {
      case 'json':
        return NextResponse.json({
          data: settlement,
          summary: generateSettlementSummary(settlement),
        })

      case 'csv':
        const csvContent = generateCSVReport(settlement)
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="settlement-${settlement.year}-${settlement.month}.csv"`,
          },
        })

      case 'pdf':
        // PDF 생성은 클라이언트에서 처리 (jsPDF는 브라우저 전용)
        return NextResponse.json({
          data: settlement,
          summary: generateSettlementSummary(settlement),
          type: 'pdf_data',
          message: 'PDF data provided for client-side generation'
        })

      case 'excel':
        // TODO: Implement Excel generation
        return NextResponse.json(
          { error: 'Excel generation not yet implemented' },
          { status: 501 }
        )

      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use: json, csv, pdf, excel' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('GET /api/settlements/reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateSettlementSummary(settlement: any) {
  const items = settlement.settlement_items || []

  const summary = {
    period: `${settlement.year}-${settlement.month.toString().padStart(2, '0')}`,
    totalItems: items.length,
    totalMembers: new Set(items.map((item: any) => item.member_id)).size,
    totalAmountBeforeWithholding: 0,
    totalWithholdingTax: 0,
    totalAmountAfterWithholding: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    memberBreakdown: {} as Record<string, any>,
    sourceBreakdown: {
      PROJECT: { count: 0, amount: 0 },
      CONTACT: { count: 0, amount: 0 },
      FEED: { count: 0, amount: 0 },
    },
  }

  items.forEach((item: any) => {
    const beforeWithholding = item.amount_before_withholding || 0
    const withholding = item.withholding_tax || 0
    const afterWithholding = item.amount_after_withholding || 0

    summary.totalAmountBeforeWithholding += beforeWithholding
    summary.totalWithholdingTax += withholding
    summary.totalAmountAfterWithholding += afterWithholding

    if (item.paid) {
      summary.totalPaid += afterWithholding
    } else {
      summary.totalUnpaid += afterWithholding
    }

    // Member breakdown
    const memberKey = item.member_id
    const memberName = item.member?.name || 'Unknown'
    if (!summary.memberBreakdown[memberKey]) {
      summary.memberBreakdown[memberKey] = {
        name: memberName,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        items: [],
      }
    }

    summary.memberBreakdown[memberKey].totalAmount += afterWithholding
    if (item.paid) {
      summary.memberBreakdown[memberKey].paidAmount += afterWithholding
    } else {
      summary.memberBreakdown[memberKey].unpaidAmount += afterWithholding
    }
    summary.memberBreakdown[memberKey].items.push(item)

    // Source breakdown
    if (summary.sourceBreakdown[item.source_type]) {
      summary.sourceBreakdown[item.source_type].count += 1
      summary.sourceBreakdown[item.source_type].amount += afterWithholding
    }
  })

  return summary
}

function generateCSVReport(settlement: any): string {
  const items = settlement.settlement_items || []

  const headers = [
    'Settlement Period',
    'Member Name',
    'Source Type',
    'Source Description',
    'Amount Before Withholding',
    'Withholding Tax',
    'Amount After Withholding',
    'Paid Status',
    'Paid Date',
    'Notes',
  ]

  const rows = items.map((item: any) => [
    `${settlement.year}-${settlement.month.toString().padStart(2, '0')}`,
    item.member?.name || 'Unknown',
    item.source_type,
    getSourceDescription(item),
    formatCurrency(item.amount_before_withholding || 0),
    formatCurrency(item.withholding_tax || 0),
    formatCurrency(item.amount_after_withholding || 0),
    item.paid ? 'Paid' : 'Unpaid',
    item.paid_date || '',
    item.memo || '',
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

function getSourceDescription(item: any): string {
  if (!item.snapshot_json) return item.source_type

  const snapshot = item.snapshot_json

  switch (item.source_type) {
    case 'PROJECT':
      return `Project: ${snapshot.project_name || 'Unknown'}`
    case 'CONTACT':
      return `Contact: ${snapshot.contact_type || 'Unknown'}`
    case 'FEED':
      return `Feed: ${snapshot.feed_type || 'Unknown'}`
    default:
      return item.source_type
  }
}


function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(amount)
}