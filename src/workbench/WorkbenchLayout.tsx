import { useState } from 'react'
import { DocumentItem } from '@/entities/document/types'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { EditorArea } from './EditorArea'
import { StatusBar } from './StatusBar'

const INITIAL_DOCS: DocumentItem[] = [
  { id: '1', title: 'Глава первая', content: '', updatedAt: Date.now() },
  { id: '2', title: 'Глава вторая', content: '', updatedAt: Date.now() },
  { id: '3', title: 'Черновик сцены', content: '', updatedAt: Date.now() },
]

export function WorkbenchLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCS)
  const [activeId, setActiveId] = useState<string>('1')

  const activeDoc = documents.find((doc) => doc.id === activeId) ?? documents[0]

  const handleContentChange = (newContent: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === activeId
          ? { ...doc, content: newContent, updatedAt: Date.now() }
          : doc,
      ),
    )
  }

  const wordCount = activeDoc.content.trim()
    ? activeDoc.content.trim().split(/\s+/).length
    : 0

  return (
    <div className="workbench-root">
      <TopBar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />
      <div className="workbench-body">
        <Sidebar
          isOpen={isSidebarOpen}
          documents={documents}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <main className="workspace-surface">
          <EditorArea
            content={activeDoc.content}
            onChange={handleContentChange}
          />
          <StatusBar wordCount={wordCount} />
        </main>
      </div>
    </div>
  )
}
