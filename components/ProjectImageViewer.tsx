'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Props {
  src: string | null
  alt: string
  gradient: string | null
}

export default function ProjectImageViewer({ src, alt, gradient }: Props) {
  const [expanded, setExpanded] = useState(false)

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = expanded ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [expanded])

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {/* ── Hero image with expand button ── */}
      <div
        style={{
          position: 'relative',
          height: '480px',
          borderRadius: '20px',
          overflow: 'hidden',
          background: gradient ?? '#1d1d1f',
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 1180px) 100vw, 1084px"
            style={{ objectFit: 'cover' }}
            priority
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '20px', fontFamily: 'var(--font-display)' }}>{alt}</span>
          </div>
        )}

        {/* Expand button (only when there's an image) */}
        {src && (
          <button
            onClick={() => setExpanded(true)}
            aria-label="View image full screen"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5,
            }}
          >
            {/* Expand icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Full-screen lightbox ── */}
      {expanded && src && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setExpanded(false)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {/* Image fills available space */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '90vw',
              height: '85vh',
              cursor: 'default',
            }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="90vw"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          {/* Hint */}
          <p style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
            Press Esc or click outside to close
          </p>
        </div>
      )}
    </>
  )
}
