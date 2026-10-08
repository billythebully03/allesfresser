import { useState, ReactNode } from 'react'

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

  const isMac =
    typeof navigator !== 'undefined' &&
    /mac|iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="tooltip-popover">
          <span className="tooltip-label">{label}</span>
          {shortcut && (
            <kbd className="tooltip-shortcut">
              {isMac ? shortcut.mac : shortcut.win}
            </kbd>
          )}
        </div>
      )}
    </div>
  )
}
