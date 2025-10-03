'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'gradient'
}

export function LoadingSpinner({ size = 'md', variant = 'default', className, ...props }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)} {...props}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn('rounded-full bg-primary', size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4')}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn('rounded-full bg-primary/20 animate-pulse', sizeClasses[size], className)}
        style={{ animationDuration: '1.5s' }}
        {...props}
      />
    )
  }

  if (variant === 'gradient') {
    return (
      <div className={cn('relative', sizeClasses[size], className)} {...props}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-20" />
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background: 'conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent)',
            animationDuration: '1s'
          }}
        />
        <div className="absolute inset-1 rounded-full bg-background" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full border-2 border-gray-200/30 animate-spin',
        sizeClasses[size],
        className
      )}
      style={{
        borderTopColor: 'hsl(var(--primary))',
        borderRightColor: 'hsl(var(--primary))',
        animationDuration: '1s'
      }}
      {...props}
    />
  )
}

interface LoadingStateProps {
  title?: string
  description?: string
  variant?: 'default' | 'minimal' | 'feature'
}

export function LoadingState({ title = 'Loading...', description, variant = 'default' }: LoadingStateProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingSpinner size="lg" variant="gradient" />
      </div>
    )
  }

  if (variant === 'feature') {
    return (
      <div className="surface p-8 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div className="relative">
            <LoadingSpinner size="xl" variant="gradient" />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: -360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>
          </div>
        </motion.div>
        
        <div className="space-y-2">
          <motion.h3 
            className="text-xl font-semibold text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {title}
          </motion.h3>
          {description && (
            <motion.p 
              className="text-muted-foreground max-w-sm mx-auto text-pretty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {description}
            </motion.p>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="flex flex-col items-center justify-center p-8 text-center space-y-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <LoadingSpinner size="lg" variant="dots" />
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm text-pretty">{description}</p>
        )}
      </div>
    </motion.div>
  )
}
