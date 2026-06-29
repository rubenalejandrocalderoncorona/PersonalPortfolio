'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

// Exponential growth curve: Entry (bottom-left) → Expert (top-right)
const PATH =
  'M 0,276 C 120,270 240,255 360,225 C 480,195 580,145 680,92 C 760,52 840,22 1000,10'

// Node positions computed to lie exactly on the exponential bezier path
// at arc-length fractions 15%, 38%, 62%, 85% of the total path length
const NODES = [
  {
    id: 1,
    pctX: 15.6, pctY: 93.8,
    logo: '/images/svglogos/Python.svg',
    label: 'Full Stack Dev / DBA',
    title: 'Full-Stack Developer / DBA',
    org: 'UYSEEI & Jardines Vida',
    dates: '2018 — 2020',
    delay: 1.0,
    tipSide: 'above' as const,
  },
  {
    id: 2,
    pctX: 39.2, pctY: 77.3,
    logo: '/images/svglogos/LiverPoolLogo.svg',
    label: 'Cloud Engineer',
    title: 'Cloud Infrastructure Engineer',
    org: 'El Puerto de Liverpool',
    dates: '2022 — 2024',
    delay: 1.9,
    tipSide: 'above' as const,
  },
  {
    id: 3,
    pctX: 62.3, pctY: 43.4,
    logo: '/images/svglogos/SAP.svg',
    label: 'DevOps & Observability',
    title: 'Software Engineer — Observability & ML',
    org: 'SAP',
    dates: '2024 — 2026',
    delay: 2.7,
    tipSide: 'below' as const,
  },
  {
    id: 4,
    pctX: 84.5, pctY: 11.3,
    logo: '/images/svglogos/Oracle.svg',
    label: 'Sr AI Cloud Engineer',
    title: 'Senior AI Cloud Engineer',
    org: 'Oracle',
    dates: '2026 — Present',
    delay: 3.6,
    tipSide: 'below' as const,
    active: true,
  },
]

const NODE_R = 26

export default function CareerAnimation() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(wrapRef, { once: true, margin: '-80px' })
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', marginBottom: '48px' }}>

      {/* ── SVG animated line ── */}
      <svg
        viewBox="0 0 1000 280"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        aria-hidden="true"
      >
        {/* Subtle horizontal grid */}
        {[60, 120, 180, 240].map((y) => (
          <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f0f0f2" strokeWidth="1" />
        ))}

        <defs>
          <filter id="cglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow clone */}
        <motion.path
          d={PATH} stroke="rgba(0,102,204,0.18)" strokeWidth="7" fill="none"
          filter="url(#cglow)"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        />
        {/* Main line */}
        <motion.path
          d={PATH} stroke="#0066cc" strokeWidth="2.5" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        />
        {/* Highlight */}
        <motion.path
          d={PATH} stroke="rgba(90,200,250,0.5)" strokeWidth="1" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 4, ease: 'easeInOut', delay: 0.08 }}
        />
      </svg>

      {/* ── HTML overlay: covers exactly SVG area; overflow:visible lets labels spill below ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
        {NODES.map((node) => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.pctX}%`,
              top: `${node.pctY}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              zIndex: 10,
            }}
          >
            {/* Logo circle */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: node.delay }}
              onHoverStart={() => setHovered(node.id)}
              onHoverEnd={() => setHovered(null)}
              whileHover={{ scale: 1.15 }}
              style={{
                width: `${NODE_R * 2}px`,
                height: `${NODE_R * 2}px`,
                borderRadius: '50%',
                background: '#fff',
                border: node.active ? '2.5px solid #0066cc' : '1.5px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: node.active
                  ? '0 0 0 5px rgba(0,102,204,0.12), 0 4px 16px rgba(0,0,0,0.10)'
                  : '0 3px 10px rgba(0,0,0,0.09)',
                position: 'relative',
              }}
            >
              <img
                src={node.logo}
                alt={node.org}
                style={{ width: `${NODE_R * 1.15}px`, height: `${NODE_R * 1.15}px`, objectFit: 'contain' }}
              />
              {/* Pulsing ring on active (Oracle) */}
              {node.active && (
                <motion.div
                  animate={{ scale: [1, 1.7, 1.7], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', inset: -4, borderRadius: '50%',
                    border: '2px solid #0066cc', pointerEvents: 'none',
                  }}
                />
              )}
            </motion.div>

            {/* ── Position label — always visible ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: node.delay + 0.4 }}
              style={{
                position: 'absolute',
                top: `${NODE_R * 2 + 8}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: '10px',
                fontWeight: 700,
                color: node.active ? '#0066cc' : '#86868b',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                textAlign: 'center',
                fontFamily: 'var(--font-text)',
                pointerEvents: 'none',
              }}
            >
              {node.label}
            </motion.div>

            {/* ── Hover tooltip ── */}
            <AnimatePresence>
              {hovered === node.id && (
                <motion.div
                  initial={{ opacity: 0, y: node.tipSide === 'above' ? 6 : -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: node.tipSide === 'above' ? 6 : -6, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  style={{
                    position: 'absolute',
                    [node.tipSide === 'above' ? 'bottom' : 'top']: `calc(100% + 10px)`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1d1d1f',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    whiteSpace: 'nowrap',
                    zIndex: 50,
                    pointerEvents: 'none',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>{node.title}</div>
                  <div style={{ color: '#aeaeb2', fontSize: '12px', marginBottom: '2px' }}>{node.org}</div>
                  <div style={{ color: '#5ac8fa', fontSize: '11px', fontWeight: 600 }}>{node.dates}</div>
                  {/* Caret */}
                  <div
                    style={{
                      position: 'absolute',
                      [node.tipSide === 'above' ? 'bottom' : 'top']: -5,
                      left: '50%', transform: 'translateX(-50%)',
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      [node.tipSide === 'above' ? 'borderTop' : 'borderBottom']: '5px solid #1d1d1f',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Y-axis level labels — bottom: 0 aligns with SVG bottom */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '4px', pointerEvents: 'none' }}>
        {['Expert', 'Mid', 'Entry'].map((l) => (
          <span key={l} style={{ fontSize: '10px', fontWeight: 600, color: '#c7c7ca', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}
