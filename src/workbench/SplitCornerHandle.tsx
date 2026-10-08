import { useState, useRef, PointerEvent } from 'react'
import { Tooltip } from '@/shared/ui/Tooltip'

interface SplitCornerHandleProps {
  isSplit: boolean
  onDragProgress: (widthPx: number, isDragging: boolean) => void
  onSnap: (shouldSplit: boolean) => void
  onInstantToggle: () => void
}

export function SplitCornerHandle({
  isSplit,
  onDragProgress,
  onSnap,
  onInstantToggle,
}: SplitCornerHandleProps) {
  const [isPointerDown, setIsPointerDown] = useState(false)
  const startXRef = useRef(0)
  const hasMovedRef = useRef(false)

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsPointerDown(true)
    startXRef.current = e.clientX
    hasMovedRef.current = false
    onDragProgress(0, true)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown) return
    const deltaX = startXRef.current - e.clientX
    if (Math.abs(deltaX) > 4) {
      hasMovedRef.current = true
    }
    onDragProgress(deltaX, true)
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown) return
    setIsPointerDown(false)
    e.currentTarget.releasePointerCapture(e.pointerId)

    if (!hasMovedRef.current) {
      onInstantToggle()
      return
    }

    const deltaX = startXRef.current - e.clientX
    if (!isSplit) {
      onSnap(deltaX > 70)
    } else {
      onSnap(deltaX > -70)
    }
  }

  return (
    <Tooltip
      label={
        isSplit
          ? 'Нажмите для закрытия'
          : 'Потяните влево, чтобы вытянуть вторую страницу'
      }
    >
      <div
        className={`split-corner-handle ${isSplit ? 'is-active' : ''} ${
          isPointerDown ? 'is-dragging' : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
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
