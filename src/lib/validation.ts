import sharp from 'sharp'
import { FileValidator, FileValidationOptions } from './file-validation'

export interface ImageValidationOptions extends FileValidationOptions {
  maxDimension?: number
  minDimension?: number
  maxOptimizedDimension?: number
  jpegQuality?: number
}

export interface ImageValidationResult {
  valid: boolean
  error?: string
  optimizedBuffer?: Buffer
  metadata?: sharp.Metadata & {
    duration?: number // Processing time in ms
  }
}

const defaultImageOptions: Required<ImageValidationOptions> = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxDimension: 4096,
  minDimension: 50,
  maxOptimizedDimension: 2048,
  jpegQuality: 85
}

export async function validateImage(
  file: File,
  options: Partial<ImageValidationOptions> = {}
): Promise<ImageValidationResult> {
  const startTime = Date.now()
  const opts = { ...defaultImageOptions, ...options }

  // Basic file validation
  const fileResult = FileValidator.validate(file, {
    maxSize: opts.maxSize,
    allowedTypes: opts.allowedTypes
  })

  if (!fileResult.valid) {
    return fileResult
  }

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate image using sharp
    const image = sharp(buffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        error: 'Invalid image dimensions'
      }
    }

    // Dimension checks
    if (metadata.width > opts.maxDimension || metadata.height > opts.maxDimension) {
      return {
        valid: false,
        error: `Image dimensions (${metadata.width}x${metadata.height}) exceed maximum allowed size of ${opts.maxDimension}px`
      }
    }

    if (metadata.width < opts.minDimension || metadata.height < opts.minDimension) {
      return {
        valid: false,
        error: `Image dimensions (${metadata.width}x${metadata.height}) below minimum required size of ${opts.minDimension}px`
      }
    }

    // Calculate target dimensions while maintaining aspect ratio
    let targetWidth = metadata.width
    let targetHeight = metadata.height

    if (targetWidth > opts.maxOptimizedDimension || targetHeight > opts.maxOptimizedDimension) {
      const aspectRatio = targetWidth / targetHeight
      if (aspectRatio > 1) {
        targetWidth = opts.maxOptimizedDimension
        targetHeight = Math.round(opts.maxOptimizedDimension / aspectRatio)
      } else {
        targetHeight = opts.maxOptimizedDimension
        targetWidth = Math.round(opts.maxOptimizedDimension * aspectRatio)
      }
    }

    // Optimize image
    const optimizedBuffer = await image
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: opts.jpegQuality,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer()

    const duration = Date.now() - startTime

    return {
      valid: true,
      optimizedBuffer,
      metadata: {
        ...metadata,
        duration
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error 
        ? `Image processing failed: ${error.message}`
        : 'Invalid or corrupted image file'
    }
  }
}