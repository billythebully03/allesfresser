interface EditorAreaProps {
  content: string
  onChange: (value: string) => void
}

export function EditorArea({ content, onChange }: EditorAreaProps) {
  return (
    <div className="editor-viewport">
      <textarea
        className="editor-textarea"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Начните писать..."
      />
    </div>
  )
}
