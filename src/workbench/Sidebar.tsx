import { useState, useRef, useEffect, MouseEvent, KeyboardEvent } from 'react'
import { ChapterItem, getChapterTitle } from '@/entities/document/types'
import { Tooltip } from '@/shared/ui/Tooltip'
import { ContextMenu } from '@/shared/ui/ContextMenu'

interface ContextMenuTarget {
  x: number
  y: number
  type: 'chapter' | 'page'
  chapterId: string
  pageId?: string
}

interface EditingTarget {
  type: 'chapter' | 'page'
  id: string
}

interface SidebarProps {
  isOpen: boolean
  chapters: ChapterItem[]
  activePageId: string
  onToggle: () => void
  onToggleChapter: (chapterId: string) => void
  onSelectPage: (chapterId: string, pageId: string) => void
  onAddChapter: () => void
  onAddPage: (chapterId: string) => void
  onRenameChapter: (chapterId: string, newTitle: string) => void
  onRenamePage: (chapterId: string, pageId: string, newTitle: string) => void
  onDuplicateChapter: (chapterId: string) => void
  onDeleteChapter: (chapterId: string) => void
  onDuplicatePage: (chapterId: string, pageId: string) => void
  onDeletePage: (chapterId: string, pageId: string) => void
}

export function Sidebar({
  isOpen,
  chapters,
  activePageId,
  onToggle,
  onToggleChapter,
  onSelectPage,
  onAddChapter,
  onAddPage,
  onRenameChapter,
  onRenamePage,
  onDuplicateChapter,
  onDeleteChapter,
  onDuplicatePage,
  onDeletePage,
}: SidebarProps) {
  const [contextTarget, setContextTarget] = useState<ContextMenuTarget | null>(null)
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingTarget && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingTarget])

  const handleContextMenu = (
    e: MouseEvent,
    type: 'chapter' | 'page',
    chapterId: string,
    pageId?: string,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setContextTarget({
      x: e.clientX,
      y: e.clientY,
      type,
      chapterId,
      pageId,
    })
  }

  const startRename = (type: 'chapter' | 'page', id: string, initialTitle: string) => {
    setEditingTarget({ type, id })
    setEditValue(initialTitle === 'Без названия' ? '' : initialTitle)
    setContextTarget(null)
  }

  const commitRename = () => {
    if (!editingTarget) return
    const trimmed = editValue.trim()
    if (editingTarget.type === 'chapter') {
      onRenameChapter(editingTarget.id, trimmed)
    } else {
      for (const ch of chapters) {
        const found = ch.pages.find((p) => p.id === editingTarget.id)
        if (found) {
          onRenamePage(ch.id, editingTarget.id, trimmed)
          break
        }
      }
    }
    setEditingTarget(null)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitRename()
    } else if (e.key === 'Escape') {
      setEditingTarget(null)
    }
  }

  const handleDuplicate = () => {
    if (!contextTarget) return
    if (contextTarget.type === 'chapter') {
      onDuplicateChapter(contextTarget.chapterId)
    } else if (contextTarget.pageId) {
      onDuplicatePage(contextTarget.chapterId, contextTarget.pageId)
    }
    setContextTarget(null)
  }

  const handleDelete = () => {
    if (!contextTarget) return
    if (contextTarget.type === 'chapter') {
      onDeleteChapter(contextTarget.chapterId)
    } else if (contextTarget.pageId) {
      onDeletePage(contextTarget.chapterId, contextTarget.pageId)
    }
    setContextTarget(null)
  }

  return (
    <aside className={`sidebar ${isOpen ? '' : 'is-collapsed'}`}>
      <div className="sidebar-header">
        <span className="brand-title">allesfresser</span>
        <Tooltip label="Скрыть меню" shortcut={{ mac: '⌘B', win: 'Ctrl+B' }}>
          <button
            className="sidebar-toggle-btn"
            onClick={onToggle}
            aria-label="Скрыть меню"
          >
            <svg
              className="icon-default"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="3" />
              <path d="M9 3v18" />
            </svg>
            <svg
              className="icon-hover"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </Tooltip>
      </div>

      <nav className="sidebar-nav">
        {chapters.map((chapter) => {
          const displayChapterTitle = getChapterTitle(chapter)
          const isEditingChapter =
            editingTarget?.type === 'chapter' && editingTarget.id === chapter.id

          return (
            <div key={chapter.id} className="chapter-node">
              <div
                className="chapter-item"
                onClick={() => onToggleChapter(chapter.id)}
                onContextMenu={(e) => handleContextMenu(e, 'chapter', chapter.id)}
              >
                <div className="chapter-item-left">
                  <svg
                    className={`chevron-icon ${chapter.isOpen ? 'is-expanded' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  {isEditingChapter ? (
                    <input
                      ref={inputRef}
                      className="node-rename-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={handleKeyDown}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="chapter-title"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        startRename('chapter', chapter.id, displayChapterTitle)
                      }}
                    >
                      {displayChapterTitle}
                    </span>
                  )}
                </div>
                <Tooltip label="Добавить страницу">
                  <button
                    className="node-action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddPage(chapter.id)
                    }}
                    aria-label="Добавить страницу"
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
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                </Tooltip>
              </div>

              {chapter.isOpen && (
                <div className="pages-list">
                  {chapter.pages.map((page) => {
                    const isEditingPage =
                      editingTarget?.type === 'page' && editingTarget.id === page.id
                    const displayPageTitle = page.title.trim() || 'Без названия'

                    return (
                      <div
                        key={page.id}
                        className={`page-item ${
                          page.id === activePageId ? 'is-active' : ''
                        }`}
                        onClick={() => onSelectPage(chapter.id, page.id)}
                        onContextMenu={(e) =>
                          handleContextMenu(e, 'page', chapter.id, page.id)
                        }
                      >
                        {isEditingPage ? (
                          <input
                            ref={inputRef}
                            className="node-rename-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className="page-title"
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              startRename('page', page.id, displayPageTitle)
                            }}
                          >
                            {displayPageTitle}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="add-chapter-btn" onClick={onAddChapter}>
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
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span>Новая глава</span>
        </button>
      </div>

      {contextTarget && (
        <ContextMenu
          x={contextTarget.x}
          y={contextTarget.y}
          onClose={() => setContextTarget(null)}
        >
          {contextTarget.type === 'chapter' && (
            <div
              className="context-menu-item"
              onClick={() => {
                onAddPage(contextTarget.chapterId)
                setContextTarget(null)
              }}
            >
              Добавить страницу
            </div>
          )}
          <div
            className="context-menu-item"
            onClick={() => {
              if (contextTarget.type === 'chapter') {
                const targetChapter = chapters.find(
                  (c) => c.id === contextTarget.chapterId,
                )
                if (targetChapter) {
                  startRename(
                    'chapter',
                    targetChapter.id,
                    getChapterTitle(targetChapter),
                  )
                }
              } else if (contextTarget.pageId) {
                const targetChapter = chapters.find(
                  (c) => c.id === contextTarget.chapterId,
                )
                const targetPage = targetChapter?.pages.find(
                  (p) => p.id === contextTarget.pageId,
                )
                if (targetPage) {
                  startRename(
                    'page',
                    targetPage.id,
                    targetPage.title || 'Без названия',
                  )
                }
              }
            }}
          >
            Переименовать
          </div>
          <div className="context-menu-item" onClick={handleDuplicate}>
            Дублировать
          </div>
          <div className="context-menu-item is-destructive" onClick={handleDelete}>
            Удалить
          </div>
        </ContextMenu>
      )}
    </aside>
  )
}
