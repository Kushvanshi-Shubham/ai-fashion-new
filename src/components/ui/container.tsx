import * as React from 'react'
import { cn } from '@/lib/utils'

// Responsive max-width wrapper with consistent horizontal padding
export const Container = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function Container(
  { className, ...props }, ref
) {
  return (
    <div
      ref={ref}
      className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  )
})
