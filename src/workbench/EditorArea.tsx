import {
  ChangeEvent,
  SyntheticEvent,
  useRef,
  KeyboardEvent,
  useEffect,
  useState,
  WheelEvent,
} from 'react'
import { PageItem } from '@/entities/document/types'

interface EditorAreaProps {
  title: string
  content: string
  isFirstPageOfChapter: boolean
  nextPage?: PageItem | null
  allowOverscrollNext?: boolean
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onCursorMove?: (line: number, column: number) => void
  onNavigateNextPage?: () => void
}

const LINE_HEIGHT = 32
const MAX_LINES = 3
const MAX_TITLE_HEIGHT = LINE_HEIGHT * MAX_LINES
const OVERSCROLL_TRIGGER_THRESHOLD = 85

export function EditorArea({
  title,
  content,
  isFirstPageOfChapter,
  nextPage,
  allowOverscrollNext = false,
  onTitleChange,
  onContentChange,
  onCursorMove,
  onNavigateNextPage,
}: EditorAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [overscrollPull, setOverscrollPull] = useState(0)
  const [isTransitioningPage, setIsTransitioningPage] = useState(false)

  const pullTimeoutRef = useRef<number | null>(null)

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
    if (!onCursorMove) return
    const target = e.currentTarget
    const cursorIndex = target.selectionStart ?? 0
    const textBeforeCursor = target.value.slice(0, cursorIndex)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length
    const currentColumn = lines[lines.length - 1].length + 1
    onCursorMove(currentLine, currentColumn)
  }

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value)
    updateCursorPosition(e)
  }

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!allowOverscrollNext || !nextPage || !onNavigateNextPage || isTransitioningPage) {
      return
    }

    const vp = viewportRef.current
    if (!vp) return

    const isAtBottom = vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 2

    if (isAtBottom && e.deltaY > 0) {
      if (pullTimeoutRef.current) {
        window.clearTimeout(pullTimeoutRef.current)
      }

      setOverscrollPull((prev) => {
        const nextPull = Math.min(OVERSCROLL_TRIGGER_THRESHOLD + 15, prev + e.deltaY * 0.45)
        if (nextPull >= OVERSCROLL_TRIGGER_THRESHOLD && !isTransitioningPage) {
          setIsTransitioningPage(true)
          setTimeout(() => {
            onNavigateNextPage()
            setIsTransitioningPage(false)
            setOverscrollPull(0)
            if (viewportRef.current) {
              viewportRef.current.scrollTop = 0
            }
          }, 240)
        }
        return nextPull
      })

      pullTimeoutRef.current = window.setTimeout(() => {
        if (!isTransitioningPage) {
          setOverscrollPull(0)
        }
      }, 200)
    }
  }

  const currentTranslateY = isTransitioningPage ? -120 : -overscrollPull

  return (
    <div
      ref={viewportRef}
      className="editor-viewport"
      onWheel={handleWheel}
    >
      <div
        className="editor-inner-flow"
        style={{
          transform: `translate3d(0, ${currentTranslateY}px, 0)`,
          transition: isTransitioningPage ? 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
        }}
      >
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
          <textarea
            ref={contentTextareaRef}
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

      {allowOverscrollNext && nextPage && overscrollPull > 0 && (
        <div
          className="next-page-overscroll-peek"
          style={{
            transform: `translate3d(0, ${Math.max(0, 100 - (overscrollPull / OVERSCROLL_TRIGGER_THRESHOLD) * 100)}%, 0)`,
            opacity: Math.min(1, overscrollPull / 40),
          }}
        >
          <div className="next-page-peek-badge">Следующая страница</div>
          <div className="next-page-peek-title">
            {nextPage.title || 'Без названия'}
          </div>
          <div className="next-page-peek-preview">
            {nextPage.content.slice(0, 80) || '...'}
          </div>
        </div>
      )}
    </div>
  )
}
