import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  bleed?: boolean
  subdued?: boolean
  borderTop?: boolean
  borderBottom?: boolean
}

export function PageSection({
  className,
  children,
  bleed = false,
  subdued = false,
  borderTop,
  borderBottom,
  ...rest
}: PageSectionProps) {
  return (
    <section
      className={cn(
        'relative py-12 md:py-16',
        subdued && 'bg-muted/30',
        borderTop && 'border-t',
        borderBottom && 'border-b',
        !bleed && 'px-0',
        className
      )}
      {...rest}
    >
      {children}
    </section>
  )
}
