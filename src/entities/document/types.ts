export interface PageItem {
  id: string
  title: string
  content: string
  updatedAt: number
}

export interface ChapterItem {
  id: string
  title: string
  isOpen: boolean
  pages: PageItem[]
  updatedAt: number
}

export function extractTitle(content: string, fallback = 'Без названия'): string {
  const firstLine = content.trim().split('\n')[0]?.trim()
  return firstLine || fallback
}
