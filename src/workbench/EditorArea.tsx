import {
  ChangeEvent,
  SyntheticEvent,
  useRef,
  KeyboardEvent,
  useState,
  useLayoutEffect,
} from 'react'

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
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isShaking, setIsShaking] = useState(false)
  const isShakingLockRef = useRef(false)

  const triggerShake = () => {
    if (isShakingLockRef.current) return
    isShakingLockRef.current = true
    setIsShaking(true)
    setTimeout(() => {
      setIsShaking(false)
      isShakingLockRef.current = false
    }, 400)
  }

  useLayoutEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto'
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`
    }
  }, [title])

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

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const lineCount = title.split('\n').length
      if (lineCount >= 3) {
        e.preventDefault()
        triggerShake()
        return
      }
      e.preventDefault()
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const handleTitleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value
    const target = e.target

    const clone = document.createElement('textarea')
    clone.style.width = `${target.clientWidth}px`
    clone.style.fontFamily = window.getComputedStyle(target).fontFamily
    clone.style.fontSize = window.getComputedStyle(target).fontSize
    clone.style.fontWeight = window.getComputedStyle(target).fontWeight
    clone.style.lineHeight = window.getComputedStyle(target).lineHeight
    clone.style.padding = '0'
    clone.style.border = 'none'
    clone.style.position = 'absolute'
    clone.style.left = '-9999px'
    clone.style.height = 'auto'
    clone.value = nextVal
    document.body.appendChild(clone)

    const lineHeight = 33
    const maxHeight = lineHeight * 3 + 6
    const isExceeded = clone.scrollHeight > maxHeight || nextVal.split('\n').length > 3
    document.body.removeChild(clone)

    if (isExceeded) {
      triggerShake()
      return
    }

    onTitleChange(nextVal)
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value)
    updateCursorPosition(e)
  }

  return (
    <div className="editor-viewport">
      <div className="editor-container">
        <textarea
          ref={titleTextareaRef}
          rows={1}
          className={`editor-title-input ${isShaking ? 'is-shaking' : ''}`}
          value={title}
          onChange={handleTitleInput}
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
