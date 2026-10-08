import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { TrashItem } from '@/entities/document/types'

interface TrashModalProps {
  isOpen: boolean
  items: TrashItem[]
  onClose: () => void
  onRestore: (item: TrashItem) => void
  onClear: () => void
}

export function TrashModal({
  isOpen,
  items,
  onClose,
  onRestore,
  onClear,
}: TrashModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return typeof document !== 'undefined'
    ? createPortal(
        <div className="trash-backdrop">
          <div ref={modalRef} className="trash-window">
            <div className="trash-window-header">
              <div className="trash-header-title-box">
                <span className="trash-header-title">Корзина</span>
                <span className="trash-count-badge">{items.length}</span>
              </div>
              {items.length > 0 && (
                <button className="trash-clear-btn" onClick={onClear}>
                  Очистить
                </button>
              )}
            </div>

            <div className="trash-window-content">
              {items.length === 0 ? (
                <div className="trash-empty-state">
                  <span>Корзина пока пуста</span>
                </div>
              ) : (
                <div className="trash-items-list">
                  {items.map((item) => {
                    const isChapter = item.type === 'chapter'
                    const dateStr = new Date(item.deletedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div key={item.id} className="trash-item-row">
                        <div className="trash-item-left">
                          <div className="trash-item-icon">
                            {isChapter ? (
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                              </svg>
                            ) : (
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            )}
                          </div>
                          <div className="trash-item-info">
                            <span className="trash-item-title">{item.title}</span>
                            <span className="trash-item-meta">
                              {isChapter ? 'Глава' : 'Страница'} · {dateStr}
                            </span>
                          </div>
                        </div>
                        <button
                          className="trash-restore-btn"
                          onClick={() => onRestore(item)}
                        >
                          Восстановить
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null
}
