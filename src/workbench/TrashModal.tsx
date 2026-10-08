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
  onPermanentlyDelete,
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
    }, 280)
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

  const chapters = items.filter((item) => item.type === 'chapter')
  const pages = items.filter((item) => item.type === 'page')

  return (
    <>
      <button
        className={`trash-corner-button ${hasItems ? 'is-full' : ''} ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggle}
        aria-label="Корзина"
      >
        {hasItems ? (
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
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        ) : (
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
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div
          ref={modalRef}
          className={`trash-finder-window ${isClosing ? 'is-genie-out' : 'is-genie-in'}`}
        >
          <div className="trash-finder-header">
            <div className="trash-finder-header-left">
              <button
                className="trash-window-close-dot"
                onClick={handleClose}
                aria-label="Закрыть"
              />
              <span className="trash-finder-title">Корзина</span>
              <span className="trash-count-badge">{items.length}</span>
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
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                <span className="trash-empty-title">Корзина пуста</span>
                <span className="trash-empty-sub">Удаленные главы и страницы отображаются здесь</span>
              </div>
            ) : (
              <div className="trash-items-scroll">
                {chapters.length > 0 && (
                  <div className="trash-section">
                    <div className="trash-section-title">Главы</div>
                    {chapters.map((item) => (
                      <div key={item.id} className="trash-row">
                        <div className="trash-row-icon">
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
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                            <path d="M6 6h10" />
                            <path d="M6 10h10" />
                          </svg>
                        </div>
                        <div className="trash-row-info">
                          <span className="trash-row-name">
                            {item.title || 'Без названия'}
                          </span>
                        </div>
                        <div className="trash-row-actions">
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
                          <button
                            className="trash-action-btn is-delete"
                            onClick={() => onPermanentlyDelete(item.id)}
                            title="Удалить навсегда"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pages.length > 0 && (
                  <div className="trash-section">
                    <div className="trash-section-title">Страницы</div>
                    {pages.map((item) => (
                      <div key={item.id} className="trash-row">
                        <div className="trash-row-icon">
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
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="trash-row-info">
                          <span className="trash-row-name">
                            {item.title || 'Без названия'}
                          </span>
                        </div>
                        <div className="trash-row-actions">
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
                          <button
                            className="trash-action-btn is-delete"
                            onClick={() => onPermanentlyDelete(item.id)}
                            title="Удалить навсегда"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
