'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { certs } from '@/lib/data'
import ScrollReveal from './ScrollReveal'

const VISIBLE = 3
const GAP = 20
const AUTO_MS = 4000

export default function CertificationsSection() {
  const [idx, setIdx] = useState(0)
  const [slideAmt, setSlideAmt] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const maxIdx = certs.length - VISIBLE // 4

  // Measure once + on resize
  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) {
        const w = wrapRef.current.offsetWidth
        setSlideAmt((w + GAP) / VISIBLE)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const goTo = useCallback((n: number) => setIdx(Math.max(0, Math.min(maxIdx, n))), [maxIdx])
  const prev = () => goTo(idx - 1)
  const next = () => goTo(idx + 1)

  // Auto-advance
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i >= maxIdx ? 0 : i + 1)), AUTO_MS)
    return () => clearInterval(t)
  }, [maxIdx])

  return (
    <section
      data-section="certifications"
      style={{ background: '#ffffff' }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '96px 48px' }}>

        {/* Header */}
        <ScrollReveal style={{ marginBottom: '48px', maxWidth: '620px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0066cc', marginBottom: '14px' }}>
            Credentials
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '44px', fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.025em', margin: 0, color: '#1d1d1f' }}>
            Certifications.
          </h2>
        </ScrollReveal>

        {/* Carousel */}
        <div style={{ position: 'relative' }}>

          {/* Track wrapper */}
          <div ref={wrapRef} style={{ overflow: 'hidden' }}>
            <motion.div
              style={{ display: 'flex', gap: `${GAP}px` }}
              animate={{ x: slideAmt > 0 ? -(idx * slideAmt) : 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 36, mass: 0.9 }}
            >
              {certs.map((cert, i) => (
                <motion.a
                  key={cert.title}
                  href={cert.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    flexShrink: 0,
                    width: slideAmt > 0 ? `${slideAmt - GAP}px` : `calc((100% - ${GAP * (VISIBLE - 1)}px) / ${VISIBLE})`,
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '20px',
                    padding: '28px',
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    minHeight: '240px',
                  }}
                >
                  {/* Logo — prominently large */}
                  <div style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '18px',
                    background: '#f5f5f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '22px',
                    flexShrink: 0,
                    padding: '10px',
                  }}>
                    <img
                      src={cert.logo}
                      alt={cert.issuer}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  {/* Title */}
                  <h3 style={{ fontFamily: 'var(--font-text)', fontSize: '17px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 auto', color: '#1d1d1f' }}>
                    {cert.title}
                  </h3>

                  {/* Issuer + date */}
                  <div style={{ marginTop: '18px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#86868b' }}>{cert.issuer}</span>
                    <span style={{ fontSize: '13px', color: '#aeaeb2', whiteSpace: 'nowrap' }}>{cert.date}</span>
                  </div>

                  <span style={{ marginTop: '12px', fontSize: '14px', color: '#0066cc' }}>Verify ›</span>
                </motion.a>
              ))}
            </motion.div>
          </div>

          {/* Arrows */}
          <button
            onClick={prev}
            aria-label="Previous certifications"
            disabled={idx === 0}
            style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid #e0e0e0',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: idx === 0 ? 'default' : 'pointer',
              opacity: idx === 0 ? 0.35 : 1,
              zIndex: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            onClick={next}
            aria-label="Next certifications"
            disabled={idx >= maxIdx}
            style={{
              position: 'absolute',
              right: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid #e0e0e0',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: idx >= maxIdx ? 'default' : 'pointer',
              opacity: idx >= maxIdx ? 0.35 : 1,
              zIndex: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
          {Array.from({ length: maxIdx + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === idx ? '22px' : '8px',
                height: '8px',
                borderRadius: '9999px',
                background: i === idx ? '#0066cc' : '#e0e0e0',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
