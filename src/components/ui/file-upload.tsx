/**
 * File Upload Component
 * Supports multiple file uploads with preview and validation
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // MB
  onFilesChange?: (files: File[]) => void
  className?: string
  disabled?: boolean
}

interface FilePreview {
  file: File
  preview?: string
}

export function FileUpload({
  accept = '.pdf,.jpg,.jpeg,.png',
  multiple = true,
  maxFiles = 5,
  maxSize = 10,
  onFilesChange,
  className,
  disabled = false
}: FileUploadProps) {
  const [files, setFiles] = useState<FilePreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `파일 크기가 ${maxSize}MB를 초과합니다`
    }

    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.type

    if (!allowedTypes.some(type =>
      type === fileExtension ||
      type === mimeType ||
      (type.startsWith('.') && fileExtension === type) ||
      (type.includes('/') && mimeType.startsWith(type.split('/')[0]))
    )) {
      return `지원하지 않는 파일 형식입니다. (${accept})`
    }

    return null
  }, [accept, maxSize])

  const processFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const currentFileCount = files.length

    if (currentFileCount + fileArray.length > maxFiles) {
      setError(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`)
      return
    }

    const validFiles: FilePreview[] = []
    const errors: string[] = []

    for (const file of fileArray) {
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
        continue
      }

      // Create preview for images
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      validFiles.push({ file, preview })
    }

    if (errors.length > 0) {
      setError(errors.join('\n'))
    } else {
      setError('')
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles]
      setFiles(updatedFiles)
      onFilesChange?.(updatedFiles.map(f => f.file))
    }
  }, [files, maxFiles, validateFile, onFilesChange])

  const removeFile = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)

    // Revoke object URL to prevent memory leaks
    const removedFile = files[index]
    if (removedFile?.preview) {
      URL.revokeObjectURL(removedFile.preview)
    }

    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles.map(f => f.file))
    setError('')
  }, [files, onFilesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [disabled])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [disabled, processFiles])

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-6 w-6" />
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-6 w-6" />
    } else {
      return <File className="h-6 w-6" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          dragActive
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={openFileDialog}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className={cn(
            'h-12 w-12 mb-4',
            dragActive ? 'text-orange-500' : 'text-gray-400'
          )} />
          <p className="text-lg font-medium mb-2">
            파일을 여기로 드래그하거나 클릭하여 선택
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {accept} 형식, 최대 {maxSize}MB, {maxFiles}개까지
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="pointer-events-none"
          >
            파일 선택
          </Button>
        </CardContent>
      </Card>

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">업로드된 파일 ({files.length}/{maxFiles})</h4>
          <div className="space-y-2">
            {files.map((filePreview, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  {/* File Icon or Preview */}
                  <div className="flex-shrink-0">
                    {filePreview.preview ? (
                      <img
                        src={filePreview.preview}
                        alt={filePreview.file.name}
                        className="h-12 w-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded border">
                        {getFileIcon(filePreview.file)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {filePreview.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(filePreview.file.size)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {filePreview.file.type || '알 수 없음'}
                      </Badge>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    disabled={disabled}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}