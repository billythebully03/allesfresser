interface SidebarProps {
  documents: Array<{ id: string; title: string }>
  activeId: string
  onSelect: (id: string) => void
}

export function Sidebar({ documents, activeId, onSelect }: SidebarProps) {
  return (
    <aside className="workbench-sidebar">
      <div>
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              backgroundColor: doc.id === activeId ? '#f5f5f5' : '#ffffff',
            }}
          >
            {doc.title}
          </div>
        ))}
      </div>
    </aside>
  )
}
