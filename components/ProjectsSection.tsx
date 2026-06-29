'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { projects } from '@/lib/data'
import ScrollReveal from './ScrollReveal'

/* First 2 projects are the featured AI cards; the rest go in the grid */
const FEATURED = projects.slice(0, 2)
const REST     = projects.slice(2)

/* ── Dot grid decoration for gradient placeholders ── */
function DotGrid() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 260" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
      {Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 10 }).map((_, c) => (
          <circle key={`${r}-${c}`} cx={c * 44 + 20} cy={r * 44 + 20} r="1.8" fill="rgba(255,255,255,0.9)" />
        ))
      )}
    </svg>
  )
}

/* ── Tech chip ── */
function Chip({ label }: { label: string }) {
  return (
    <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.01em', color: '#48484a', background: '#f5f5f7', borderRadius: '9999px', padding: '5px 11px' }}>
      {label}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════
   FEATURED CAROUSEL — large cards, one at a time
   ═══════════════════════════════════════════════════════════ */
function FeaturedCarousel() {
  const [idx, setIdx] = useState(0)
  const project = FEATURED[idx]

  return (
    <div style={{ marginBottom: '56px' }}>
      {/* Overflow container */}
      <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e0e0e0', background: '#fff' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.28, 0.11, 0.32, 1] }}
          >
            {/* ── Image ── */}
            <div style={{ position: 'relative', height: '360px', background: project.gradient ?? '#1d1d1f' }}>
              {project.image ? (
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 920px) 100vw, 820px"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              ) : (
                <DotGrid />
              )}

              {/* AI badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(10px)',
                  color: '#5ac8fa',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Featured AI Project
              </div>
            </div>

            {/* ── Content ── */}
            <div style={{ padding: '28px 32px 32px' }}>
              <h3 style={{ fontFamily: 'var(--font-text)', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 12px', color: '#1d1d1f' }}>
                {project.title}
              </h3>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#6e6e73', margin: '0 0 20px' }}>
                {project.desc}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {project.tech.map((t) => <Chip key={t} label={t} />)}
              </div>
              <Link
                href={`/projects/${project.id}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 600, color: '#0066cc', textDecoration: 'none' }}
              >
                View case study ›
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Prev / Next arrows ── */}
        {(['prev', 'next'] as const).map((dir) => (
          <button
            key={dir}
            onClick={() =>
              setIdx((i) =>
                dir === 'prev'
                  ? (i - 1 + FEATURED.length) % FEATURED.length
                  : (i + 1) % FEATURED.length
              )
            }
            aria-label={dir === 'prev' ? 'Previous project' : 'Next project'}
            style={{
              position: 'absolute',
              top: '50%',
              [dir === 'prev' ? 'left' : 'right']: '12px',
              transform: 'translateY(-50%)',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.3)',
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {dir === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
            </svg>
          </button>
        ))}
      </div>

      {/* ── Dots ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
        {FEATURED.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Go to project ${i + 1}`}
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
  )
}

/* ═══════════════════════════════════════════════════════════
   REMAINING PROJECTS GRID — 2 × 2
   ═══════════════════════════════════════════════════════════ */
function ProjectGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
      {REST.map((project, i) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: i * 0.1, ease: [0.28, 0.11, 0.32, 1] }}
          whileHover={{ y: -4 }}
          style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer' }}
        >
        <Link href={`/projects/${project.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          {/* Image */}
          <div style={{ padding: '12px 12px 0' }}>
            <div style={{ position: 'relative', height: '190px', borderRadius: '10px', overflow: 'hidden', background: project.gradient ?? '#1d1d1f' }}>
              {project.image ? (
                <Image src={project.image} alt={project.title} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
              ) : (
                <DotGrid />
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 22px 24px' }}>
            <h3 style={{ fontFamily: 'var(--font-text)', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px', color: '#1d1d1f', lineHeight: 1.3 }}>
              {project.title}
            </h3>
            <p style={{ fontSize: '14px', lineHeight: 1.55, color: '#6e6e73', margin: '0 0 14px' }}>
              {project.desc}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {project.tech.map((t) => <Chip key={t} label={t} />)}
            </div>
          </div>
        </Link>
        </motion.div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION
   ═══════════════════════════════════════════════════════════ */
export default function ProjectsSection() {
  return (
    <section data-section="projects" style={{ background: '#f5f5f7' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '96px 48px' }}>

        {/* Header */}
        <ScrollReveal style={{ marginBottom: '40px', maxWidth: '620px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0066cc', marginBottom: '14px' }}>
            Selected work
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '44px', fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.025em', margin: '0 0 16px', color: '#1d1d1f' }}>
            Featured projects.
          </h2>
          <p style={{ fontSize: '17px', lineHeight: 1.5, color: '#6e6e73', margin: 0 }}>
            Production systems where AI and infrastructure meet — from agentic documentation pipelines to enterprise cloud intelligence.
          </p>
        </ScrollReveal>

        {/* Featured AI carousel */}
        <ScrollReveal>
          <FeaturedCarousel />
        </ScrollReveal>

        {/* Divider label */}
        <ScrollReveal style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#aeaeb2' }}>More projects</span>
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
          </div>
        </ScrollReveal>

        {/* 2 × 2 grid for the rest */}
        <ProjectGrid />
      </div>
    </section>
  )
}
