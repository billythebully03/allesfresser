import {
  ChangeEvent,
  SyntheticEvent,
  useRef,
  KeyboardEvent,
  useEffect,
  useState,
} from 'react'

interface EditorAreaProps {
  title: string
  content: string
  isFirstPageOfChapter: boolean
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onCursorMove?: (line: number, column: number) => void
}

const LINE_HEIGHT = 32
const MAX_LINES = 3
const MAX_TITLE_HEIGHT = LINE_HEIGHT * MAX_LINES

export function EditorArea({
  title,
  content,
  isFirstPageOfChapter,
  onTitleChange,
  onContentChange,
  onCursorMove,
}: EditorAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [activeLine, setActiveLine] = useState(1)

  const triggerShake = () => {
    if (!isShaking) {
      setIsShaking(true)
    }
  }

  const adjustTitleHeight = () => {
    const el = titleTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, MAX_TITLE_HEIGHT)
    el.style.height = `${newHeight}px`
  }

  useEffect(() => {
    adjustTitleHeight()
  }, [title])

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      contentTextareaRef.current?.focus()
    }
  }

  const handleTitleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value
    const el = titleTextareaRef.current
    if (!el) return

    const prevHeight = el.style.height
    el.style.height = 'auto'

    if (el.scrollHeight > MAX_TITLE_HEIGHT + 4 && nextVal.length > title.length) {
      el.style.height = prevHeight
      triggerShake()
      return
    }

    onTitleChange(nextVal)
  }

  const updateCursorPosition = (
    e: SyntheticEvent<HTMLTextAreaElement, Event>,
  ) => {
    const target = e.currentTarget
    const cursorIndex = target.selectionStart ?? 0
    const textBeforeCursor = target.value.slice(0, cursorIndex)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length
    const currentColumn = lines[lines.length - 1].length + 1
    setActiveLine(currentLine)
    if (onCursorMove) {
      onCursorMove(currentLine, currentColumn)
    }
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value)
    updateCursorPosition(e)
  }

  const totalLines = Math.max(1, content.split('\n').length)
  const lineNumbers = Array.from({ length: totalLines }, (_, idx) => idx + 1)

  return (
    <div ref={viewportRef} className="editor-viewport">
      <div className="editor-inner-flow">
        <div className="editor-container">
          <textarea
            ref={titleTextareaRef}
            rows={1}
            className={`editor-title-textarea ${isShaking ? 'is-shaking' : ''}`}
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onAnimationEnd={() => setIsShaking(false)}
            placeholder={
              isFirstPageOfChapter
                ? 'Заголовок главы'
                : 'Подзаголовок (опционально)'
            }
            spellCheck={false}
          />
          <div className="editor-body-with-gutter">
            <div className="editor-line-gutter" aria-hidden="true">
              {lineNumbers.map((lineNum) => {
                const distance = Math.abs(lineNum - activeLine)
                if (distance > 3) return null

                let opacity = 1
                if (distance === 1) opacity = 0.65
                else if (distance === 2) opacity = 0.35
                else if (distance === 3) opacity = 0.15

                const topOffset = (lineNum - 1) * 26.4

                return (
                  <div
                    key={lineNum}
                    className="editor-line-marker"
                    style={{
                      transform: `translate3d(0, ${topOffset}px, 0)`,
                      opacity,
                    }}
                  >
                    {lineNum === activeLine ? (
                      <span className="editor-line-dot" />
                    ) : (
                      <span className="editor-line-number">{lineNum}</span>
                    )}
                  </div>
                )
              })}
            </div>
            <textarea
              ref={contentTextareaRef}
              className="editor-textarea"
              value={content}
              onChange={handleContentChange}
              onKeyUp={updateCursorPosition}
              onClick={updateCursorPosition}
              onSelect={updateCursorPosition}
              spellCheck={false}
              placeholder="Текст страницы..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
