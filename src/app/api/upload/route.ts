/**
 * API Route: /api/upload
 * Handles file uploads with validation and storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
]

export async function POST(request: NextRequest) {
  try {
    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const data = await request.formData()
    const files: File[] = []

    // Extract files from FormData
    for (const [key, value] of data.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: '업로드할 파일이 없습니다' },
        { status: 400 }
      )
    }

    const uploadedFiles = []
    const errors = []

    for (const file of files) {
      try {
        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`)
          continue
        }

        // Generate unique filename
        const fileExtension = path.extname(file.name)
        const fileName = `${randomUUID()}${fileExtension}`
        const filePath = path.join(UPLOAD_DIR, fileName)

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        uploadedFiles.push({
          originalName: file.name,
          fileName: fileName,
          filePath: `/uploads/${fileName}`,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        })

      } catch (error) {
        console.error('File upload error:', error)
        errors.push(`${file.name}: 업로드 중 오류가 발생했습니다`)
      }
    }

    // Return results
    const response: any = {
      success: uploadedFiles.length > 0,
      uploaded: uploadedFiles,
      count: uploadedFiles.length
    }

    if (errors.length > 0) {
      response.errors = errors
      response.partialSuccess = uploadedFiles.length > 0
    }

    const status = uploadedFiles.length > 0 ? 200 : 400
    return NextResponse.json(response, { status })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      {
        error: '파일 업로드 중 서버 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'File upload endpoint',
    maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
    allowedTypes: ALLOWED_TYPES,
    uploadDirectory: UPLOAD_DIR
  })
}

function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기가 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다`
    }
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. 허용 형식: ${ALLOWED_TYPES.join(', ')}`
    }
  }

  // Check filename
  if (!file.name || file.name.length > 255) {
    return {
      valid: false,
      error: '파일명이 유효하지 않습니다'
    }
  }

  return { valid: true }
}