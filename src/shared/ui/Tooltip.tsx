import { useState, useRef, useLayoutEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  label: string
  shortcut?: {
    mac: string
    win: string
  }
  children: ReactNode
}

export function Tooltip({ label, shortcut, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const isMac =
    typeof navigator !== 'undefined' &&
    /mac|iphone|ipad|ipod/i.test(navigator.userAgent)

  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current || !popoverRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const popoverRect = popoverRef.current.getBoundingClientRect()
    const gap = 6
    const margin = 8

    let top = triggerRect.bottom + gap
    if (top + popoverRect.height > window.innerHeight - margin) {
      top = triggerRect.top - gap - popoverRect.height
    }
    if (top < margin) {
      top = margin
    }

    let left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2
    if (left < margin) {
      left = margin
    } else if (left + popoverRect.width > window.innerWidth - margin) {
      left = window.innerWidth - margin - popoverRect.width
    }

    popoverRef.current.style.top = `${top}px`
    popoverRef.current.style.left = `${left}px`
  }, [isVisible])

  return (
    <div
      ref={triggerRef}
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div ref={popoverRef} className="tooltip-popover">
            <span className="tooltip-label">{label}</span>
            {shortcut && (
              <kbd className="tooltip-shortcut">
                {isMac ? shortcut.mac : shortcut.win}
              </kbd>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
