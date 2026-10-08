import { DocumentItem } from '@/entities/document/types'
import { Tooltip } from '@/shared/ui/Tooltip'

interface SidebarProps {
  isOpen: boolean
  documents: DocumentItem[]
  activeId: string
  onSelect: (id: string) => void
  onToggle: () => void
}

export function Sidebar({
  isOpen,
  documents,
  activeId,
  onSelect,
  onToggle,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? '' : 'is-collapsed'}`}>
      <div className="sidebar-header">
        <span className="brand-title">allesfresser</span>
        <Tooltip label="Скрыть меню" shortcut={{ mac: '⌘B', win: 'Ctrl+B' }}>
          <button
            className="sidebar-toggle-btn"
            onClick={onToggle}
            aria-label="Скрыть меню"
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
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </Tooltip>
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
