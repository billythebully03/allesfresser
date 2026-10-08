import { useState, useRef, useEffect, PointerEvent } from 'react'
import { ChapterItem, PageItem, TrashItem } from '@/entities/document/types'
import { Tooltip } from '@/shared/ui/Tooltip'
import { SplitCornerHandle } from './SplitCornerHandle'
import { TrashButton } from './TrashButton'
import { TrashModal } from './TrashModal'
import { Sidebar } from './Sidebar'
import { EditorArea } from './EditorArea'
import { StatusBar } from './StatusBar'

const INITIAL_CHAPTERS: ChapterItem[] = [
  {
    id: 'ch-1',
    title: 'Глава 1',
    isOpen: true,
    updatedAt: Date.now(),
    pages: [
      {
        id: 'pg-1',
        title: 'Начало пути',
        content: 'В ту ночь шел дождь. Они встретились у моста...',
        updatedAt: Date.now(),
      },
    ],
  },
]

export function WorkbenchLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSplit, setIsSplit] = useState(false)
  const [splitRatio, setSplitRatio] = useState(50)
  const [savedRatio, setSavedRatio] = useState(50)
  const [isAnimated, setIsAnimated] = useState(false)
  const [chapters, setChapters] = useState<ChapterItem[]>(INITIAL_CHAPTERS)
  const [activePageId, setActivePageId] = useState<string>('pg-1')
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [isTrashOpen, setIsTrashOpen] = useState(false)

  const createdPageIdForSplitRef = useRef<string | null>(null)
  const isDraggingDividerRef = useRef(false)
  const islandRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setIsSidebarOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  let primaryPage: PageItem | undefined
  let primaryChapter: ChapterItem | undefined
  let primaryPageIndex = -1

  for (const chapter of chapters) {
    const index = chapter.pages.findIndex((p) => p.id === activePageId)
    if (index !== -1) {
      primaryChapter = chapter
      primaryPage = chapter.pages[index]
      primaryPageIndex = index
      break
    }
  }

  if (!primaryPage && chapters[0]?.pages[0]) {
    primaryChapter = chapters[0]
    primaryPage = chapters[0].pages[0]
    primaryPageIndex = 0
  }

  let secondaryPage: PageItem | undefined
  if (primaryChapter && primaryPageIndex !== -1) {
    if (primaryPageIndex + 1 < primaryChapter.pages.length) {
      secondaryPage = primaryChapter.pages[primaryPageIndex + 1]
    }
  }

  const ensureSecondaryPage = () => {
    if (!secondaryPage && primaryChapter) {
      const newPageId = `pg-${Date.now()}`
      const newPage: PageItem = {
        id: newPageId,
        title: '',
        content: '',
        updatedAt: Date.now(),
      }
      createdPageIdForSplitRef.current = newPageId
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === primaryChapter?.id
            ? { ...ch, pages: [...ch.pages, newPage] }
            : ch,
        ),
      )
    }
  }

  const cleanupEmptyAutoCreatedPage = () => {
    const targetId = createdPageIdForSplitRef.current
    if (!targetId) return

    setChapters((prev) =>
      prev.map((ch) => {
        const found = ch.pages.find((p) => p.id === targetId)
        if (found && !found.title.trim() && !found.content.trim()) {
          return {
            ...ch,
            pages: ch.pages.filter((p) => p.id !== targetId),
          }
        }
        return ch
      }),
    )
    createdPageIdForSplitRef.current = null
  }

  const handleToggleSplit = () => {
    setIsAnimated(false)
    const nextState = !isSplit
    if (nextState) {
      ensureSecondaryPage()
      setIsSplit(true)
      setSplitRatio(savedRatio)
    } else {
      setIsSplit(false)
      cleanupEmptyAutoCreatedPage()
    }
  }

  const handleDividerPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDraggingDividerRef.current = true
    setIsAnimated(false)
  }

  const handleDividerPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDividerRef.current || !islandRef.current) return
    const rect = islandRef.current.getBoundingClientRect()
    const rawRatio = ((e.clientX - rect.left) / rect.width) * 100
    const clamped = Math.max(20, Math.min(80, rawRatio))
    setSplitRatio(clamped)
    setSavedRatio(clamped)
  }

  const handleDividerPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDividerRef.current) return
    isDraggingDividerRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleDividerDoubleClick = () => {
    setIsAnimated(true)
    setSplitRatio(50)
    setSavedRatio(50)
  }

  const isFirstPage = primaryChapter?.pages[0]?.id === primaryPage?.id

  const updatePage = (pageId: string, updates: Partial<PageItem>) => {
    setChapters((prev) =>
      prev.map((chapter) => ({
        ...chapter,
        pages: chapter.pages.map((p) =>
          p.id === pageId ? { ...p, ...updates, updatedAt: Date.now() } : p,
        ),
      })),
    )
  }

  const handlePrimaryTitleChange = (newTitle: string) => {
    if (!primaryPage) return
    updatePage(primaryPage.id, { title: newTitle })
  }

  const handlePrimaryContentChange = (newContent: string) => {
    if (!primaryPage) return
    updatePage(primaryPage.id, { content: newContent })
  }

  const handleSecondaryTitleChange = (newTitle: string) => {
    if (!secondaryPage) return
    if (createdPageIdForSplitRef.current === secondaryPage.id && newTitle.trim()) {
      createdPageIdForSplitRef.current = null
    }
    updatePage(secondaryPage.id, { title: newTitle })
  }

  const handleSecondaryContentChange = (newContent: string) => {
    if (!secondaryPage) return
    if (createdPageIdForSplitRef.current === secondaryPage.id && newContent.trim()) {
      createdPageIdForSplitRef.current = null
    }
    updatePage(secondaryPage.id, { content: newContent })
  }

  const handleRenameChapter = (chapterId: string, newTitle: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? { ...ch, title: newTitle, updatedAt: Date.now() }
          : ch,
      ),
    )
  }

  const handleRenamePage = (
    chapterId: string,
    pageId: string,
    newTitle: string,
  ) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              pages: ch.pages.map((p) =>
                p.id === pageId ? { ...p, title: newTitle } : p,
              ),
            }
          : ch,
      ),
    )
  }

  const handleToggleChapter = (chapterId: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, isOpen: !ch.isOpen } : ch,
      ),
    )
  }

  const handleSelectPage = (_chapterId: string, pageId: string) => {
    setActivePageId(pageId)
  }

  const handleAddChapter = () => {
    const nextIndex = chapters.length + 1
    const newPageId = `pg-${Date.now()}`
    const newChapter: ChapterItem = {
      id: `ch-${Date.now()}`,
      title: `Глава ${nextIndex}`,
      isOpen: true,
      updatedAt: Date.now(),
      pages: [
        {
          id: newPageId,
          title: '',
          content: '',
          updatedAt: Date.now(),
        },
      ],
    }
    setChapters((prev) => [...prev, newChapter])
    setActivePageId(newPageId)
  }

  const handleAddPage = (chapterId: string) => {
    const newPage: PageItem = {
      id: `pg-${Date.now()}`,
      title: '',
      content: '',
      updatedAt: Date.now(),
    }
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? { ...ch, isOpen: true, pages: [...ch.pages, newPage] }
          : ch,
      ),
    )
    setActivePageId(newPage.id)
  }

  const handleDuplicateChapter = (chapterId: string) => {
    const index = chapters.findIndex((ch) => ch.id === chapterId)
    if (index === -1) return
    const source = chapters[index]
    const duplicated: ChapterItem = {
      ...source,
      id: `ch-${Date.now()}`,
      title: `${source.title} (копия)`,
      updatedAt: Date.now(),
      pages: source.pages.map((p, idx) => ({
        ...p,
        id: `pg-${Date.now()}-${idx}`,
        title: p.title ? `${p.title} (копия)` : '',
        updatedAt: Date.now(),
      })),
    }
    setChapters((prev) => [
      ...prev.slice(0, index + 1),
      duplicated,
      ...prev.slice(index + 1),
    ])
    if (duplicated.pages[0]) {
      setActivePageId(duplicated.pages[0].id)
    }
  }

  const handleDeleteChapter = (chapterId: string) => {
    const chapterToDelete = chapters.find((ch) => ch.id === chapterId)
    if (chapterToDelete) {
      const trashRecord: TrashItem = {
        id: `trash-${Date.now()}`,
        type: 'chapter',
        title: chapterToDelete.title || 'Безымянная глава',
        deletedAt: Date.now(),
        data: chapterToDelete,
      }
      setTrashItems((prev) => [trashRecord, ...prev])
    }

    setChapters((prev) => {
      const remaining = prev.filter((ch) => ch.id !== chapterId)
      if (remaining.length === 0) {
        const fallbackPageId = `pg-${Date.now()}`
        const fallback: ChapterItem = {
          id: `ch-${Date.now()}`,
          title: 'Глава 1',
          isOpen: true,
          updatedAt: Date.now(),
          pages: [
            {
              id: fallbackPageId,
              title: '',
              content: '',
              updatedAt: Date.now(),
            },
          ],
        }
        setActivePageId(fallbackPageId)
        return [fallback]
      }
      const isCurrentActiveRemoved = !remaining.some((ch) =>
        ch.pages.some((p) => p.id === activePageId),
      )
      if (isCurrentActiveRemoved && remaining[0]?.pages[0]) {
        setActivePageId(remaining[0].pages[0].id)
      }
      return remaining
    })
  }

  const handleDuplicatePage = (chapterId: string, pageId: string) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id !== chapterId) return ch
        const pageIndex = ch.pages.findIndex((p) => p.id === pageId)
        if (pageIndex === -1) return ch
        const sourcePage = ch.pages[pageIndex]
        const duplicatedPage: PageItem = {
          ...sourcePage,
          id: `pg-${Date.now()}`,
          title: sourcePage.title ? `${sourcePage.title} (копия)` : '',
          updatedAt: Date.now(),
        }
        const updatedPages = [
          ...ch.pages.slice(0, pageIndex + 1),
          duplicatedPage,
          ...ch.pages.slice(pageIndex + 1),
        ]
        setActivePageId(duplicatedPage.id)
        return { ...ch, pages: updatedPages }
      }),
    )
  }

  const handleDeletePage = (chapterId: string, pageId: string) => {
    const parentChapter = chapters.find((ch) => ch.id === chapterId)
    const pageToDelete = parentChapter?.pages.find((p) => p.id === pageId)

    if (pageToDelete) {
      const trashRecord: TrashItem = {
        id: `trash-${Date.now()}`,
        type: 'page',
        title: pageToDelete.title || 'Безымянная страница',
        deletedAt: Date.now(),
        data: pageToDelete,
        parentChapterId: chapterId,
      }
      setTrashItems((prev) => [trashRecord, ...prev])
    }

    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id !== chapterId) return ch
        const remainingPages = ch.pages.filter((p) => p.id !== pageId)
        if (remainingPages.length === 0) {
          const newFallbackPage: PageItem = {
            id: `pg-${Date.now()}`,
            title: '',
            content: '',
            updatedAt: Date.now(),
          }
          if (activePageId === pageId) {
            setActivePageId(newFallbackPage.id)
          }
          return { ...ch, pages: [newFallbackPage] }
        }
        if (activePageId === pageId) {
          setActivePageId(remainingPages[0].id)
        }
        return { ...ch, pages: remainingPages }
      }),
    )
  }

  const handleRestoreFromTrash = (item: TrashItem) => {
    if (item.type === 'chapter') {
      const chapterData = item.data as ChapterItem
      setChapters((prev) => [...prev, chapterData])
      if (chapterData.pages[0]) {
        setActivePageId(chapterData.pages[0].id)
      }
    } else {
      const pageData = item.data as PageItem
      setChapters((prev) => {
        const targetChapter = prev.find((ch) => ch.id === item.parentChapterId) ?? prev[0]
        if (!targetChapter) return prev

        return prev.map((ch) =>
          ch.id === targetChapter.id
            ? { ...ch, pages: [...ch.pages, pageData] }
            : ch,
        )
      })
      setActivePageId(pageData.id)
    }

    setTrashItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  const handleClearTrash = () => {
    setTrashItems([])
  }

  const contentText = primaryPage ? primaryPage.content : ''
  const wordCount = contentText.trim()
    ? contentText.trim().split(/\s+/).length
    : 0

  return (
    <div className="workbench-root">
      <Sidebar
        isOpen={isSidebarOpen}
        chapters={chapters}
        activePageId={activePageId}
        onToggle={() => setIsSidebarOpen(false)}
        onToggleChapter={handleToggleChapter}
        onSelectPage={handleSelectPage}
        onAddChapter={handleAddChapter}
        onAddPage={handleAddPage}
        onRenameChapter={handleRenameChapter}
        onRenamePage={handleRenamePage}
        onDuplicateChapter={handleDuplicateChapter}
        onDeleteChapter={handleDeleteChapter}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
      />
      <div className={`workspace-outer ${isSidebarOpen ? '' : 'is-full'}`}>
        <main ref={islandRef} className="workspace-island">
          {!isSidebarOpen && (
            <div className="sidebar-open-anchor">
              <Tooltip
                label="Показать меню"
                shortcut={{ mac: '⌘B', win: 'Ctrl+B' }}
              >
                <button
                  className="sidebar-open-btn"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Показать меню"
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
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </Tooltip>
            </div>
          )}

          <SplitCornerHandle
            isSplit={isSplit}
            onToggle={handleToggleSplit}
          />

          <TrashButton
            isEmpty={trashItems.length === 0}
            onClick={() => setIsTrashOpen(true)}
          />

          <TrashModal
            isOpen={isTrashOpen}
            items={trashItems}
            onClose={() => setIsTrashOpen(false)}
            onRestore={handleRestoreFromTrash}
            onClear={handleClearTrash}
          />

          <div
            className={`workspace-panes-wrapper ${isAnimated ? 'is-animated' : ''}`}
          >
            <div
              className={`workspace-pane ${
                activePageId === primaryPage?.id ? 'is-active-pane' : ''
              }`}
              style={{
                width: isSplit ? `${splitRatio}%` : '100%',
              }}
              onFocusCapture={() => {
                if (primaryPage) setActivePageId(primaryPage.id)
              }}
              onClickCapture={() => {
                if (primaryPage) setActivePageId(primaryPage.id)
              }}
            >
              <EditorArea
                title={primaryPage ? primaryPage.title : ''}
                content={contentText}
                isFirstPageOfChapter={isFirstPage}
                onTitleChange={handlePrimaryTitleChange}
                onContentChange={handlePrimaryContentChange}
                onCursorMove={(line, column) => setCursor({ line, column })}
              />
            </div>

            {isSplit && secondaryPage && (
              <>
                <div
                  className="workspace-pane-divider"
                  onPointerDown={handleDividerPointerDown}
                  onPointerMove={handleDividerPointerMove}
                  onPointerUp={handleDividerPointerUp}
                  onDoubleClick={handleDividerDoubleClick}
                >
                  <div className="divider-line" />
                </div>
                <div
                  className={`workspace-pane workspace-pane-secondary ${
                    activePageId === secondaryPage?.id ? 'is-active-pane' : ''
                  }`}
                  style={{
                    width: `${100 - splitRatio}%`,
                  }}
                  onFocusCapture={() => {
                    if (secondaryPage) setActivePageId(secondaryPage.id)
                  }}
                  onClickCapture={() => {
                    if (secondaryPage) setActivePageId(secondaryPage.id)
                  }}
                >
                  <EditorArea
                    title={secondaryPage.title}
                    content={secondaryPage.content}
                    isFirstPageOfChapter={false}
                    onTitleChange={handleSecondaryTitleChange}
                    onContentChange={handleSecondaryContentChange}
                  />
                </div>
              </>
            )}
          </div>
        </main>
        <StatusBar wordCount={wordCount} cursor={cursor} />
      </div>
    </div>
  )
}
