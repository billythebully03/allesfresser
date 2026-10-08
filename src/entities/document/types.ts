export type PageStatus = 'none' | 'draft' | 'in_progress' | 'done'

export interface SelectionNote {
  id: string
  text: string
  note: string
  createdAt: number
}

export interface PageItem {
  id: string
  title: string
  content: string
  updatedAt: number
  note?: string
  status?: PageStatus
  selectionNotes?: SelectionNote[]
}

export interface ChapterItem {
  id: string
  title: string
  isOpen: boolean
  pages: PageItem[]
  updatedAt: number
  description?: string
}

export type TrashItem =
  | {
      id: string
      type: 'chapter'
      title: string
      deletedAt: number
      chapterData: ChapterItem
    }
  | {
      id: string
      type: 'page'
      title: string
      deletedAt: number
      chapterId: string
      pageData: PageItem
    }

export function getChapterDisplayTitle(
  chapter: ChapterItem,
  chapterIndex: number,
): string {
  const trimmed = chapter.title.trim()
  return trimmed || `Глава ${chapterIndex + 1}`
}

export function getPageDisplayTitle(
  page: PageItem,
  pageIndex: number,
  chapterTitle: string,
): string {
  const trimmed = page.title.trim()
  if (!trimmed) {
    return `Страница ${pageIndex + 1}`
  }
  if (trimmed.toLowerCase() === chapterTitle.toLowerCase()) {
    return `Страница ${pageIndex + 1} (${trimmed})`
  }
  return `${pageIndex + 1}. ${trimmed}`
}
