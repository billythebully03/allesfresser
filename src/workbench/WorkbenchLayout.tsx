import { useState, useEffect } from 'react'
import { ChapterItem, PageItem } from '@/entities/document/types'
import { Tooltip } from '@/shared/ui/Tooltip'
import { SplitCornerHandle } from './SplitCornerHandle'
import { Sidebar } from './Sidebar'
import { EditorArea } from './EditorArea'
import { StatusBar } from './StatusBar'

const INITIAL_CHAPTERS: ChapterItem[] = [
  {
    id: 'ch-1',
    isOpen: true,
    updatedAt: Date.now(),
    pages: [
      {
        id: 'pg-1',
        title: 'Глава 1',
        content: 'В ту ночь шел дождь. Они встретились у моста...',
        updatedAt: Date.now(),
      },
    ],
  },
]

export function WorkbenchLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSplit, setIsSplit] = useState(false)
  const [chapters, setChapters] = useState<ChapterItem[]>(INITIAL_CHAPTERS)
  const [activePageId, setActivePageId] = useState<string>('pg-1')
  const [cursor, setCursor] = useState({ line: 1, column: 1 })

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

  let activeChapter: ChapterItem | undefined
  let activePage: PageItem | undefined
  let activePageIndex = -1

  for (const chapter of chapters) {
    const index = chapter.pages.findIndex((p) => p.id === activePageId)
    if (index !== -1) {
      activeChapter = chapter
      activePage = chapter.pages[index]
      activePageIndex = index
      break
    }
  }

  if (!activePage && chapters[0]?.pages[0]) {
    activeChapter = chapters[0]
    activePage = chapters[0].pages[0]
    activePageIndex = 0
  }

  let nextPage: PageItem | undefined
  if (activeChapter && activePageIndex !== -1) {
    if (activePageIndex + 1 < activeChapter.pages.length) {
      nextPage = activeChapter.pages[activePageIndex + 1]
    }
  }

  const handleToggleSplit = () => {
    if (!isSplit && !nextPage && activeChapter) {
      const newPageId = `pg-${Date.now()}`
      const newPage: PageItem = {
        id: newPageId,
        title: '',
        content: '',
        updatedAt: Date.now(),
      }
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === activeChapter?.id
            ? { ...ch, pages: [...ch.pages, newPage] }
            : ch,
        ),
      )
    }
    setIsSplit((prev) => !prev)
  }

  const isFirstPage = activeChapter?.pages[0]?.id === activePage?.id

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

  const handleTitleChange = (newTitle: string) => {
    if (!activePage) return
    updatePage(activePage.id, { title: newTitle })
  }

  const handleContentChange = (newContent: string) => {
    if (!activePage) return
    updatePage(activePage.id, { content: newContent })
  }

  const handleNextTitleChange = (newTitle: string) => {
    if (!nextPage) return
    updatePage(nextPage.id, { title: newTitle })
  }

  const handleNextContentChange = (newContent: string) => {
    if (!nextPage) return
    updatePage(nextPage.id, { content: newContent })
  }

  const handleRenameChapter = (chapterId: string, newTitle: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? { ...ch, customTitle: newTitle || undefined, updatedAt: Date.now() }
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
      isOpen: true,
      updatedAt: Date.now(),
      pages: [
        {
          id: newPageId,
          title: `Глава ${nextIndex}`,
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
      customTitle: source.customTitle ? `${source.customTitle} (копия)` : undefined,
      updatedAt: Date.now(),
      pages: source.pages.map((p, idx) => ({
        ...p,
        id: `pg-${Date.now()}-${idx}`,
        title: idx === 0 && !source.customTitle ? `${p.title} (копия)` : p.title,
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
    setChapters((prev) => {
      const remaining = prev.filter((ch) => ch.id !== chapterId)
      if (remaining.length === 0) {
        const fallbackPageId = `pg-${Date.now()}`
        const fallback: ChapterItem = {
          id: `ch-${Date.now()}`,
          isOpen: true,
          updatedAt: Date.now(),
          pages: [
            {
              id: fallbackPageId,
              title: 'Глава 1',
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

  const contentText = activePage ? activePage.content : ''
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
        <main className="workspace-island">
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
            onToggleSplit={handleToggleSplit}
          />

          <div
            className={`workspace-panes-wrapper ${isSplit ? 'is-split' : ''}`}
          >
            <div className="workspace-pane">
              <EditorArea
                title={activePage ? activePage.title : ''}
                content={contentText}
                isFirstPageOfChapter={isFirstPage}
                onTitleChange={handleTitleChange}
                onContentChange={handleContentChange}
                onCursorMove={(line, column) => setCursor({ line, column })}
              />
            </div>

            {isSplit && nextPage && (
              <>
                <div className="workspace-pane-divider" />
                <div className="workspace-pane">
                  <EditorArea
                    title={nextPage.title}
                    content={nextPage.content}
                    isFirstPageOfChapter={false}
                    onTitleChange={handleNextTitleChange}
                    onContentChange={handleNextContentChange}
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
