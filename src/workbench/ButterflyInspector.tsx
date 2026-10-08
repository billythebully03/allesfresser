import { useState, useEffect } from 'react'
import { ChapterItem, PageItem, PageStatus, SelectionNote } from '@/entities/document/types'

export interface TextSelectionInfo {
  text: string
  beforeContext: string
  afterContext: string
  wordCount: number
  charCount: number
}

interface ButterflyInspectorProps {
  isOpen: boolean
  activeChapter?: ChapterItem
  activePage?: PageItem
  selectionInfo: TextSelectionInfo | null
  onUpdateChapterDescription: (chapterId: string, description: string) => void
  onUpdatePageNote: (pageId: string, note: string) => void
  onUpdatePageStatus: (pageId: string, status: PageStatus) => void
  onAddSelectionNote: (pageId: string, text: string, note: string) => void
  onClearSelection: () => void
}

function RollerValue({
  value,
  className = '',
}: {
  value: string | number
  className?: string
}) {
  const [display, setDisplay] = useState<{
    current: string | number
    prev: string | number | null
  }>({
    current: value,
    prev: null,
  })

  useEffect(() => {
    if (value !== display.current) {
      setDisplay({ prev: display.current, current: value })
      const timer = setTimeout(() => {
        setDisplay({ prev: null, current: value })
      }, 420)
      return () => clearTimeout(timer)
    }
  }, [value, display.current])

  return (
    <div className={`roller-container ${className}`}>
      {display.prev !== null && (
        <span className="roller-item is-prev">{display.prev}</span>
      )}
      <span className={`roller-item ${display.prev !== null ? 'is-new' : 'is-enter'}`}>
        {display.current}
      </span>
    </div>
  )
}

