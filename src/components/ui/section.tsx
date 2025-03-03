// src/components/ui/section.tsx - Standardized Section Component
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
title: string;
icon?: React.ReactNode;
isCollapsible?: boolean;
defaultCollapsed?: boolean;
variant?: 'default' | 'bordered' | 'elevated' | 'flat';
highlight?: 'none' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
actions?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
title,
icon,
isCollapsible = false,
defaultCollapsed = false,
variant = 'default',
highlight = 'none',
actions,
children,
className,
...props
}) => {
const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

// Base styles that apply to all sections
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
    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
        {actions}
        {isCollapsible && (
            <button
            type="button"
            className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none"
            onClick={() => setIsCollapsed(!isCollapsed)}
            >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
        )}
        </div>
    </div>
    {!isCollapsed && <div className="px-6 py-4">{children}</div>}
    </div>
);
};