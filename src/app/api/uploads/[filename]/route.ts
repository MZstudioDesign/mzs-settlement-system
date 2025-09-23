/**
 * API Route: /api/uploads/[filename]
 * Serves uploaded files
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename

    // Validate filename (prevent path traversal)
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: '유효하지 않은 파일명입니다' },
        { status: 400 }
      )
    }

    const filePath = path.join(UPLOAD_DIR, filename)

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Determine content type based on file extension
    const extension = path.extname(filename).toLowerCase()
    const contentType = getContentType(extension)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000', // 1 year
      },
    })

  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json(
      { error: '파일을 읽는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.csv': 'text/csv',
  }

  return contentTypes[extension] || 'application/octet-stream'
}