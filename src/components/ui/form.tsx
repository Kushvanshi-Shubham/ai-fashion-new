'use client'

import React, { createContext, useContext, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FormContextType {
  errors: Record<string, string>
  touched: Record<string, boolean>
  values: Record<string, unknown>
  isSubmitting: boolean
}

const FormContext = createContext<FormContextType>({
  errors: {},
  touched: {},
  values: {},
  isSubmitting: false
})

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string
  description?: string
  errors?: Record<string, string>
  touched?: Record<string, boolean>
  values?: Record<string, unknown>
  isSubmitting?: boolean
  showSubmitButton?: boolean
  submitText?: string
  resetText?: string
  onSubmit: (e: React.FormEvent) => void
  onReset?: () => void
  variant?: 'default' | 'bordered' | 'minimal'
}

export function Form({
  title,
  description,
  errors = {},
  touched = {},
  values = {},
  isSubmitting = false,
  showSubmitButton = true,
  submitText = 'Submit',
  resetText = 'Reset',
  onSubmit,
  onReset,
  variant = 'default',
  className,
  children,
  ...props
}: FormProps) {
  const formContext: FormContextType = {
    errors,
    touched,
    values,
    isSubmitting
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(e)
  }

  const FormContent = () => (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)} {...props}>
      {children}
      {showSubmitButton && (
        <FormActions>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="min-w-24"
          >
            {isSubmitting ? 'Submitting...' : submitText}
          </Button>
          {onReset && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onReset}
              disabled={isSubmitting}
            >
              {resetText}
            </Button>
          )}
        </FormActions>
      )}
    </form>
  )

  if (variant === 'minimal') {
    return (
      <FormContext.Provider value={formContext}>
        <FormContent />
      </FormContext.Provider>
    )
  }

  return (
    <FormContext.Provider value={formContext}>
      <Card className={cn(variant === 'bordered' && 'border-2')}>
        {(title || description) && (
          <CardHeader className="pb-4">
            {title && <CardTitle className="text-xl font-semibold">{title}</CardTitle>}
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </CardHeader>
        )}
        <CardContent>
          <FormContent />
        </CardContent>
      </Card>
    </FormContext.Provider>
  )
}

interface FormFieldProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  children: React.ReactElement
  className?: string
}

export function FormField({ 
  name, 
  label, 
  description, 
  required = false, 
  children, 
  className 
}: FormFieldProps) {
  const { errors, touched } = useContext(FormContext)
  const fieldId = useId()
  
  const error = touched[name] ? errors[name] : undefined
  const hasError = !!error

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label 
          htmlFor={fieldId} 
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            hasError && 'text-destructive',
            required && 'after:content-["*"] after:ml-1 after:text-destructive'
          )}
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id: fieldId,
          name,
          'aria-invalid': hasError ? 'true' : 'false',
          'aria-describedby': error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined,
          className: cn(
            (children as React.ReactElement & { props: { className?: string } }).props?.className,
            hasError && 'border-destructive focus:border-destructive focus:ring-destructive/20'
          )
        })}
        
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-destructive" />
        )}
      </div>

      <AnimatePresence>
        {description && !error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            id={`${fieldId}-description`}
            className="text-xs text-muted-foreground"
          >
            {description}
          </motion.p>
        )}
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            id={`${fieldId}-error`}
            className="text-xs text-destructive flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="pb-2 border-b border-border/50">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

interface FormActionsProps {
  children: React.ReactNode
  align?: 'left' | 'right' | 'center' | 'between'
  className?: string
}

export function FormActions({ children, align = 'left', className }: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    right: 'justify-end',
    center: 'justify-center',
    between: 'justify-between'
  }

  return (
    <div className={cn('flex items-center gap-3 pt-4', alignClasses[align], className)}>
      {children}
    </div>
  )
}

interface FormAlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export function FormAlert({ 
  type, 
  title, 
  message, 
  dismissible = false, 
  onDismiss,
  className 
}: FormAlertProps) {
  const config = {
    success: {
      icon: CheckCircle,
      className: 'bg-green-50 border-green-200 text-green-800',
      iconClassName: 'text-green-600'
    },
    error: {
      icon: AlertCircle,
      className: 'bg-red-50 border-red-200 text-red-800',
      iconClassName: 'text-red-600'
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconClassName: 'text-yellow-600'
    },
    info: {
      icon: Info,
      className: 'bg-blue-50 border-blue-200 text-blue-800',
      iconClassName: 'text-blue-600'
    }
  }

  const { icon: Icon, className: typeClassName, iconClassName } = config[type]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'relative rounded-lg border p-4 flex items-start gap-3',
        typeClassName,
        className
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconClassName)} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-medium mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-transparent"
          onClick={onDismiss}
        >
          ×
        </Button>
      )}
    </motion.div>
  )
}

// Form validation utilities
export const validators = {
  required: (value: unknown) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required'
    }
    return null
  },
  
  email: (value: string) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'Please enter a valid email address'
  },
  
  minLength: (min: number) => (value: string) => {
    if (!value) return null
    return value.length >= min ? null : `Must be at least ${min} characters`
  },
  
  maxLength: (max: number) => (value: string) => {
    if (!value) return null
    return value.length <= max ? null : `Must be no more than ${max} characters`
  },
  
  pattern: (regex: RegExp, message: string) => (value: string) => {
    if (!value) return null
    return regex.test(value) ? null : message
  },
  
  url: (value: string) => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return 'Please enter a valid URL'
    }
  }
}

// Compose multiple validators
export function compose(...validators: Array<(value: unknown) => string | null>) {
  return (value: unknown) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return null
  }
}