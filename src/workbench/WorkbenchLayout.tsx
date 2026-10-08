import { useState, useRef, useEffect, PointerEvent } from 'react'
import { ChapterItem, PageItem, PageStatus, TrashItem } from '@/entities/document/types'
import { Tooltip } from '@/shared/ui/Tooltip'
import { SplitCornerHandle } from './SplitCornerHandle'
import { Sidebar } from './Sidebar'
import { EditorArea } from './EditorArea'
import { StatusBar } from './StatusBar'
import { TrashModal } from './TrashModal'
import { ButterflyInspector, TextSelectionInfo } from './ButterflyInspector'

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
        status: 'draft',
      },
      {
        id: 'pg-2',
        title: 'Тени на воде',
        content: 'Фонари отражались в мокром асфальте. Он сделал шаг вперед...',
        updatedAt: Date.now(),
        status: 'in_progress',
      },
    ],
  },
]

export function WorkbenchLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(250)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [isRailOpen, setIsRailOpen] = useState(false)
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
  const [selectionInfo, setSelectionInfo] = useState<TextSelectionInfo | null>(null)
  const [openDropdownChapterId, setOpenDropdownChapterId] = useState<string | null>(null)

  const isDraggingDividerRef = useRef(false)
  const islandRef = useRef<HTMLElement>(null)
  const draggedTabIdxRef = useRef<number | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !e.altKey) {
        e.preventDefault()
        setIsSidebarOpen((prev) => !prev)
      } else if (
        ((e.metaKey && e.altKey) || (e.ctrlKey && e.altKey)) &&
        e.key.toLowerCase() === 'b'
      ) {
        e.preventDefault()
        setIsInspectorOpen((prev) => !prev)
      }
    }

    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.chapter-tab-group')) {
        setOpenDropdownChapterId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleClickOutside)
    }
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
          status: 'draft',
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
      status: 'draft',
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
      if (activeCursorPageId === effectiveSecondaryPage.id) {
        if (secondaryPage) {
          setViewBasePageId(secondaryPage.id)
        }
        setActiveCursorPageId(newPage.id)
      } else if (primaryPage) {
        setViewBasePageId(primaryPage.id)
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
              status: 'draft',
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
            status: 'draft',
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

  const handleMoveChapter = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setChapters((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const handleSidebarWidthChange = (newWidth: number) => {
    setSidebarWidth(newWidth)
    if (newWidth >= 285 && !isRailOpen) {
      setIsRailOpen(true)
    } else if (newWidth < 285 && isRailOpen) {
      setIsRailOpen(false)
    }
  }

  const handleUpdateChapterDescription = (chapterId: string, description: string) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, description } : ch)),
    )
  }

  const handleUpdatePageNote = (pageId: string, note: string) => {
    updatePage(pageId, { note })
  }

  const handleUpdatePageStatus = (
    pageId: string,
    status: PageStatus,
  ) => {
    updatePage(pageId, { status })
  }

  const handleAddSelectionNote = (pageId: string, text: string, noteText: string) => {
    setChapters((prev) =>
      prev.map((ch) => ({
        ...ch,
        pages: ch.pages.map((p) => {
          if (p.id !== pageId) return p
          const existing = p.selectionNotes || []
          const newNote = {
            id: `sn-${Date.now()}`,
            text,
            note: noteText,
            createdAt: Date.now(),
          }
          return {
            ...p,
            selectionNotes: [newNote, ...existing],
          }
        }),
      })),
    )
  }

  const handleClearSelection = () => {
    setSelectionInfo(null)
  }

  const currentlyFocusedPage = activeCursorPageId === effectiveSecondaryPage.id
    ? effectiveSecondaryPage
    : primaryPage

  const contentText = currentlyFocusedPage ? currentlyFocusedPage.content : ''
  const wordCount = contentText.trim()
    ? contentText.trim().split(/\s+/).length
    : 0

  const secondaryWidth = 100 - leftPercent

  let dashedPageIdInSidebar: string | null = null
  if (isSplit) {
    if (activeCursorPageId === primaryPage?.id) {
      dashedPageIdInSidebar = effectiveSecondaryPage.id
    } else {
      dashedPageIdInSidebar = primaryPage?.id || null
    }
  }

  return (
    <div
      className={`workbench-root ${isRailOpen ? 'has-rail' : ''} ${
        !isSidebarOpen ? 'is-sidebar-hidden' : ''
      } ${isInspectorOpen ? 'has-inspector' : ''}`}
    >
      <div
        className={`tab-rail ${isRailOpen ? 'is-visible' : ''} ${
          isSidebarOpen ? 'is-sidebar-open' : 'is-sidebar-closed'
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
            {activeTab === 'canvas' ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4z" />
              </svg>
            )}
          </button>

          <button
            className={`tab-rail-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('settings')}
            aria-label="Настройки"
            title="Настройки"
          >
            {activeTab === 'settings' ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        width={sidebarWidth}
        chapters={chapters}
        activePageId={activeCursorPageId}
        secondaryPageId={dashedPageIdInSidebar}
        isSplit={isSplit}
        onToggle={() => setIsSidebarOpen(false)}
        onWidthChange={handleSidebarWidthChange}
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
        onMoveChapter={handleMoveChapter}
      />

      <div className={`workspace-outer ${isSidebarOpen ? '' : 'is-full'}`}>
        <div className="canvas-top-strip">
          <div className="canvas-top-left">
            {!isSidebarOpen && (
              <div className="chapter-tabs-header">
                <div className="sidebar-open-anchor-static">
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

                <div className="chapter-tabs-list">
                  {chapters.map((ch, idx) => {
                    const isChapterActive = ch.id === primaryChapter?.id
                    const isDropdownOpen = openDropdownChapterId === ch.id

                    return (
                      <div
                        key={ch.id}
                        className="chapter-tab-group"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(idx))
                          draggedTabIdxRef.current = idx
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          if (
                            draggedTabIdxRef.current !== null &&
                            draggedTabIdxRef.current !== idx
                          ) {
                            handleMoveChapter(draggedTabIdxRef.current, idx)
                            draggedTabIdxRef.current = idx
                          }
                        }}
                        onDragEnd={() => {
                          draggedTabIdxRef.current = null
                        }}
                      >
                        <button
                          className={`chapter-tab ${isChapterActive ? 'is-active' : ''}`}
                          style={{ animationDelay: `${idx * 28}ms` }}
                          onClick={() => {
                            if (ch.pages[0]) {
                              setSecondaryDraft(null)
                              setViewBasePageId(ch.pages[0].id)
                              setActiveCursorPageId(ch.pages[0].id)
                            }
                          }}
                        >
                          <span className="chapter-tab-title">{ch.title || `Глава ${idx + 1}`}</span>
                        </button>

                        <button
                          className={`chapter-tab-pages-trigger ${isDropdownOpen ? 'is-open' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenDropdownChapterId(isDropdownOpen ? null : ch.id)
                          }}
                        >
                          <span>Страницы</span>
                          <svg
                            className={`chapter-tab-trigger-chevron ${isDropdownOpen ? 'is-expanded' : ''}`}
                            width="10"
                            height="10"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                          </svg>
                        </button>

                        {isDropdownOpen && (
                          <div className="chapter-tab-pages-dropdown">
                            <div className="chapter-tab-pages-scroll">
                              {ch.pages.map((p, pIdx) => {
                                const isPageActive = p.id === activeCursorPageId
                                return (
                                  <div
                                    key={p.id}
                                    className={`chapter-dropdown-page-row ${
                                      isPageActive ? 'is-active-page' : ''
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isSplit) {
                                        if (secondaryPage && p.id === secondaryPage.id) {
                                          setActiveCursorPageId(secondaryPage.id)
                                          setOpenDropdownChapterId(null)
                                          return
                                        }
                                        if (primaryPage && p.id === primaryPage.id) {
                                          setActiveCursorPageId(primaryPage.id)
                                          setOpenDropdownChapterId(null)
                                          return
                                        }
                                      }
                                      setSecondaryDraft(null)
                                      setViewBasePageId(p.id)
                                      setActiveCursorPageId(p.id)
                                      setOpenDropdownChapterId(null)
                                    }}
                                  >
                                    <span className="chapter-dropdown-page-index">
                                      {pIdx + 1}
                                    </span>
                                    <span className="chapter-dropdown-page-title">
                                      {p.title || `Страница ${pIdx + 1}`}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="canvas-top-right">
            <Tooltip
              label={isInspectorOpen ? 'Скрыть Баттерфлай' : 'Открыть Баттерфлай'}
              shortcut={{ mac: '⌥⌘B', win: 'Ctrl+Alt+B' }}
            >
              <button
                className={`butterfly-top-toggle-btn ${isInspectorOpen ? 'is-active' : ''}`}
                onClick={() => setIsInspectorOpen((prev) => !prev)}
                aria-label="Баттерфлай"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 4v16" />
                  <path d="M12 4c1.8-2 5.5-2 7.5 0 2.2 2.2 2.2 6.5 0 8.7-1.5 1.5-4.5 2.3-7.5 2.3" />
                  <path d="M12 4c-1.8-2-5.5-2-7.5 0-2.2 2.2-2.2 6.5 0 8.7 1.5 1.5 4.5 2.3 7.5 2.3" />
                  <path d="M12 15c2.5 0 5 1 6 3 1.2 2.3 0 4.5-2.5 4.5-3 0-3.5-5-3.5-7.5" />
                  <path d="M12 15c-2.5 0-5 1-6 3-1.2 2.3 0 4.5 2.5 4.5 3 0 3.5-5 3.5-7.5" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>

        <main ref={islandRef} className="workspace-island">
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
              className={`workspace-pane ${
                isSplit && activeCursorPageId === primaryPage?.id
                  ? 'is-focused-split-active'
                  : ''
              }`}
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
                isInspectorOpen={isInspectorOpen}
                onTitleChange={handlePrimaryTitleChange}
                onContentChange={handlePrimaryContentChange}
                onCursorMove={(line, column) => setCursor({ line, column })}
                onSelectionChange={isInspectorOpen ? setSelectionInfo : undefined}
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
                  className={`workspace-pane workspace-pane-secondary ${
                    isSplit && activeCursorPageId === effectiveSecondaryPage.id
                      ? 'is-focused-split-active'
                      : ''
                  }`}
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
                    isInspectorOpen={isInspectorOpen}
                    onTitleChange={handleSecondaryTitleChange}
                    onContentChange={handleSecondaryContentChange}
                    onCursorMove={(line, column) => setCursor({ line, column })}
                    onSelectionChange={isInspectorOpen ? setSelectionInfo : undefined}
                  />
                </div>
              </>
            )}
          </div>
        </main>
        <StatusBar wordCount={wordCount} cursor={cursor} />
      </div>

      <ButterflyInspector
        isOpen={isInspectorOpen}
        activeChapter={primaryChapter}
        activePage={currentlyFocusedPage}
        selectionInfo={selectionInfo}
        onUpdateChapterDescription={handleUpdateChapterDescription}
        onUpdatePageNote={handleUpdatePageNote}
        onUpdatePageStatus={handleUpdatePageStatus}
        onAddSelectionNote={handleAddSelectionNote}
        onClearSelection={handleClearSelection}
      />
    </div>
  )
}
