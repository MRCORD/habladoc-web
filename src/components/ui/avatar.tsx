// src/components/ui/avatar.tsx - Standardized Avatar Component
import React from 'react';
import { cn } from '@/lib/utils';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { User } from 'lucide-react';

const Avatar = React.forwardRef<
React.ElementRef<typeof AvatarPrimitive.Root>,
React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
<AvatarPrimitive.Root
    ref={ref}
    className={cn(
    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
    className
    )}
    {...props}
/>
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
React.ElementRef<typeof AvatarPrimitive.Image>,
React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
<AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
/>
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
React.ElementRef<typeof AvatarPrimitive.Fallback>,
React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
<AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
    "flex h-full w-full items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700",
    className
    )}
    {...props}
/>
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const UserAvatar = React.forwardRef<
React.ElementRef<typeof Avatar>,
React.ComponentPropsWithoutRef<typeof Avatar> & {
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
}
>(({ src, alt, size = 'md', className, ...props }, ref) => {
const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
} as const;

return (
    <Avatar ref={ref} className={cn(sizeClasses[size], className)} {...props}>
    {src ? (
        <AvatarImage src={src} alt={alt || 'Avatar'} />
    ) : (
        <AvatarFallback>
        <User className="h-5 w-5 text-neutral-500" />
        </AvatarFallback>
    )}
    </Avatar>
);
});
UserAvatar.displayName = 'UserAvatar';

export { Avatar, AvatarImage, AvatarFallback, UserAvatar };