import { ChangeEvent, SyntheticEvent, useRef, KeyboardEvent } from 'react'

interface EditorAreaProps {
  title: string
  content: string
  isFirstPageOfChapter: boolean
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onCursorMove?: (line: number, column: number) => void
}

export function EditorArea({
  title,
  content,
  isFirstPageOfChapter,
  onTitleChange,
  onContentChange,
  onCursorMove,
}: EditorAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const updateCursorPosition = (
    e: SyntheticEvent<HTMLTextAreaElement, Event>,
  ) => {
    if (!onCursorMove) return
    const target = e.currentTarget
    const cursorIndex = target.selectionStart ?? 0
    const textBeforeCursor = target.value.slice(0, cursorIndex)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length
    const currentColumn = lines[lines.length - 1].length + 1
    onCursorMove(currentLine, currentColumn)
  }

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value)
    updateCursorPosition(e)
  }

  return (
    <div className="editor-viewport">
      <div className="editor-container">
        <input
          className="editor-title-input"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          placeholder={
            isFirstPageOfChapter
              ? 'Заголовок главы'
              : 'Подзаголовок (опционально)'
          }
          spellCheck={false}
        />
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={content}
          onChange={handleContentChange}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          spellCheck={false}
          placeholder="Текст страницы..."
        />
      </div>
    </div>
  )
}
