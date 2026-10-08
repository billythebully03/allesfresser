import { useState, useRef, ReactNode } from 'react'
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
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })
  const triggerRef = useRef<HTMLDivElement>(null)

  const isMac =
    typeof navigator !== 'undefined' &&
    /mac|iphone|ipad|ipod/i.test(navigator.userAgent)

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
      })
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  return (
    <div
      ref={triggerRef}
      className="tooltip-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="tooltip-popover"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
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
