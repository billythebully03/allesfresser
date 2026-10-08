import { useEffect, useRef, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  children: ReactNode
}

export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const menuWidth = 140
  const menuHeight = 70
  const safeX = Math.min(x, window.innerWidth - menuWidth - 8)
  const safeY = Math.min(y, window.innerHeight - menuHeight - 8)

  return typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          className="context-menu"
          style={{
            top: `${safeY}px`,
            left: `${safeX}px`,
          }}
        >
          {children}
        </div>,
        document.body,
      )
    : null
}
