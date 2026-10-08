import { DocumentItem } from '@/entities/document/types'

interface SidebarProps {
  isOpen: boolean
  documents: DocumentItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function Sidebar({ isOpen, documents, activeId, onSelect }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? '' : 'is-collapsed'}`}>
      <div className="sidebar-header">
        <span className="brand-title">allesfresser</span>
      </div>
      <nav className="sidebar-nav">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`nav-item ${doc.id === activeId ? 'is-active' : ''}`}
            onClick={() => onSelect(doc.id)}
          >
            {doc.title}
          </div>
        ))}
      </nav>
    </aside>
  )
}
