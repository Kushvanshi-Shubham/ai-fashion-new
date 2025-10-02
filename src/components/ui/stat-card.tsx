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
        'group relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90',
        'hover:shadow-md hover:border-primary/40 transition-all motion-rise',
        className
      )}
      style={{ animationDelay: `${0.05 * index}s` }}
      {...rest}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.70rem] uppercase tracking-wide text-muted-foreground font-medium mb-1">{label}</div>
          <div className="text-2xl font-semibold tabular-nums leading-none">{value}</div>
        </div>
        {icon && (
          <div className="flex size-10 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
            {icon}
          </div>
        )}
      </div>
      {description && (
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
      )}
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
    </div>
  )
}
