interface TopBarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export function TopBar({ isSidebarOpen, onToggleSidebar }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-actions">
        <button
          className="icon-button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Скрыть панель' : 'Показать панель'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      </div>
    </header>
  )
}
