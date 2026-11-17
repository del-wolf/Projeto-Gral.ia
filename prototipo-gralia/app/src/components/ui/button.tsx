import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
// shadcn/ui Button pattern: local source, cva variants and Tailwind utilities.
const buttonVariants=cva('inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 min-h-11 px-4 py-2',{variants:{variant:{default:'bg-primary text-primary-foreground hover:brightness-110',secondary:'border border-border bg-surface text-foreground hover:bg-muted',destructive:'bg-danger text-white'},size:{default:'',sm:'min-h-10 px-3'}},defaultVariants:{variant:'default',size:'default'}});
export function Button({className,variant,size,...props}:React.ComponentProps<'button'>&VariantProps<typeof buttonVariants>){return <button className={twMerge(clsx(buttonVariants({variant,size}),className))} {...props}/>;}
