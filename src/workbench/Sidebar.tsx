import { useState, useRef, useEffect, MouseEvent, KeyboardEvent, PointerEvent } from 'react'
import {
  ChapterItem,
  getChapterDisplayTitle,
  getPageDisplayTitle,
} from '@/entities/document/types'
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
  width: number
  chapters: ChapterItem[]
  activePageId: string
  onToggle: () => void
  onWidthChange: (newWidth: number) => void
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
  onMoveChapter: (fromIndex: number, toIndex: number) => void
}

export function Sidebar({
  isOpen,
  width,
  chapters,
  activePageId,
  onToggle,
  onWidthChange,
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
  onMoveChapter,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [contextTarget, setContextTarget] = useState<ContextMenuTarget | null>(null)
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isResizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(width)
  const draggedChapterIdxRef = useRef<number | null>(null)

  useEffect(() => {
    if (editingTarget && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingTarget])

  const handleResizePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isResizingRef.current = true
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
  }

  const handleResizePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isResizingRef.current) return
    const delta = e.clientX - startXRef.current
    const nextWidth = Math.max(210, Math.min(420, startWidthRef.current + delta))
    onWidthChange(nextWidth)
  }

  const handleResizePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isResizingRef.current) return
    isResizingRef.current = false
    setIsResizing(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

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
    setEditValue(initialTitle)
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

  const query = searchQuery.trim().toLowerCase()

  const filteredChapters = chapters
    .map((chapter, chIdx) => {
      const chapterTitle = getChapterDisplayTitle(chapter, chIdx)
      const chapterMatches = chapterTitle.toLowerCase().includes(query)

      const matchedPages = chapter.pages.filter((page) => {
        const titleMatch = page.title.toLowerCase().includes(query)
        const contentMatch = page.content.toLowerCase().includes(query)
        return titleMatch || contentMatch
      })

      if (!query) {
        return { chapter, pages: chapter.pages, isOpen: chapter.isOpen, originalIndex: chIdx }
      }

      if (chapterMatches || matchedPages.length > 0) {
        return {
          chapter,
          pages: chapterMatches ? chapter.pages : matchedPages,
          isOpen: true,
          originalIndex: chIdx,
        }
      }

      return null
    })
    .filter(Boolean) as Array<{
    chapter: ChapterItem
    pages: ChapterItem['pages']
    isOpen: boolean
    originalIndex: number
  }>

  return (
    <aside
      className={`sidebar ${isOpen ? '' : 'is-collapsed'} ${isResizing ? 'is-resizing' : ''}`}
      style={{ width: isOpen ? `${width}px` : 0 }}
    >
      <div className="sidebar-inner">
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
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z" />
                <path d="M11 4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1z" />
              </svg>
              <svg
                className="icon-hover"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z" />
                <path d="M3 4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
              </svg>
            </button>
          </Tooltip>
        </div>

        <div className="sidebar-search-container">
          <div className="sidebar-search-box">
            <svg
              className="search-icon"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="sidebar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Главы, страницы, слова..."
              spellCheck={false}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Очистить поиск"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredChapters.map(({ chapter, pages, isOpen: isChapterOpen, originalIndex }) => {
            const chapterTitle = getChapterDisplayTitle(chapter, originalIndex)
            const isEditingChapter =
              editingTarget?.type === 'chapter' && editingTarget.id === chapter.id

            return (
              <div
                key={chapter.id}
                className="chapter-node"
                draggable={!editingTarget && !searchQuery}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(originalIndex))
                  draggedChapterIdxRef.current = originalIndex
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (
                    draggedChapterIdxRef.current !== null &&
                    draggedChapterIdxRef.current !== originalIndex
                  ) {
                    onMoveChapter(draggedChapterIdxRef.current, originalIndex)
                    draggedChapterIdxRef.current = originalIndex
                  }
                }}
                onDragEnd={() => {
                  draggedChapterIdxRef.current = null
                }}
              >
                <div
                  className="chapter-item"
                  onClick={() => onToggleChapter(chapter.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'chapter', chapter.id)}
                >
                  <div className="chapter-item-left">
                    <svg
                      className={`chevron-icon ${isChapterOpen ? 'is-expanded' : ''}`}
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
                          startRename('chapter', chapter.id, chapter.title)
                        }}
                      >
                        {chapterTitle}
                      </span>
                    )}
                  </div>
                </div>

                {isChapterOpen && (
                  <div className="pages-list-container">
                    <div className="pages-list">
                      {pages.map((page, pIdx) => {
                        const isEditingPage =
                          editingTarget?.type === 'page' && editingTarget.id === page.id
                        const pageDisplay = getPageDisplayTitle(
                          page,
                          pIdx,
                          chapterTitle,
                        )

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
                                  startRename('page', page.id, page.title)
                                }}
                              >
                                {pageDisplay}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <button
                      className="add-page-button"
                      onClick={() => onAddPage(chapter.id)}
                    >
                      <svg
                        width="12"
                        height="12"
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
                      <span>Добавить страницу</span>
                    </button>
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
      </div>

      <div
        className="sidebar-resizer"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      />

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
                  startRename('chapter', targetChapter.id, targetChapter.title)
                }
              } else if (contextTarget.pageId) {
                const targetChapter = chapters.find(
                  (c) => c.id === contextTarget.chapterId,
                )
                const targetPage = targetChapter?.pages.find(
                  (p) => p.id === contextTarget.pageId,
                )
                if (targetPage) {
                  startRename('page', targetPage.id, targetPage.title)
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
