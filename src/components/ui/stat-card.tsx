import * as React from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  index?: number
}

export function StatCard({ label, value, description, icon, className, index = 0, ...rest }: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden card-crisp card-crisp-accent rounded-xl p-5 sm:p-6',
        'transition-all motion-rise',
        className
      )}
      style={{ animationDelay: `${0.05 * index}s` }}
      {...rest}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">{label}</div>
          <div className="text-2xl md:text-[1.65rem] font-semibold tabular-nums leading-[1.1] tracking-tight">{value}</div>
        </div>
        {icon && (
          <div className="flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary shadow-soft border border-primary/20">
            {icon}
          </div>
        )}
      </div>
      {description && (
        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
      )}
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition" />
    </div>
  )
}
