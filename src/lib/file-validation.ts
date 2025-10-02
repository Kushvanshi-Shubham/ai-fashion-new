export interface FileValidationResult {
  valid: boolean
  error?: string
}

export interface FileValidationOptions {
  maxSize?: number
  allowedTypes?: string[]
}

export class FileValidator {
  static validateSize(file: File, maxSize: number): FileValidationResult {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
      }
    }
    return { valid: true }
  }

  static validateType(file: File, allowedTypes: string[]): FileValidationResult {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      }
    }
    return { valid: true }
  }

  static validate(file: File, options: FileValidationOptions): FileValidationResult {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['*/*']
    } = options

    // Size check
    const sizeResult = this.validateSize(file, maxSize)
    if (!sizeResult.valid) {
      return sizeResult
    }

    // Type check
    if (!allowedTypes.includes('*/*')) {
      const typeResult = this.validateType(file, allowedTypes)
      if (!typeResult.valid) {
        return typeResult
      }
    }

    return { valid: true }
  }
}