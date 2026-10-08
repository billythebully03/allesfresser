import { useState } from 'react'
import { ChapterItem, PageItem } from '@/entities/document/types'

export interface TextSelectionInfo {
  text: string
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
}: ButterflyInspectorProps) {
  const [newSelectionNoteText, setNewSelectionNoteText] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

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
    onAddSelectionNote(activePage.id, selectionInfo.text, newSelectionNoteText.trim())
    setNewSelectionNoteText('')
    setIsAddingNote(false)
  }

  return (
    <aside className={`butterfly-panel ${isOpen ? 'is-open' : ''}`}>
      <div className="butterfly-header">
        <div className="butterfly-header-title-row">
          <span className="butterfly-brand">Баттерфлай</span>
          <span className="butterfly-badge">Инспектор</span>
        </div>
        <p className="butterfly-intro">
          Умный помощник структуры: заметки, контекст сцен и аналитика объема рукописи.
        </p>
      </div>

      <div className="butterfly-body">
        {selectionInfo && selectionInfo.text.trim().length > 0 ? (
          <div className="butterfly-section">
            <div className="butterfly-section-header">Выделенный фрагмент</div>
            <div className="butterfly-stat-grid">
              <div className="butterfly-stat-card">
                <span className="butterfly-stat-value">{selectionInfo.wordCount}</span>
                <span className="butterfly-stat-label">Слов</span>
              </div>
              <div className="butterfly-stat-card">
                <span className="butterfly-stat-value">{selectionInfo.charCount}</span>
                <span className="butterfly-stat-label">Символов</span>
              </div>
            </div>

            <div className="butterfly-selection-preview">
              «{selectionInfo.text.slice(0, 120)}
              {selectionInfo.text.length > 120 ? '...' : ''}»
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
                  placeholder="Заметка к выделенному..."
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
        ) : activePage ? (
          <div className="butterfly-section">
            <div className="butterfly-section-header">Страница</div>
            <div className="butterfly-stat-grid">
              <div className="butterfly-stat-card">
                <span className="butterfly-stat-value">{pageWords}</span>
                <span className="butterfly-stat-label">Слов на странице</span>
              </div>
              <div className="butterfly-stat-card">
                <span className="butterfly-stat-value">
                  {activePage.status === 'done'
                    ? 'Готово'
                    : activePage.status === 'in_progress'
                    ? 'В работе'
                    : 'Черновик'}
                </span>
                <span className="butterfly-stat-label">Текущий статус</span>
              </div>
            </div>

            <div className="butterfly-field-group">
              <label className="butterfly-label">Статус готовности</label>
              <select
                className="butterfly-select"
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
                placeholder="Мысли, задачи, факты о сцене..."
                value={activePage.note || ''}
                onChange={(e) => onUpdatePageNote(activePage.id, e.target.value)}
              />
            </div>

            <div className="butterfly-meta-line">
              <span>Изменено:</span>
              <span>{formatDate(activePage.updatedAt)}</span>
            </div>

            {activePage.selectionNotes && activePage.selectionNotes.length > 0 && (
              <div className="butterfly-notes-list">
                <div className="butterfly-sublabel">Заметки к цитатам</div>
                {activePage.selectionNotes.map((sn) => (
                  <div key={sn.id} className="butterfly-quote-item">
                    <div className="butterfly-quote-text">«{sn.text}»</div>
                    <div className="butterfly-quote-note">{sn.note}</div>
                  </div>
                ))}
              </div>
            )}

            {activeChapter && (
              <div className="butterfly-divider-box">
                <div className="butterfly-section-header">Глава: {activeChapter.title}</div>
                <div className="butterfly-stat-grid">
                  <div className="butterfly-stat-card">
                    <span className="butterfly-stat-value">{activeChapter.pages.length}</span>
                    <span className="butterfly-stat-label">Страниц</span>
                  </div>
                  <div className="butterfly-stat-card">
                    <span className="butterfly-stat-value">{chapterTotalWords}</span>
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
              </div>
            )}
          </div>
        ) : (
          <div className="butterfly-empty-guide">
            <svg
              className="butterfly-empty-icon"
              width="44"
              height="44"
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
    </aside>
  )
}
