import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: { label: string; onClick: () => void; icon?: React.ReactNode; variant?: 'default' | 'outline' | 'secondary' }
  secondaryAction?: { label: string; onClick: () => void }
  variant?: 'default' | 'feature' | 'error' | 'success'
  badge?: { label: string; variant?: 'default' | 'secondary' | 'outline' }
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action, 
  secondaryAction, 
  variant = 'default',
  badge,
  className,
  style,
  ...rest 
}: EmptyStateProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'feature':
        return 'surface-elevated border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10'
      case 'error':
        return 'surface border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10'
      case 'success':
        return 'surface border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10'
      default:
        return 'surface'
    }
  }

  const getIconStyles = () => {
    switch (variant) {
      case 'feature':
        return 'bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 text-primary shadow-glow'
      case 'error':
        return 'bg-gradient-to-br from-destructive/20 via-destructive/15 to-destructive/10 text-destructive'
      case 'success':
        return 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/15 to-emerald-500/10 text-emerald-600'
      default:
        return 'bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 text-primary'
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-12 relative overflow-hidden motion-rise',
        getVariantStyles(),
        className
      )}
      role="status"
      aria-live="polite"
      style={style}
      {...rest}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-accent/5 blur-2xl" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Icon */}
        {icon && (
          <div 
            className={cn(
              'flex size-16 items-center justify-center rounded-2xl relative overflow-hidden motion-scale',
              getIconStyles()
            )}
            style={{ animationDelay: '0.2s' }}
          >
            {icon}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          {badge && (
            <div className="motion-scale" style={{ animationDelay: '0.3s' }}>
              <Badge variant={badge.variant || 'secondary'} className="mx-auto">
                {badge.label}
              </Badge>
            </div>
          )}

          <h3 className="text-2xl font-bold tracking-tight text-balance motion-fade-in" style={{ animationDelay: '0.4s' }}>
            {title}
          </h3>

          {description && (
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-pretty motion-fade-in" style={{ animationDelay: '0.5s' }}>
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2 motion-rise" style={{ animationDelay: '0.6s' }}>
            {action && (
              <Button 
                onClick={action.onClick} 
                variant={action.variant || (variant === 'feature' ? 'default' : 'default')}
                size="lg"
                className="min-w-[140px] group"
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={secondaryAction.onClick} 
                className="min-w-[120px]"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
    </div>
  )
}
