// src/components/ui/card.tsx - Standardized Card Component
import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
variant?: 'default' | 'bordered' | 'elevated' | 'flat';
highlight?: 'none' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Card: React.FC<CardProps> = ({
className,
variant = 'default',
highlight = 'none',
children,
...props
}) => {
// Base styles that apply to all cards
const baseStyles = "bg-white dark:bg-neutral-800 rounded-lg overflow-hidden";

// Variant-specific styles
const variantStyles = {
    default: "shadow-sm border border-neutral-200 dark:border-neutral-700",
    bordered: "border border-neutral-200 dark:border-neutral-700",
    elevated: "shadow-md",
    flat: "bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800",
};

// Highlight styles (border-left)
const highlightStyles = {
    none: "",
    primary: "border-l-4 border-l-primary-500",
    success: "border-l-4 border-l-success-500",
    warning: "border-l-4 border-l-warning-500",
    danger: "border-l-4 border-l-danger-500",
    info: "border-l-4 border-l-info-500",
};

return (
    <div
    className={cn(
        baseStyles,
        variantStyles[variant],
        highlightStyles[highlight],
        className
    )}
    {...props}
    >
    {children}
    </div>
);
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
className,
children,
...props
}) => {
return (
    <div
    className={cn(
        "px-6 py-4 border-b border-neutral-200 dark:border-neutral-700",
        className
    )}
    {...props}
    >
    {children}
    </div>
);
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
className,
children,
...props
}) => {
return (
    <h3
    className={cn(
        "text-lg font-semibold text-neutral-900 dark:text-neutral-100",
        className
    )}
    {...props}
    >
    {children}
    </h3>
);
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
className,
children,
...props
}) => {
return (
    <div
    className={cn(
        "px-6 py-4",
        className
    )}
    {...props}
    >
    {children}
    </div>
);
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
className,
children,
...props
}) => {
return (
    <div
    className={cn(
        "px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900",
        className
    )}
    {...props}
    >
    {children}
    </div>
);
};

