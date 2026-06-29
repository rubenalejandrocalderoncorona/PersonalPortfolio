'use client'

import { useState, useEffect, useRef } from 'react'

interface TypewriterTextProps {
  text: string
  baseSpeed?: number
  className?: string
  style?: React.CSSProperties
  startDelay?: number
  onComplete?: () => void
  hideCursorWhenDone?: boolean
}

export default function TypewriterText({
  text,
  baseSpeed = 75,
  className = '',
  style,
  startDelay = 600,
  onComplete,
  hideCursorWhenDone = false,
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function typeNext() {
      if (indexRef.current >= text.length) {
        setIsComplete(true)
        onComplete?.()
        return
      }

      const i = indexRef.current
      setDisplayText(text.slice(0, i + 1))
      indexRef.current++

      const variance = (Math.random() - 0.35) * 70
      const delay = Math.max(18, baseSpeed + variance)
      timerRef.current = setTimeout(typeNext, delay)
    }

    const startTimer = setTimeout(typeNext, startDelay)
    return () => {
      clearTimeout(startTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [text, baseSpeed, startDelay, onComplete])

  const showCursor = !isComplete || !hideCursorWhenDone

  return (
    <span className={className} style={style}>
      {displayText}
      {showCursor && <span aria-hidden="true" className="cursor-blink" />}
    </span>
  )
}
