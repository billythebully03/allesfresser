import { useState, useRef, useEffect } from 'react'
import { TrashItem } from '@/entities/document/types'

interface TrashModalProps {
  items: TrashItem[]
  onRestore: (item: TrashItem) => void
  onPermanentlyDelete: (itemId: string) => void
  onClearAll: () => void
}

export function TrashModal({
  items,
  onRestore,
  onClearAll,
}: TrashModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const hasItems = items.length > 0

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 220)
  }

  const handleToggle = () => {
    if (isOpen) {
      handleClose()
    } else {
      setIsOpen(true)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.trash-corner-button')
      ) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleOutsideClick)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  return (
    <>
      <button
        className={`trash-corner-button ${hasItems ? 'is-full' : ''} ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggle}
        aria-label="Недавнее"
        title="Недавнее"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <polyline points="12 7 12 12 15 15" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={modalRef}
          className={`trash-finder-window ${isClosing ? 'is-scaling-down' : 'is-scaling-up'}`}
        >
          <div className="trash-finder-header">
            <div className="trash-finder-header-left">
              <span className="trash-finder-title">Недавнее</span>
              <span className="trash-count-circle">{items.length}</span>
            </div>
            {hasItems && (
              <button className="trash-clear-all-btn" onClick={onClearAll}>
                Очистить
              </button>
            )}
          </div>

          <div className="trash-finder-content">
            {!hasItems ? (
              <div className="trash-empty-state">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
                <span className="trash-empty-title">В недавнем пусто</span>
                <span className="trash-empty-sub">
                  Удаленные главы и страницы будут появляться здесь
                </span>
              </div>
            ) : (
              <div className="trash-items-scroll">
                {items.map((item) => (
                  <div key={item.id} className="trash-log-row">
                    <span className="trash-log-time">{formatTime(item.deletedAt)}</span>
                    <span className="trash-log-tag">
                      {item.type === 'chapter' ? 'ГЛАВА' : 'СТР'}
                    </span>
                    <span className="trash-log-name">
                      {item.title || 'Без названия'}
                    </span>
                    <button
                      className="trash-action-btn"
                      onClick={() => onRestore(item)}
                      title="Восстановить"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
