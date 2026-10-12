import type { ButtonHTMLAttributes } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
const variants = cva('button', { variants: { variant: { default: 'button-default', primary: 'button-primary', ghost: 'button-ghost' } }, defaultVariants: { variant: 'default' } })
export function Button({ className, variant = 'default', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'ghost' }) {
  return <button type={type} className={cn(variants({ variant }), className)} {...props} />
}
