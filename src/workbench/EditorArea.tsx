interface EditorAreaProps {
  content: string
  onChange: (value: string) => void
}

export function EditorArea({ content, onChange }: EditorAreaProps) {
  return (
    <main className="workbench-editor">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: '40px 60px',
          fontSize: '16px',
          lineHeight: '1.6',
          fontFamily: 'Georgia, serif',
          color: '#171717',
          backgroundColor: '#ffffff',
          userSelect: 'text',
        }}
      />
    </main>
  )
}
