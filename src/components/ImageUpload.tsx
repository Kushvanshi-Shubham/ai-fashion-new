'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'
import { UploadedImage } from '@/types'

interface ImageUploadProps {
  onUpload: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  accept?: string
  disabled?: boolean
  className?: string
}

export default function ImageUpload({
  onUpload,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = 'image/*',
  disabled = false,
  className
}: ImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please upload only image files'
    }
    if (file.size > maxSize) {
      return `File size must be less than ${formatBytes(maxSize)}`
    }
    return null
  }, [maxSize])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    if (fileArray.length + uploadedFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`)
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      alert('Upload errors:\n' + errors.join('\n'))
    }

    if (validFiles.length > 0) {
      const newUploadedFiles = validFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        uploadProgress: 100,
        status: 'uploaded' as const
      }))

      setUploadedFiles(prev => [...prev, ...newUploadedFiles])
      onUpload(validFiles)
    }
  }, [uploadedFiles.length, maxFiles, validateFile, onUpload])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }, [disabled])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }, [disabled, handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const updatedFiles = prev.filter(file => {
        if (file.id === fileId) {
          URL.revokeObjectURL(file.previewUrl)
          return false
        }
        return true
      })
      return updatedFiles
    })
  }, [])

  const clearAll = useCallback(() => {
    uploadedFiles.forEach(file => {
      URL.revokeObjectURL(file.previewUrl)
    })
    setUploadedFiles([])
  }, [uploadedFiles])

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500",
          disabled && "opacity-50 cursor-not-allowed",
          "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Upload images"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {isDragActive ? (
              <Upload className="w-12 h-12 text-blue-500 animate-bounce" />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isDragActive ? 'Drop images here' : 'Drag and drop fashion images here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              or click to browse • Max {maxFiles} files • Up to {formatBytes(maxSize)} each
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload className="w-5 h-5 mr-2" />
            Choose Images
          </button>
        </div>
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Uploaded Images ({uploadedFiles.length})
            </h3>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={file.previewUrl}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                  {file.file.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {formatBytes(file.file.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
