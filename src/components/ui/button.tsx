// src/components/ui/button.tsx - Standardized Button Component
import React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
"inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
{
    variants: {
    variant: {
        primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:ring-neutral-500 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600",
        outline: "border border-primary-200 text-primary-700 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/30",
        ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-500 dark:text-neutral-300 dark:hover:bg-neutral-800",
        link: "bg-transparent text-primary-500 hover:underline focus-visible:ring-primary-500",
        danger: "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus-visible:ring-danger-500",
        success: "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus-visible:ring-success-500",
        warning: "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 focus-visible:ring-warning-500",
    },
    size: {
        xs: "h-7 px-2 text-xs rounded",
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 py-2 rounded-md",
        lg: "h-12 px-6 py-3 rounded-lg text-base",
        icon: "h-10 w-10",
    },
    fullWidth: {
        true: "w-full",
    },
    },
    defaultVariants: {
    variant: "primary",
    size: "md",
    fullWidth: false,
    },
}
);

export interface ButtonProps 
extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
asChild?: boolean;
isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
({ className, variant, size, fullWidth, asChild = false, isLoading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
    <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
    >
        {isLoading ? (
        <>
            <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
            </svg>
            <span>Loading...</span>
        </>
        ) : (
        children
        )}
    </Comp>
    );
}
);

Button.displayName = "Button";