// src/components/ui/badge.tsx - Standardized Badge Component
import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
{
    variants: {
    variant: {
        default: "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300",
        primary: "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300",
        secondary: "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300",
        success: "bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300",
        warning: "bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300",
        danger: "bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300",
        info: "bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-300",
        outline: "border border-neutral-200 dark:border-neutral-700",
    },
    size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
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
    const dotColorMap = {
    default: 'bg-neutral-500',
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-info-500',
    };

    return (
    <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
    >
        {withDot && (
        <span className={`mr-1.5 h-2 w-2 rounded-full ${dotColorMap[dotColor]} animate-pulse`}></span>
        )}
        {children}
    </div>
    );
}
);

Badge.displayName = "Badge";