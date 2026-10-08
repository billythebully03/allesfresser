interface StatusBarProps {
  wordCount: number
}

export function StatusBar({ wordCount }: StatusBarProps) {
  return (
    <footer className="workbench-statusbar">
      <span>Слов: {wordCount}</span>
    </footer>
  )
}
