import { useState } from 'react'
import { DocumentItem } from '@/entities/document/types'
import { Sidebar } from './Sidebar'
import { EditorArea } from './EditorArea'
import { StatusBar } from './StatusBar'

const INITIAL_DOCS: DocumentItem[] = [
  { id: '1', title: 'Глава 1. Начало', content: '', updatedAt: Date.now() },
  { id: '2', title: 'Глава 2. Развитие', content: '', updatedAt: Date.now() },
]

export function WorkbenchLayout() {
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
    <div className="workbench">
      <Sidebar
        documents={documents}
        activeId={activeId}
        onSelect={setActiveId}
      />
      <EditorArea
        content={activeDoc.content}
        onChange={handleContentChange}
      />
      <StatusBar wordCount={wordCount} />
    </div>
  )
}
