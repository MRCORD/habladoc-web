// src/components/ui/badge.tsx - Updated with new primary color
import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  "inline-flex items-center rounded-full text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300",
        primary: "bg-[rgba(0,102,204,0.1)] text-[rgb(0,102,204)] dark:bg-[rgba(0,102,204,0.3)] dark:text-[rgb(173,214,255)]",
        secondary: "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300",
        success: "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300",
        warning: "bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300",
        danger: "bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300",
        info: "bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300",
        outline: "border border-neutral-200 dark:border-neutral-700",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  withDot?: boolean;
  dotColor?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, withDot = false, dotColor = 'default', children, ...props }, ref) => {
    // Updated dot colors to match new primary
    const dotColorVar = {
      default: 'var(--color-neutral-500)',
      primary: 'rgb(0, 102, 204)',
      success: 'var(--color-success-500)',
      warning: 'var(--color-warning-500)',
      danger: 'var(--color-danger-500)',
      info: 'var(--color-info-500)',
    };

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {withDot && (
          <span 
            className="mr-1.5 h-2 w-2 rounded-full animate-pulse" 
            style={{ backgroundColor: dotColor === 'primary' ? 'rgb(0, 102, 204)' : `rgb(${dotColorVar[dotColor]})` }}
          />
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";