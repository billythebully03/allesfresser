interface StatusBarProps {
  wordCount: number
}

export function StatusBar({ wordCount }: StatusBarProps) {
  return (
    <footer className="statusbar">
      <span>{wordCount} слов</span>
    </footer>
  )
}
