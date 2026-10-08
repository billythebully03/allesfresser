export interface PageItem {
  id: string
  title: string
  content: string
  updatedAt: number
}

export interface ChapterItem {
  id: string
  customTitle?: string
  isOpen: boolean
  pages: PageItem[]
  updatedAt: number
}

export function getChapterTitle(chapter: ChapterItem): string {
  if (chapter.customTitle && chapter.customTitle.trim().length > 0) {
    return chapter.customTitle
  }
  const firstPage = chapter.pages[0]
  if (firstPage && firstPage.title.trim().length > 0) {
    return firstPage.title
  }
  return 'Без названия'
}
