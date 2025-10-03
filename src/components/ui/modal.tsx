'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  showClose?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  className?: string
}

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

interface AlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description: string
  buttonText?: string
  onButton?: () => void
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-7xl mx-4'
}

const variantConfig = {
  default: {
    className: '',
    iconColor: 'text-primary'
  },
  destructive: {
    className: 'border-destructive/20',
    iconColor: 'text-destructive'
  },
  success: {
    className: 'border-green-500/20',
    iconColor: 'text-green-600'
  },
  warning: {
    className: 'border-yellow-500/20',
    iconColor: 'text-yellow-600'
  }
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  variant = 'default',
  showClose = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  className
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, closeOnEscape, onOpenChange])

  const config = variantConfig[variant]

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOnOverlay ? () => onOpenChange(false) : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative w-full m-4 max-h-[90vh] overflow-hidden',
              sizeClasses[size]
            )}
          >
            <Card className={cn(config.className, className)}>
              {(title || description || showClose) && (
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      {title && <CardTitle className="text-xl font-semibold">{title}</CardTitle>}
                      {description && <p className="text-muted-foreground mt-1">{description}</p>}
                    </div>
                    {showClose && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onOpenChange(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
              )}
              
              <CardContent className="max-h-[70vh] overflow-y-auto">
                {children}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="w-6 h-6 text-destructive" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
      default:
        return <Info className="w-6 h-6 text-primary" />
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      variant={variant}
      closeOnOverlay={!isProcessing && !loading}
      closeOnEscape={!isProcessing && !loading}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing || loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isProcessing || loading}
          >
            {isProcessing || loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function AlertModal({
  open,
  onOpenChange,
  type,
  title,
  description,
  buttonText = 'OK',
  onButton
}: AlertModalProps) {
  const handleButton = () => {
    onButton?.()
    onOpenChange(false)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-destructive" />
      default:
        return <Info className="w-6 h-6 text-primary" />
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      variant={type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'default'}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleButton}>
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Hook for managing modal state
export function useModal(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen)

  const openModal = () => setOpen(true)
  const closeModal = () => setOpen(false)
  const toggleModal = () => setOpen(prev => !prev)

  return {
    open,
    openModal,
    closeModal,
    toggleModal,
    setOpen
  }
}

// Hook for confirmation dialogs
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description?: string
    onConfirm?: () => void | Promise<void>
    variant?: 'default' | 'destructive' | 'warning'
  }>({
    open: false,
    title: '',
    variant: 'default'
  })

  const confirm = (options: {
    title: string
    description?: string
    variant?: 'default' | 'destructive' | 'warning'
  }) => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...options,
        open: true,
        onConfirm: () => {
          resolve(true)
          setState(prev => ({ ...prev, open: false }))
        }
      })
    })
  }

  const confirmModal = (
    <ConfirmModal
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          setState(prev => ({ ...prev, open: false }))
        }
      }}
      title={state.title}
      {...(state.description && { description: state.description })}
      variant={state.variant || 'default'}
      onConfirm={state.onConfirm || (() => {})}
      onCancel={() => setState(prev => ({ ...prev, open: false }))}
    />
  )

  return { confirm, confirmModal }
}