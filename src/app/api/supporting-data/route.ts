/**
 * API Route: /api/supporting-data
 * Handles GET operations for supporting data (members, channels, categories)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supportingDataApi } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let result

    switch (type) {
      case 'members':
        result = await supportingDataApi.getMembers()
        break
      case 'channels':
        result = await supportingDataApi.getChannels()
        break
      case 'categories':
        result = await supportingDataApi.getCategories()
        break
      case 'all':
        // Get all supporting data in parallel
        const [membersResult, channelsResult, categoriesResult] = await Promise.all([
          supportingDataApi.getMembers(),
          supportingDataApi.getChannels(),
          supportingDataApi.getCategories(),
        ])

        if (membersResult.error || channelsResult.error || categoriesResult.error) {
          return NextResponse.json(
            { error: 'Failed to fetch supporting data' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          data: {
            members: membersResult.data,
            channels: channelsResult.data,
            categories: categoriesResult.data,
          },
        })

      default:
        return NextResponse.json(
          { error: 'Type parameter is required (members, channels, categories, or all)' },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/supporting-data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}