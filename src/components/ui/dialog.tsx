import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dialog({ open, onOpenChange, title, description, children, side = false, className }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode; side?: boolean; className?: string
}) {
  const descriptionId = useId()
  const returnFocus = useRef<HTMLElement | null>(null)
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className={cn('dialog-content', side && 'detail-sheet', className)} aria-describedby={description ? descriptionId : undefined}
        onOpenAutoFocus={() => { returnFocus.current = document.activeElement as HTMLElement }}
        onCloseAutoFocus={event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); else document.querySelector<HTMLButtonElement>('.explorer-toolbar .button')?.focus() }}>
        <div className="dialog-heading">
          <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close className="icon-button" aria-label="Fechar"><X size={16} /></DialogPrimitive.Close>
        </div>
        {description && <DialogPrimitive.Description id={descriptionId} className="dialog-description">{description}</DialogPrimitive.Description>}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
}
