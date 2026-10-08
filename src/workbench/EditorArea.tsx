import { ChangeEvent, SyntheticEvent } from 'react'

interface EditorAreaProps {
  content: string
  onChange: (value: string) => void
  onCursorMove: (line: number, column: number) => void
}

export function EditorArea({
  content,
  onChange,
  onCursorMove,
}: EditorAreaProps) {
  const updateCursorPosition = (
    e: SyntheticEvent<HTMLTextAreaElement, Event>,
  ) => {
    const target = e.currentTarget
    const cursorIndex = target.selectionStart ?? 0
    const textBeforeCursor = target.value.slice(0, cursorIndex)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length
    const currentColumn = lines[lines.length - 1].length + 1
    onCursorMove(currentLine, currentColumn)
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    updateCursorPosition(e)
  }

  return (
    <div className="editor-viewport">
      <textarea
        className="editor-textarea"
        value={content}
        onChange={handleChange}
        onKeyUp={updateCursorPosition}
        onClick={updateCursorPosition}
        spellCheck={false}
        placeholder="Текст документа..."
      />
    </div>
  )
}
