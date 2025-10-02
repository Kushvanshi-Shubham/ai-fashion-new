'use client'
import React, { useCallback, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface ImageFile extends File {
  id: string
  preview: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
}

interface ImageUploadProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  existingFiles?: ImageFile[]
  onRemoveFile?: (id: string) => void
  className?: string
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const DEFAULT_MAX_FILES = 10

export default function ImageUpload({
  onFilesSelected,
  disabled = false,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  existingFiles = [],
  onRemoveFile,
  className = ''
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLDivElement>(null)

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [disabled])

  // Handle file input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return

    const files = Array.from(e.target.files || [])
    handleFiles(files)

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [disabled])

  // Process and validate files
  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) return

    const newErrors: string[] = []
    const validFiles: File[] = []

    // Check total files limit
    if (existingFiles.length + files.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed. Currently have ${existingFiles.length}.`)
      return
    }

    files.forEach(file => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        newErrors.push(`${file.name}: Invalid file type. Accepted: ${acceptedTypes.join(', ')}`)
        return
      }

      // Check file size
      if (file.size > maxSize) {
        newErrors.push(`${file.name}: File too large (${Math.round(file.size / 1024 / 1024)}MB). Max: ${Math.round(maxSize / 1024 / 1024)}MB`)
        return
      }

      // Check for duplicates
      const isDuplicate = existingFiles.some(existing => 
        existing.name === file.name && existing.size === file.size
      )

      if (isDuplicate) {
        newErrors.push(`${file.name}: File already uploaded`)
        return
      }

      validFiles.push(file)
    })

    setErrors(newErrors)

    if (validFiles.length > 0) {
      setUploading(true)
      
      // Simulate upload delay for better UX
      setTimeout(() => {
        onFilesSelected(validFiles)
        setUploading(false)
      }, 500)
    }
  }, [existingFiles, maxFiles, acceptedTypes, maxSize, onFilesSelected])

  // Clear errors after 5 seconds
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => setErrors([]), 5000)
      return () => clearTimeout(timer)
    }
  }, [errors])

  // Click to upload
  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }, [disabled])

  // Remove file
  const handleRemoveFile = useCallback((id: string, preview: string) => {
    // Clean up object URL
    URL.revokeObjectURL(preview)
    onRemoveFile?.(id)
  }, [onRemoveFile])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      existingFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [])

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'pending':
        return <ImageIcon className="w-4 h-4 text-gray-400" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <ImageIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: ImageFile['status']) => {
    switch (status) {
      case 'pending':
        return 'border-gray-200'
      case 'processing':
        return 'border-blue-200 bg-blue-50'
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'failed':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        ref={uploadRef}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
          aria-label="Upload images"
        />

        <AnimatePresence>
          {uploading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center space-y-2"
            >
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Processing files...</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center space-y-2"
            >
              <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">
                  {acceptedTypes.join(', ').replace(/image\//g, '').toUpperCase()} up to {Math.round(maxSize / 1024 / 1024)}MB each
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {existingFiles.length}/{maxFiles} files
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {errors.map((error, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md"
              >
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files Grid */}
      {existingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({existingFiles.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {existingFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`
                    relative group border rounded-lg overflow-hidden
                    ${getStatusColor(file.status)}
                  `}
                >
                  {/* Image Preview */}
                  <div className="aspect-square relative">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Status Overlay */}
                    <div className="absolute top-2 left-2">
                      {getStatusIcon(file.status)}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(file.id, file.preview)
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                      title="Remove file"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Progress Bar */}
                    {file.status === 'processing' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-200">
                        <motion.div
                          className="h-1 bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-700 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(file.size / 1024)} KB
                    </p>
                    
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1" title={file.error}>
                        {file.error.length > 30 ? `${file.error.substring(0, 30)}...` : file.error}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

// Export types for external use
export type { ImageFile, ImageUploadProps }