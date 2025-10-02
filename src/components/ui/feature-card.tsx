import * as React from 'react'
import { cn } from '@/lib/utils'

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode
  title: string
  description: string
  index?: number
  gradient?: string
}

export function FeatureCard({ icon, title, description, gradient, className, index = 0, ...rest }: FeatureCardProps) {
  return (
    <div
      data-index={index}
      className={cn(
        'group relative flex h-full flex-col surface overflow-hidden cursor-pointer',
        className
      )}
      role="article"
      {...rest}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient || 'from-primary/5 to-primary/10'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative p-8 flex flex-col h-full">
        {/* Icon */}
        <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 text-primary shadow-soft mb-6 relative overflow-hidden group-hover:scale-110 group-hover:rotate-2 transition-all duration-300">
          {icon}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Text Content */}
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          <p className="text-muted-foreground leading-relaxed text-pretty">
            {description}
          </p>
        </div>

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full opacity-0 group-hover:translate-x-full group-hover:opacity-100 transition-transform duration-600 ease-out" />
    </div>
  )
}
