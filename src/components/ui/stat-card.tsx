'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
  className?: string
}

const variantStyles = {
  default: 'bg-gradient-to-br from-background to-muted/20',
  primary: 'bg-gradient-to-br from-primary/5 to-primary/10',
  success: 'bg-gradient-to-br from-green-50 to-green-100/50',
  warning: 'bg-gradient-to-br from-orange-50 to-orange-100/50',
  destructive: 'bg-gradient-to-br from-red-50 to-red-100/50'
}

const iconStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-orange-100 text-orange-600',
  destructive: 'bg-red-100 text-red-600'
}

const valueStyles = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-green-700',
  warning: 'text-orange-700',
  destructive: 'text-red-700'
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  className
}: StatCardProps) {
  return (
    <Card className={cn(
      'border-none shadow-sm transition-all duration-200 hover:shadow-md',
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className={cn(
              'text-3xl font-bold tracking-tight',
              valueStyles[variant]
            )}>
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className={cn(
                  'font-medium',
                  trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                <span>{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-lg transition-colors duration-200',
            iconStyles[variant]
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}