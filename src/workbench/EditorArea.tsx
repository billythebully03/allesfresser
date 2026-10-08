import {
  ChangeEvent,
  SyntheticEvent,
  useRef,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useState,
} from 'react'
import { TextSelectionInfo } from './ButterflyInspector'

interface EditorAreaProps {
  title: string
  content: string
  isFirstPageOfChapter: boolean
  isInspectorOpen?: boolean
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onCursorMove?: (line: number, column: number) => void
  onSelectionChange?: (selection: TextSelectionInfo | null) => void
}

const LINE_HEIGHT_PX = 26.4
const TITLE_LINE_HEIGHT = 32
const MAX_TITLE_LINES = 3
const MAX_TITLE_HEIGHT = TITLE_LINE_HEIGHT * MAX_TITLE_LINES

export function EditorArea({
  title,
  content,
  isFirstPageOfChapter,
  isInspectorOpen = false,
  onTitleChange,
  onContentChange,
  onCursorMove,
  onSelectionChange,
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

  const adjustContentHeight = () => {
    const el = contentTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    adjustTitleHeight()
  }, [title])

  useEffect(() => {
    adjustContentHeight()
  }, [content])

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
    const cursorEnd = target.selectionEnd ?? 0
    const textBeforeCursor = target.value.slice(0, cursorIndex)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length
    const currentColumn = lines[lines.length - 1].length + 1
    setActiveLine(currentLine)

    if (onCursorMove) {
      onCursorMove(currentLine, currentColumn)
    }

    if (isInspectorOpen && onSelectionChange) {
      if (cursorEnd > cursorIndex) {
        const rawSelected = target.value.slice(cursorIndex, cursorEnd)
        const wordCount = rawSelected.trim()
          ? rawSelected.trim().split(/\s+/).length
          : 0

        const beforeSlice = target.value.slice(0, cursorIndex)
        const beforeWords = beforeSlice.trim().split(/\s+/).slice(-4).join(' ')

        const afterSlice = target.value.slice(cursorEnd)
        const afterWords = afterSlice.trim().split(/\s+/).slice(0, 4).join(' ')

        onSelectionChange({
          text: rawSelected,
          beforeContext: beforeWords,
          afterContext: afterWords,
          wordCount,
          charCount: rawSelected.length,
        })
      } else {
        onSelectionChange(null)
      }
    }
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value)
    updateCursorPosition(e)
  }

  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === contentTextareaRef.current || e.target === titleTextareaRef.current) {
      return
    }

    const textarea = contentTextareaRef.current
    if (!textarea) return

    const rect = textarea.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    if (clickY < 0) return

    const targetLine = Math.max(1, Math.floor(clickY / LINE_HEIGHT_PX) + 1)
    const lines = content.split('\n')
    const currentTotalLines = lines.length

    if (targetLine > currentTotalLines) {
      const extraLinesNeeded = targetLine - currentTotalLines
      const newContent = content + '\n'.repeat(extraLinesNeeded)
      onContentChange(newContent)
      setActiveLine(targetLine)

      requestAnimationFrame(() => {
        if (contentTextareaRef.current) {
          contentTextareaRef.current.focus()
          const pos = newContent.length
          contentTextareaRef.current.setSelectionRange(pos, pos)
        }
      })
    } else {
      let charPos = 0
      for (let i = 0; i < targetLine - 1; i++) {
        charPos += lines[i].length + 1
      }
      charPos += lines[targetLine - 1].length

      textarea.focus()
      textarea.setSelectionRange(charPos, charPos)
      setActiveLine(targetLine)
    }
  }

  const visibleLines: number[] = []
  for (let offset = -6; offset <= 6; offset++) {
    const lineNum = activeLine + offset
    if (lineNum >= 1) {
      visibleLines.push(lineNum)
    }
  }

  return (
    <div ref={viewportRef} className="editor-viewport">
      <div className="editor-inner-flow" onClick={handleContainerClick}>
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

          <div className="editor-body-area">
            <div className="editor-margin-gutter" aria-hidden="true">
              {visibleLines.map((lineNum) => {
                const distance = Math.abs(lineNum - activeLine)
                let opacity = 1
                if (distance === 1) opacity = 0.85
                else if (distance === 2) opacity = 0.70
                else if (distance === 3) opacity = 0.55
                else if (distance === 4) opacity = 0.40
                else if (distance === 5) opacity = 0.25
                else if (distance === 6) opacity = 0.10

                const topOffset = (lineNum - 1) * LINE_HEIGHT_PX

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
