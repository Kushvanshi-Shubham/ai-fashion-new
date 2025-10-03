import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "badge",
  {
    variants: {
      variant: {
        default: "badge-primary",
        primary: "badge-primary",
        secondary: "badge-secondary", 
        success: "badge-success",
        outline: "border border-gray-300 bg-transparent text-gray-700",
        soft: "bg-gray-100 text-gray-700",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
