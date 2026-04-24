import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

interface PopoverProps {
  trigger: (opts: { open: boolean; toggle: () => void }) => React.ReactNode
  children: (opts: { close: () => void }) => React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Popover({ trigger, children, align = 'right', className }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const reposition = () => {
    const a = anchorRef.current
    if (!a) return
    const r = a.getBoundingClientRect()
    const menu = menuRef.current
    const menuWidth = menu?.offsetWidth ?? 184
    const top = r.bottom + 6
    const left = align === 'right' ? r.right - menuWidth : r.left
    // Keep within viewport horizontally
    const clampedLeft = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8))
    setPos({ top, left: clampedLeft })
  }

  useLayoutEffect(() => {
    if (!open) return
    reposition()
    const onScroll = () => reposition()
    const onResize = () => reposition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
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
    <>
      <div ref={anchorRef} className="inline-flex">
        {trigger({ open, toggle: () => setOpen((v) => !v) })}
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              backgroundColor: '#FFFFFF',
              zIndex: 2000,
              visibility: pos ? 'visible' : 'hidden',
            }}
            className={clsx(
              'min-w-[184px] rounded-lg border border-edge p-1 shadow-pop animate-pop-in',
              className,
            )}
          >
            {children({ close: () => setOpen(false) })}
          </div>,
          document.body,
        )}
    </>
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
