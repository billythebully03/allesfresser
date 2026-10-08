import { useState, useRef, MouseEvent } from 'react'
import { Tooltip } from '@/shared/ui/Tooltip'

interface SplitCornerHandleProps {
  isSplit: boolean
  onToggleSplit: () => void
}

export function SplitCornerHandle({
  isSplit,
  onToggleSplit,
}: SplitCornerHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef<number>(0)

  const handleMouseDown = (e: MouseEvent) => {
    startXRef.current = e.clientX
    setIsDragging(true)

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const delta = startXRef.current - moveEvent.clientX
      if (!isSplit && delta > 30) {
        onToggleSplit()
        cleanup()
      } else if (isSplit && delta < -30) {
        onToggleSplit()
        cleanup()
      }
    }

    const cleanup = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', cleanup)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', cleanup)
  }

  return (
    <Tooltip
      label={
        isSplit
          ? 'Объединить в одну страницу'
          : 'Потяните влево для разделения на две страницы'
      }
    >
      <div
        className={`split-corner-handle ${isSplit ? 'is-active' : ''} ${
          isDragging ? 'is-dragging' : ''
        }`}
        onMouseDown={handleMouseDown}
        onClick={onToggleSplit}
        aria-label="Разделить экран"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <line x1="6" y1="2" x2="18" y2="14" />
          <line x1="12" y1="2" x2="18" y2="8" />
        </svg>
      </div>
    </Tooltip>
  )
}