export function ButterflyInspector({
  isOpen,
  activeChapter,
  activePage,
  selectionInfo,
  onUpdateChapterDescription,
  onUpdatePageNote,
  onUpdatePageStatus,
  onAddSelectionNote,
  onClearSelection,
}: ButterflyInspectorProps) {
  const [newSelectionNoteText, setNewSelectionNoteText] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isStackHovered, setIsStackHovered] = useState(false)
  const [fallingCard, setFallingCard] = useState<SelectionNote | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [isToastLeaving, setIsToastLeaving] = useState(false)

  const chapterTotalWords = activeChapter
    ? activeChapter.pages.reduce((acc, p) => {
        const words = p.content.trim() ? p.content.trim().split(/\s+/).length : 0
        return acc + words
      }, 0)
    : 0

  const pageWords = activePage && activePage.content.trim()
    ? activePage.content.trim().split(/\s+/).length
    : 0

  const formatDate = (ts?: number) => {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const triggerToastDismiss = () => {
    if (isToastLeaving) return
    setIsToastLeaving(true)
    setTimeout(() => {
      setShowToast(false)
      setIsToastLeaving(false)
    }, 360)
  }

  const handleSaveSelectionNote = () => {
    if (!activePage || !selectionInfo || !newSelectionNoteText.trim()) return
    const textSnippet = selectionInfo.text
    const noteContent = newSelectionNoteText.trim()
    const tempNote: SelectionNote = {
      id: `fn-${Date.now()}`,
      text: textSnippet,
      note: noteContent,
      createdAt: Date.now(),
    }

    onAddSelectionNote(activePage.id, textSnippet, noteContent)
    setNewSelectionNoteText('')
    setIsAddingNote(false)
    setFallingCard(tempNote)

    setTimeout(() => {
      setFallingCard(null)
      setShowToast(true)
    }, 620)
  }

  useEffect(() => {
    if (showToast && !isToastLeaving) {
      const timer = setTimeout(() => {
        triggerToastDismiss()
      }, 4800)
      return () => clearTimeout(timer)
    }
  }, [showToast, isToastLeaving])

  const mode = selectionInfo && selectionInfo.text.trim().length > 0
    ? 'selection'
    : activePage
    ? 'page'
    : activeChapter
    ? 'chapter'
    : 'empty'

  const notesList = activePage?.selectionNotes || []

  const getStatusLabel = (st?: PageStatus) => {
    if (st === 'done') return 'Завершено'
    if (st === 'in_progress') return 'В работе'
    if (st === 'draft') return 'Черновик'
    return 'Без статуса'
  }

  return (
    <>
      {isStackHovered && notesList.length > 1 && (
        <div
          className="butterfly-stack-backdrop"
          onClick={() => setIsStackHovered(false)}
        />
      )}

      <aside className={`butterfly-panel ${isOpen ? 'is-open' : ''}`}>
        <div className="butterfly-header">
          <div className="butterfly-header-row">
            <svg
              className="butterfly-bsky-icon"
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M3.468 1.948C5.303 3.325 7.276 6.118 8 7.616c.725-1.498 2.698-4.29 4.532-5.668C13.855.955 16 .186 16 2.632c0 .489-.28 4.105-.444 4.692-.572 2.04-2.653 2.561-4.504 2.246 3.236.551 4.06 2.375 2.281 4.2-3.376 3.464-4.852-.87-5.23-1.98-.07-.204-.103-.3-.103-.218 0-.081-.033.014-.102.218-.379 1.11-1.855 5.444-5.231 1.98-1.778-1.825-.955-3.65 2.28-4.2-1.85.315-3.932-.205-4.503-2.246C.28 6.737 0 3.12 0 2.632 0 .186 2.145.955 3.468 1.948" />
            </svg>
            <span className="butterfly-brand">Баттерфляй</span>
          </div>
          <p className="butterfly-intro">
            Созданный специально для упрощения работы, Баттерфляй выполняет роль инспектора вашего проекта
          </p>
        </div>

        <div className="butterfly-body" key={mode}>
          {mode === 'selection' && selectionInfo ? (
            <div className="butterfly-view-content">
              <div className="butterfly-section-header">Выделенный фрагмент</div>

              <div className="butterfly-stat-grid">
                <div className="butterfly-stat-card">
                  <RollerValue value={selectionInfo.wordCount} className="butterfly-stat-value" />
                  <span className="butterfly-stat-label">Слов</span>
                </div>
                <div className="butterfly-stat-card">
                  <RollerValue value={selectionInfo.charCount} className="butterfly-stat-value" />
                  <span className="butterfly-stat-label">Символов</span>
                </div>
              </div>

              <div className="butterfly-context-preview">
                {selectionInfo.beforeContext && (
                  <span className="butterfly-preview-context">
                    {selectionInfo.beforeContext}{' '}
                  </span>
                )}
                <span className="butterfly-preview-highlighted">
                  {selectionInfo.text}
                </span>
                {selectionInfo.afterContext && (
                  <span className="butterfly-preview-context">
                    {' '}{selectionInfo.afterContext}
                  </span>
                )}
              </div>

              {!isAddingNote ? (
                <button
                  className="butterfly-primary-btn"
                  onClick={() => setIsAddingNote(true)}
                >
                  Добавить заметку к фрагменту
                </button>
              ) : (
                <div className="butterfly-note-composer">
                  <textarea
                    className="butterfly-note-input"
                    placeholder="Текст заметки к цитате..."
                    value={newSelectionNoteText}
                    onChange={(e) => setNewSelectionNoteText(e.target.value)}
                    autoFocus
                  />
                  <div className="butterfly-composer-actions">
                    <button
                      className="butterfly-btn-ghost"
                      onClick={() => {
                        setIsAddingNote(false)
                        setNewSelectionNoteText('')
                      }}
                    >
                      Отмена
                    </button>
                    <button
                      className="butterfly-btn-save"
                      onClick={handleSaveSelectionNote}
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : mode === 'page' && activePage ? (
            <div className="butterfly-view-content">
              <div className="butterfly-page-title-badge">
                {activePage.title.trim() || 'Без названия'}
              </div>

              <div className="butterfly-stat-grid">
                <div className="butterfly-stat-card">
                  <RollerValue value={pageWords} className="butterfly-stat-value" />
                  <span className="butterfly-stat-label">Слов</span>
                </div>
                <div
                  className={`butterfly-stat-card is-status-card ${
                    activePage.status === 'done'
                      ? 'is-done'
                      : activePage.status === 'in_progress'
                      ? 'is-progress'
                      : activePage.status === 'draft'
                      ? 'is-draft'
                      : 'is-none'
                  }`}
                >
                  <RollerValue
                    value={getStatusLabel(activePage.status)}
                    className="butterfly-stat-value"
                  />
                  <span className="butterfly-stat-label">Статус</span>
                </div>
              </div>

              <div className="butterfly-field-group">
                <label className="butterfly-label">Статус страницы</label>
                <select
                  className={`butterfly-select ${
                    activePage.status === 'done'
                      ? 'is-done'
                      : activePage.status === 'in_progress'
                      ? 'is-progress'
                      : activePage.status === 'draft'
                      ? 'is-draft'
                      : 'is-none'
                  }`}
                  value={activePage.status || 'none'}
                  onChange={(e) =>
                    onUpdatePageStatus(
                      activePage.id,
                      e.target.value as PageStatus,
                    )
                  }
                >
                  <option value="none">Без статуса</option>
                  <option value="draft">Черновик</option>
                  <option value="in_progress">В работе</option>
                  <option value="done">Завершено</option>
                </select>
              </div>

              <div className="butterfly-field-group">
                <label className="butterfly-label">Заметка к сцене</label>
                <textarea
                  className="butterfly-textarea"
                  placeholder="Заметка к этой сцене..."
                  value={activePage.note || ''}
                  onChange={(e) => onUpdatePageNote(activePage.id, e.target.value)}
                />
              </div>

              <div className="butterfly-meta-line">
                <span>Последнее изменение</span>
                <span>{formatDate(activePage.updatedAt)}</span>
              </div>

              {notesList.length > 0 && (
                <div className="butterfly-notes-section">
                  <div className="butterfly-notes-header-row">
                    <span className="butterfly-label">Заметки к цитатам</span>
                    <span className="butterfly-count-circle">{notesList.length}</span>
                  </div>

                  {notesList.length === 1 ? (
                    <div className="butterfly-quote-card">
                      <div className="butterfly-quote-snippet">«{notesList[0].text}»</div>
                      <div className="butterfly-quote-note-text">{notesList[0].note}</div>
                    </div>
                  ) : (
                    <div
                      className={`butterfly-stack-wrapper ${
                        isStackHovered ? 'is-expanded' : ''
                      }`}
                      onMouseEnter={() => setIsStackHovered(true)}
                      onMouseLeave={() => setIsStackHovered(false)}
                    >
                      <div className="butterfly-stack-fan">
                        {notesList.map((sn, idx) => {
                          let translateY = idx * 3
                          if (isStackHovered) {
                            const step = Math.ceil(idx / 2)
                            const dir = idx === 0 ? 0 : idx % 2 === 1 ? -1 : 1
                            translateY = dir * step * 56
                          }
                          return (
                            <div
                              key={sn.id}
                              className="butterfly-quote-card butterfly-stack-card"
                              style={{
                                transform: `translate3d(0, ${translateY}px, 0)`,
                                zIndex: isStackHovered ? 60 - idx : 20 - idx,
                              }}
                            >
                              <div className="butterfly-quote-snippet">«{sn.text}»</div>
                              <div className="butterfly-quote-note-text">{sn.note}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : mode === 'chapter' && activeChapter ? (
            <div className="butterfly-view-content">
              <div className="butterfly-page-title-badge">
                {activeChapter.title.trim() || 'Без названия'}
              </div>

              <div className="butterfly-stat-grid">
                <div className="butterfly-stat-card">
                  <RollerValue value={activeChapter.pages.length} className="butterfly-stat-value" />
                  <span className="butterfly-stat-label">Страниц</span>
                </div>
                <div className="butterfly-stat-card">
                  <RollerValue value={chapterTotalWords} className="butterfly-stat-value" />
                  <span className="butterfly-stat-label">Слов всего</span>
                </div>
              </div>

              <div className="butterfly-field-group">
                <label className="butterfly-label">Зачем нужна эта глава?</label>
                <textarea
                  className="butterfly-textarea is-scrollable"
                  placeholder="Роль главы в структуре сюжета..."
                  value={activeChapter.description || ''}
                  onChange={(e) =>
                    onUpdateChapterDescription(activeChapter.id, e.target.value)
                  }
                />
                <span className="butterfly-subtext">Смысловая нагрузка и цель главы</span>
              </div>

              <div className="butterfly-meta-line">
                <span>Последнее изменение</span>
                <span>{formatDate(activeChapter.updatedAt)}</span>
              </div>
            </div>
          ) : (
            <div className="butterfly-empty-guide">
              <svg
                className="butterfly-bsky-empty-icon"
                width="40"
                height="40"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M3.468 1.948C5.303 3.325 7.276 6.118 8 7.616c.725-1.498 2.698-4.29 4.532-5.668C13.855.955 16 .186 16 2.632c0 .489-.28 4.105-.444 4.692-.572 2.04-2.653 2.561-4.504 2.246 3.236.551 4.06 2.375 2.281 4.2-3.376 3.464-4.852-.87-5.23-1.98-.07-.204-.103-.3-.103-.218 0-.081-.033.014-.102.218-.379 1.11-1.855 5.444-5.231 1.98-1.778-1.825-.955-3.65 2.28-4.2-1.85.315-3.932-.205-4.503-2.246C.28 6.737 0 3.12 0 2.632 0 .186 2.145.955 3.468 1.948" />
              </svg>
              <p className="butterfly-empty-text">
                Выделите главу, страницу или фрагмент текста, чтобы активировать Баттерфлай
              </p>
            </div>
          )}
        </div>

        {fallingCard && (
          <div className="butterfly-physics-falling-card">
            <div className="butterfly-quote-snippet">«{fallingCard.text}»</div>
            <div className="butterfly-quote-note-text">{fallingCard.note}</div>
          </div>
        )}

        {showToast && (
          <div className={`butterfly-toast-banner ${isToastLeaving ? 'is-leaving' : 'is-entering'}`}>
            <svg
              className="butterfly-toast-icon"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="#ffffff"
            >
              <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1" />
            </svg>
            <span className="butterfly-toast-text">
              Заметки будут видны в{' '}
              <button
                className="butterfly-toast-action-link"
                onClick={() => {
                  triggerToastDismiss()
                  onClearSelection()
                }}
              >
                Баттерфляе страницы
              </button>
            </span>
          </div>
        )}
      </aside>
    </>
  )
}
