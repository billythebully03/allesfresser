import { useState, useEffect } from 'react'
import { DocumentItem } from '@/entities/document/types'
import { Tooltip } from '@/shared/ui/Tooltip'
import { Sidebar } from './Sidebar'
import { EditorArea } from './EditorArea'
import { StatusBar } from './StatusBar'

const INITIAL_DOCS: DocumentItem[] = [
  { id: '1', title: 'Глава первая', content: '', updatedAt: Date.now() },
  { id: '2', title: 'Глава вторая', content: '', updatedAt: Date.now() },
  { id: '3', title: 'Черновик', content: '', updatedAt: Date.now() },
]

export function WorkbenchLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCS)
  const [activeId, setActiveId] = useState<string>('1')
  const [cursor, setCursor] = useState({ line: 1, column: 1 })

  const activeDoc = documents.find((doc) => doc.id === activeId) ?? documents[0]

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

  const handleContentChange = (newContent: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === activeId
          ? { ...doc, content: newContent, updatedAt: Date.now() }
          : doc,
      ),
    )
  }

  const handleCursorMove = (line: number, column: number) => {
    setCursor({ line, column })
  }

  const wordCount = activeDoc.content.trim()
    ? activeDoc.content.trim().split(/\s+/).length
    : 0

  return (
    <div className="workbench-root">
      <Sidebar
        isOpen={isSidebarOpen}
        documents={documents}
        activeId={activeId}
        onSelect={setActiveId}
        onToggle={() => setIsSidebarOpen(false)}
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
          <EditorArea
            content={activeDoc.content}
            onChange={handleContentChange}
            onCursorMove={handleCursorMove}
          />
        </main>
        <StatusBar wordCount={wordCount} cursor={cursor} />
      </div>
    </div>
  )
}
