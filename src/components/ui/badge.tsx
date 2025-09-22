import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/90",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
        brand: "border-transparent bg-brand text-white hover:bg-[oklch(0.675_0.155_55.7)] shadow-sm hover:shadow-md",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs rounded-md",
        lg: "px-3 py-1 text-sm rounded-lg",
        xl: "px-4 py-1.5 text-base rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
