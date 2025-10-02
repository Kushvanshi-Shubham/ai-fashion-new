import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-280 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 aria-invalid:ring-destructive/30 aria-invalid:border-destructive relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "gradient-primary text-primary-foreground shadow-soft hover:shadow-surface hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/90 text-white shadow-soft hover:shadow-surface hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-destructive/30",
        outline:
          "border border-border bg-background/80 backdrop-blur-sm shadow-soft hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/30 hover:shadow-surface hover:scale-[1.01] active:scale-[0.99]",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground shadow-soft hover:shadow-surface hover:scale-[1.02] active:scale-[0.98]",
        ghost:
          "hover:bg-accent/60 hover:text-accent-foreground hover:backdrop-blur-sm hover:scale-[1.01] active:scale-[0.99]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        premium: "gradient-accent text-white shadow-glow hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/15 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-5",
        sm: "h-8 rounded-md gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-base font-semibold",
        icon: "size-10 rounded-lg",
        xs: "h-7 px-3 text-xs has-[>svg]:px-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
