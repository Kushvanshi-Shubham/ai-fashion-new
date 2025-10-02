import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-all duration-200 ease-out overflow-hidden relative",
  {
    variants: {
      variant: {
        default:
          "border-transparent gradient-primary text-primary-foreground shadow-soft [a&]:hover:shadow-surface [a&]:hover:scale-105",
        secondary:
          "border-border/40 bg-secondary/80 text-secondary-foreground backdrop-blur-sm [a&]:hover:bg-secondary/90 [a&]:hover:border-border/60",
        destructive:
          "border-transparent bg-gradient-to-r from-destructive to-destructive/90 text-white shadow-soft [a&]:hover:shadow-surface [a&]:hover:scale-105",
        outline:
          "border-border/60 bg-background/80 text-foreground backdrop-blur-sm [a&]:hover:bg-accent/50 [a&]:hover:text-accent-foreground [a&]:hover:border-primary/40",
        soft:
          "border-primary/20 bg-primary/10 text-primary backdrop-blur-sm [a&]:hover:bg-primary/15 [a&]:hover:border-primary/30",
        success:
          "border-transparent bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-soft [a&]:hover:shadow-surface",
        warning:
          "border-transparent bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-soft [a&]:hover:shadow-surface",
        premium:
          "border-transparent gradient-accent text-white shadow-glow [a&]:hover:shadow-elevated [a&]:hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
