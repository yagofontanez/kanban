import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

interface PopoverProps {
  trigger: (opts: { open: boolean; toggle: () => void }) => React.ReactNode
  children: (opts: { close: () => void }) => React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Popover({ trigger, children, align = 'right', className }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={clsx(
            'absolute z-40 mt-1.5 min-w-[184px] rounded-lg border border-edge bg-paper-raised p-1 shadow-pop animate-pop-in',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  onClick,
  children,
  danger,
  icon,
}: {
  onClick?: () => void
  children: React.ReactNode
  danger?: boolean
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] transition-colors',
        danger
          ? 'text-[#8F3248] hover:bg-[#FBEAED]'
          : 'text-ink hover:bg-paper-sunken',
      )}
    >
      {icon && <span className="text-ink-soft">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  )
}

export function MenuDivider() {
  return <div className="my-1 border-t border-edge/70" />
}
