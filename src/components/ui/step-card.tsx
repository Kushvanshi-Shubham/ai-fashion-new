import * as React from 'react'
import { cn } from '@/lib/utils'

interface StepCardProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number
  title: string
  description: string
  icon?: React.ReactNode
}

export function StepCard({ step, title, description, icon, className, ...rest }: StepCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center text-center rounded-xl border bg-card/70 backdrop-blur p-6 shadow-sm transition-all',
        'hover:shadow-md hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/40 outline-none',
        className
      )}
      {...rest}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-4">
        {icon}
      </div>
      <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Step {step}</div>
      <h3 className="font-medium leading-snug mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[18ch] md:max-w-none">{description}</p>
    </div>
  )
}
