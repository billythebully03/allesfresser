import { useState, useEffect } from 'react'
import { ChapterItem, PageItem, SelectionNote } from '@/entities/document/types'

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
  onUpdatePageStatus: (pageId: string, status: 'draft' | 'in_progress' | 'done') => void
  onAddSelectionNote: (pageId: string, text: string, note: string) => void
  onClearSelection: () => void
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
    }, 650)
  }

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 5500)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const mode = selectionInfo && selectionInfo.text.trim().length > 0
    ? 'selection'
    : activePage
    ? 'page'
    : activeChapter
    ? 'chapter'
    : 'empty'

  const notesList = activePage?.selectionNotes || []

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
          <span className="butterfly-brand">Баттерфляй</span>
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
                  <span className="butterfly-stat-value is-sliding-in">
                    {selectionInfo.wordCount}
                  </span>
                  <span className="butterfly-stat-label">Слов</span>
                </div>
                <div className="butterfly-stat-card">
                  <span className="butterfly-stat-value is-sliding-in">
                    {selectionInfo.charCount}
                  </span>
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
                  <span className="butterfly-stat-value is-sliding-in">{pageWords}</span>
                  <span className="butterfly-stat-label">Слов</span>
                </div>
                <div
                  className={`butterfly-stat-card is-status-card ${
                    activePage.status === 'done'
                      ? 'is-done'
                      : activePage.status === 'in_progress'
                      ? 'is-progress'
                      : 'is-draft'
                  }`}
                >
                  <span className="butterfly-stat-value is-sliding-in">
                    {activePage.status === 'done'
                      ? 'Завершено'
                      : activePage.status === 'in_progress'
                      ? 'В работе'
                      : 'Черновик'}
                  </span>
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
                      : 'is-draft'
                  }`}
                  value={activePage.status || 'draft'}
                  onChange={(e) =>
                    onUpdatePageStatus(
                      activePage.id,
                      e.target.value as 'draft' | 'in_progress' | 'done',
                    )
                  }
                >
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
                        {notesList.map((sn, idx) => (
                          <div
                            key={sn.id}
                            className="butterfly-quote-card butterfly-stack-card"
                            style={{
                              '--card-index': idx,
                              '--total-cards': notesList.length,
                            } as any}
                          >
                            <div className="butterfly-quote-snippet">«{sn.text}»</div>
                            <div className="butterfly-quote-note-text">{sn.note}</div>
                          </div>
                        ))}
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
                  <span className="butterfly-stat-value is-sliding-in">
                    {activeChapter.pages.length}
                  </span>
                  <span className="butterfly-stat-label">Страниц</span>
                </div>
                <div className="butterfly-stat-card">
                  <span className="butterfly-stat-value is-sliding-in">
                    {chapterTotalWords}
                  </span>
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
                className="butterfly-empty-icon"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v18" />
                <path d="M12 7c-2-3-7-3-9 0v11c2-3 7-3 9 0" />
                <path d="M12 7c2-3 7-3 9 0v11c-2-3-7-3-9 0" />
                <path d="M6 10a4 4 0 0 1 4 4" />
                <path d="M18 10a4 4 0 0 0-4 4" />
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
          <div className="butterfly-toast-banner">
            <svg
              className="butterfly-toast-icon"
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1" />
            </svg>
            <span className="butterfly-toast-text">
              Заметки будут видны в{' '}
              <button
                className="butterfly-toast-action-link"
                onClick={() => {
                  setShowToast(false)
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
