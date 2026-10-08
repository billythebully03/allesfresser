import { useState, useRef, useEffect, PointerEvent } from 'react'
import { ChapterItem, PageItem, TrashItem } from '@/entities/document/types'
import { Tooltip } from '@/shared/ui/Tooltip'
import { SplitCornerHandle } from './SplitCornerHandle'
import { Sidebar } from './Sidebar'
import { EditorArea } from './EditorArea'
import { StatusBar } from './StatusBar'
import { TrashModal } from './TrashModal'

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
      {
        id: 'pg-2',
        title: 'Тени на воде',
        content: 'Фонари отражались в мокром асфальте. Он сделал шаг вперед...',
        updatedAt: Date.now(),
      },
    ],
  },
]

export function WorkbenchLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'canvas' | 'settings'>('canvas')
  const [isSplit, setIsSplit] = useState(false)
  const [leftPercent, setLeftPercent] = useState(100)
  const [savedSplitPercent, setSavedSplitPercent] = useState(50)
  const [animationMode, setAnimationMode] = useState<'instant' | 'smooth'>('smooth')
  const [chapters, setChapters] = useState<ChapterItem[]>(INITIAL_CHAPTERS)
  const [viewBasePageId, setViewBasePageId] = useState<string>('pg-1')
  const [activeCursorPageId, setActiveCursorPageId] = useState<string>('pg-1')
  const [secondaryDraft, setSecondaryDraft] = useState<PageItem | null>(null)
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [cursor, setCursor] = useState({ line: 1, column: 1 })
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
    const index = chapter.pages.findIndex((p) => p.id === viewBasePageId)
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
  let isNextPageAvailable = false

  if (primaryChapter && primaryPageIndex !== -1) {
    if (primaryPageIndex + 1 < primaryChapter.pages.length) {
      secondaryPage = primaryChapter.pages[primaryPageIndex + 1]
      isNextPageAvailable = true
    } else {
      const currentChapterIdx = chapters.findIndex((c) => c.id === primaryChapter?.id)
      if (currentChapterIdx !== -1 && currentChapterIdx + 1 < chapters.length) {
        const nextChapter = chapters[currentChapterIdx + 1]
        if (nextChapter.pages[0]) {
          secondaryPage = nextChapter.pages[0]
          isNextPageAvailable = true
        }
      }
    }
  }

  const effectiveSecondaryPage: PageItem = secondaryPage || secondaryDraft || {
    id: 'draft-page',
    title: '',
    content: '',
    updatedAt: Date.now(),
  }

  const ensureSecondaryDraft = () => {
    if (!isNextPageAvailable && !secondaryDraft) {
      setSecondaryDraft({
        id: `pg-${Date.now()}`,
        title: '',
        content: '',
        updatedAt: Date.now(),
      })
    }
  }

  const handleCornerDragProgress = (deltaX: number, _isDragging: boolean) => {
    setAnimationMode('instant')
    ensureSecondaryDraft()
    if (!islandRef.current) return
    const containerWidth = islandRef.current.clientWidth
    const targetSecondaryWidthPx = isSplit
      ? (containerWidth * (100 - savedSplitPercent)) / 100 - deltaX
      : deltaX

    const maxSecondaryWidth = containerWidth * 0.8
    const clampedSecondaryWidth = Math.max(0, Math.min(maxSecondaryWidth, targetSecondaryWidthPx))
    const currentLeft = ((containerWidth - clampedSecondaryWidth) / containerWidth) * 100
    setLeftPercent(currentLeft)

    if (currentLeft >= 99 && secondaryDraft) {
      setSecondaryDraft(null)
    }
  }

  const handleCornerSnap = (shouldSplit: boolean) => {
    setAnimationMode('smooth')
    setIsSplit(shouldSplit)
    if (shouldSplit) {
      setLeftPercent(savedSplitPercent)
    } else {
      setLeftPercent(100)
      setSecondaryDraft(null)
      if (primaryPage) {
        setActiveCursorPageId(primaryPage.id)
      }
    }
  }

  const handleInstantToggle = () => {
    setAnimationMode('instant')
    const nextState = !isSplit
    if (nextState) {
      ensureSecondaryDraft()
      setIsSplit(true)
      setLeftPercent(savedSplitPercent)
    } else {
      setIsSplit(false)
      setLeftPercent(100)
      setSecondaryDraft(null)
      if (primaryPage) {
        setActiveCursorPageId(primaryPage.id)
      }
    }
  }

  const handleDividerPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDraggingDividerRef.current = true
    setAnimationMode('instant')
  }

  const handleDividerPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDividerRef.current || !islandRef.current) return
    const rect = islandRef.current.getBoundingClientRect()
    const rawLeft = ((e.clientX - rect.left) / rect.width) * 100
    const clampedLeft = Math.max(20, Math.min(80, rawLeft))
    setLeftPercent(clampedLeft)
    setSavedSplitPercent(clampedLeft)
  }

  const handleDividerPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingDividerRef.current) return
    isDraggingDividerRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleDividerDoubleClick = () => {
    setAnimationMode('smooth')
    setLeftPercent(50)
    setSavedSplitPercent(50)
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

  const persistDraftIfNeeded = (draftUpdate: Partial<PageItem>) => {
    if (secondaryDraft && primaryChapter) {
      const persistedPage: PageItem = {
        ...secondaryDraft,
        ...draftUpdate,
        updatedAt: Date.now(),
      }
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === primaryChapter?.id
            ? { ...ch, pages: [...ch.pages, persistedPage] }
            : ch,
        ),
      )
      setSecondaryDraft(null)
      setActiveCursorPageId(persistedPage.id)
    }
  }

  const handleSecondaryTitleChange = (newTitle: string) => {
    if (secondaryDraft) {
      if (newTitle.trim()) {
        persistDraftIfNeeded({ title: newTitle })
      } else {
        setSecondaryDraft({ ...secondaryDraft, title: newTitle })
      }
      return
    }
    if (secondaryPage) {
      updatePage(secondaryPage.id, { title: newTitle })
    }
  }

  const handleSecondaryContentChange = (newContent: string) => {
    if (secondaryDraft) {
      if (newContent.trim()) {
        persistDraftIfNeeded({ content: newContent })
      } else {
        setSecondaryDraft({ ...secondaryDraft, content: newContent })
      }
      return
    }
    if (secondaryPage) {
      updatePage(secondaryPage.id, { content: newContent })
    }
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
    if (isSplit) {
      if (secondaryPage && pageId === secondaryPage.id) {
        setActiveCursorPageId(secondaryPage.id)
        return
      }
      if (primaryPage && pageId === primaryPage.id) {
        setActiveCursorPageId(primaryPage.id)
        return
      }
    }

    setSecondaryDraft(null)
    setViewBasePageId(pageId)
    setActiveCursorPageId(pageId)
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
    setSecondaryDraft(null)
    setViewBasePageId(newPageId)
    setActiveCursorPageId(newPageId)
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
    setSecondaryDraft(null)

    if (isSplit) {
      const activeIsPrimary = activeCursorPageId === primaryPage?.id
      if (activeIsPrimary && primaryPage) {
        setViewBasePageId(primaryPage.id)
        setActiveCursorPageId(newPage.id)
      } else {
        const prevId = secondaryPage ? secondaryPage.id : primaryPage?.id
        if (prevId) {
          setViewBasePageId(prevId)
        }
        setActiveCursorPageId(newPage.id)
      }
    } else {
      setViewBasePageId(newPage.id)
      setActiveCursorPageId(newPage.id)
    }
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
      setSecondaryDraft(null)
      setViewBasePageId(duplicated.pages[0].id)
      setActiveCursorPageId(duplicated.pages[0].id)
    }
  }

  const handleDeleteChapter = (chapterId: string) => {
    const targetChapter = chapters.find((ch) => ch.id === chapterId)
    if (targetChapter) {
      setTrashItems((prev) => [
        {
          id: `trash-${Date.now()}`,
          type: 'chapter',
          title: targetChapter.title,
          deletedAt: Date.now(),
          chapterData: targetChapter,
        },
        ...prev,
      ])
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
        setSecondaryDraft(null)
        setViewBasePageId(fallbackPageId)
        setActiveCursorPageId(fallbackPageId)
        return [fallback]
      }
      const isCurrentActiveRemoved = !remaining.some((ch) =>
        ch.pages.some((p) => p.id === viewBasePageId),
      )
      if (isCurrentActiveRemoved && remaining[0]?.pages[0]) {
        setSecondaryDraft(null)
        setViewBasePageId(remaining[0].pages[0].id)
        setActiveCursorPageId(remaining[0].pages[0].id)
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
        setSecondaryDraft(null)
        setViewBasePageId(duplicatedPage.id)
        setActiveCursorPageId(duplicatedPage.id)
        return { ...ch, pages: updatedPages }
      }),
    )
  }

  const handleDeletePage = (chapterId: string, pageId: string) => {
    const parent = chapters.find((ch) => ch.id === chapterId)
    const pageToDelete = parent?.pages.find((p) => p.id === pageId)
    if (pageToDelete) {
      setTrashItems((prev) => [
        {
          id: `trash-${Date.now()}`,
          type: 'page',
          title: pageToDelete.title,
          deletedAt: Date.now(),
          chapterId,
          pageData: pageToDelete,
        },
        ...prev,
      ])
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
          if (viewBasePageId === pageId) {
            setSecondaryDraft(null)
            setViewBasePageId(newFallbackPage.id)
            setActiveCursorPageId(newFallbackPage.id)
          }
          return { ...ch, pages: [newFallbackPage] }
        }
        if (viewBasePageId === pageId) {
          setSecondaryDraft(null)
          setViewBasePageId(remainingPages[0].id)
          setActiveCursorPageId(remainingPages[0].id)
        }
        return { ...ch, pages: remainingPages }
      }),
    )
  }

  const handleRestoreTrashItem = (item: TrashItem) => {
    setTrashItems((prev) => prev.filter((i) => i.id !== item.id))

    if (item.type === 'chapter') {
      setChapters((prev) => [...prev, item.chapterData])
      if (item.chapterData.pages[0]) {
        setSecondaryDraft(null)
        setViewBasePageId(item.chapterData.pages[0].id)
        setActiveCursorPageId(item.chapterData.pages[0].id)
      }
    } else {
      setChapters((prev) => {
        const chapterExists = prev.some((c) => c.id === item.chapterId)
        if (chapterExists) {
          return prev.map((c) =>
            c.id === item.chapterId
              ? { ...c, pages: [...c.pages, item.pageData] }
              : c,
          )
        }
        const restoredChapter: ChapterItem = {
          id: item.chapterId,
          title: 'Восстановленная глава',
          isOpen: true,
          updatedAt: Date.now(),
          pages: [item.pageData],
        }
        return [...prev, restoredChapter]
      })
      setSecondaryDraft(null)
      setViewBasePageId(item.pageData.id)
      setActiveCursorPageId(item.pageData.id)
    }
  }

  const handlePermanentlyDeleteTrashItem = (itemId: string) => {
    setTrashItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  const handleClearTrash = () => {
    setTrashItems([])
  }

  const currentlyFocusedPage = activeCursorPageId === effectiveSecondaryPage.id
    ? effectiveSecondaryPage
    : primaryPage

  const contentText = currentlyFocusedPage ? currentlyFocusedPage.content : ''
  const wordCount = contentText.trim()
    ? contentText.trim().split(/\s+/).length
    : 0

  const secondaryWidth = 100 - leftPercent
  const isRailVisible = sidebarWidth >= 285

  return (
    <div
      className={`workbench-root ${isRailVisible ? 'has-rail' : ''} ${
        !isSidebarOpen ? 'is-sidebar-hidden' : ''
      }`}
    >
      <div
        className={`tab-rail ${isRailVisible ? 'is-visible' : ''} ${
          isSidebarOpen ? 'is-on-light' : 'is-on-dark'
        }`}
      >
        <div className="tab-rail-top">
          <div className="tab-rail-brand">
            <img
              src="/allesfresser.png"
              alt="Logo"
              className="tab-rail-logo"
            />
          </div>

          <button
            className={`tab-rail-btn ${activeTab === 'canvas' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('canvas')}
            aria-label="Холст"
            title="Холст"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>

          <button
            className={`tab-rail-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('settings')}
            aria-label="Настройки"
            title="Настройки"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        width={sidebarWidth}
        chapters={chapters}
        activePageId={activeCursorPageId}
        onToggle={() => setIsSidebarOpen(false)}
        onWidthChange={setSidebarWidth}
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
            onDragProgress={handleCornerDragProgress}
            onSnap={handleCornerSnap}
            onInstantToggle={handleInstantToggle}
          />

          <TrashModal
            items={trashItems}
            onRestore={handleRestoreTrashItem}
            onPermanentlyDelete={handlePermanentlyDeleteTrashItem}
            onClearAll={handleClearTrash}
          />

          <div
            className={`workspace-panes-wrapper ${
              animationMode === 'instant' ? 'is-instant' : ''
            }`}
          >
            <div
              className="workspace-pane"
              style={{
                width: `${leftPercent}%`,
              }}
              onFocusCapture={() => {
                if (primaryPage) setActiveCursorPageId(primaryPage.id)
              }}
              onClickCapture={() => {
                if (primaryPage) setActiveCursorPageId(primaryPage.id)
              }}
            >
              <EditorArea
                title={primaryPage ? primaryPage.title : ''}
                content={primaryPage ? primaryPage.content : ''}
                isFirstPageOfChapter={isFirstPage}
                onTitleChange={handlePrimaryTitleChange}
                onContentChange={handlePrimaryContentChange}
                onCursorMove={(line, column) => setCursor({ line, column })}
              />
            </div>

            {secondaryWidth > 0 && (
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
                  className="workspace-pane workspace-pane-secondary"
                  style={{
                    width: `${secondaryWidth}%`,
                    opacity: Math.min(1, secondaryWidth / 10),
                  }}
                  onFocusCapture={() => {
                    setActiveCursorPageId(effectiveSecondaryPage.id)
                  }}
                  onClickCapture={() => {
                    setActiveCursorPageId(effectiveSecondaryPage.id)
                  }}
                >
                  <EditorArea
                    title={effectiveSecondaryPage.title}
                    content={effectiveSecondaryPage.content}
                    isFirstPageOfChapter={false}
                    onTitleChange={handleSecondaryTitleChange}
                    onContentChange={handleSecondaryContentChange}
                    onCursorMove={(line, column) => setCursor({ line, column })}
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
