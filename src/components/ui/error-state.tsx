import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className, ...rest }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center', className)}
      {...rest}
    >
      <h3 className="text-base font-semibold tracking-tight mb-2 text-destructive">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="border-destructive/40 hover:bg-destructive/10">
          Try again
        </Button>
      )}
    </div>
  )
}
