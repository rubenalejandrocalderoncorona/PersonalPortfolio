'use client'

import { useState, useEffect, useRef } from 'react'

// Position 5 is   (non-breaking space, charCode 160) — never collapses in HTML/flex
const TARGET = 'Ruben Corona'
const LEN = TARGET.length // 12

const isSpace = (i: number) => TARGET.charCodeAt(i) === 160

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*+<>?[]{}=~^'
const rnd = () => CHARSET[Math.floor(Math.random() * CHARSET.length)]

const MS_PER_LOCK = Math.floor(5000 / LEN)

interface GlitchNameProps {
  style?: React.CSSProperties
  onResolved?: () => void
}

export default function GlitchName({ style, onResolved }: GlitchNameProps) {
  const [chars, setChars] = useState<string[] | null>(null)
  const [locked, setLocked] = useState(0)
  const lockedRef = useRef(0)
  const resolvedRef = useRef(false)

  // Seed client-side only — space position always gets the nbsp, others get random
  useEffect(() => {
    setChars(Array.from({ length: LEN }, (_, i) => (isSpace(i) ? ' ' : rnd())))
  }, [])

  useEffect(() => {
    lockedRef.current = locked
    if (locked >= LEN && !resolvedRef.current) {
      resolvedRef.current = true
      onResolved?.()
    }
  }, [locked, onResolved])

  useEffect(() => {
    if (locked >= LEN) return
    const t = setTimeout(() => setLocked((n) => n + 1), MS_PER_LOCK)
    return () => clearTimeout(t)
  }, [locked])

  // Scramble non-space unlocked positions
  useEffect(() => {
    const id = setInterval(() => {
      if (lockedRef.current >= LEN) { clearInterval(id); return }
      setChars((prev) => {
        if (!prev) return prev
        const next = [...prev]
        for (let i = lockedRef.current; i < LEN; i++) {
          if (!isSpace(i)) next[i] = rnd()
        }
        return next
      })
    }, 45)
    return () => clearInterval(id)
  }, [])

  const baseStyle: React.CSSProperties = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 'clamp(24px, 4.5vw, 48px)',
    fontWeight: 700,
    letterSpacing: '0.06em',
    lineHeight: 1.1,
    userSelect: 'none',
    textAlign: 'center',
    minHeight: '1.25em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  }

  if (!chars) return <div style={baseStyle} aria-hidden="true" />

  // Once fully resolved render TARGET as one string — guarantees correct spacing
  if (locked >= LEN) {
    return (
      <div style={baseStyle}>
        <span style={{ color: '#ffffff' }}>{TARGET}</span>
      </div>
    )
  }

  return (
    <div style={baseStyle}>
      {chars.map((ch, i) => {
        const isLocked = i < locked
        return (
          <span
            key={i}
            style={{
              color: isLocked ? '#ffffff' : '#5ac8fa',
              textShadow: isLocked ? 'none' : '0 0 10px rgba(90,200,250,0.55)',
              // Keep space the full width of a glyph in the monospace font
              display: 'inline-block',
              minWidth: isSpace(i) ? '0.55em' : undefined,
            }}
          >
            {isLocked ? TARGET[i] : ch}
          </span>
        )
      })}
    </div>
  )
}
