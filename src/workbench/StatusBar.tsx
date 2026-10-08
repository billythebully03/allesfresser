interface StatusBarProps {
  wordCount: number
  cursor: {
    line: number
    column: number
  }
}

export function StatusBar({ wordCount, cursor }: StatusBarProps) {
  return (
    <footer className="statusbar">
      <div className="statusbar-group">
        <span>{wordCount} слов</span>
      </div>
      <div className="statusbar-group">
        <span>
          Стр {cursor.line}, Кол {cursor.column}
        </span>
      </div>
    </footer>
  )
}
