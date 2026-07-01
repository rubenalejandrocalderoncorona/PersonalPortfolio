'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const PATH =
  'M 0,276 C 120,270 240,255 360,225 C 480,195 580,145 680,92 C 760,52 840,22 1000,10'

// Nodes at arc-length fractions 15%, 38%, 62%, 85% of the total bezier path
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

const NODE_R = 26   // circle radius in CSS px
const TIP_GAP = 10  // px gap between circle edge and tooltip edge

export default function CareerAnimation() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(wrapRef, { once: true, margin: '-80px' })
  const [hovered, setHovered] = useState<number | null>(null)

  const activeNode = NODES.find(n => n.id === hovered) ?? null

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', marginBottom: '48px' }}>

      {/* ── SVG: animated exponential-growth path ── */}
      <svg
        viewBox="0 0 1000 280"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        aria-hidden="true"
      >
        {[60, 120, 180, 240].map(y => (
          <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f0f0f2" strokeWidth="1" />
        ))}
        <defs>
          <filter id="cglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <motion.path d={PATH} stroke="rgba(0,102,204,0.18)" strokeWidth="7" fill="none"
          filter="url(#cglow)"
          initial={{ pathLength: 0 }} animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 4, ease: 'easeInOut' }} />
        <motion.path d={PATH} stroke="#0066cc" strokeWidth="2.5" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 4, ease: 'easeInOut' }} />
        <motion.path d={PATH} stroke="rgba(90,200,250,0.5)" strokeWidth="1" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 4, ease: 'easeInOut', delay: 0.08 }} />
      </svg>

      {/* ── HTML overlay: same dimensions as the rendered SVG ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>

        {/* ── Node circles + always-visible labels ── */}
        {NODES.map(node => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.pctX}%`,
              top: `${node.pctY}%`,
              transform: 'translate(-50%, -50%)',
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
                userSelect: 'none',
              }}
            >
              <img
                src={node.logo}
                alt={node.org}
                style={{ width: `${NODE_R * 1.15}px`, height: `${NODE_R * 1.15}px`, objectFit: 'contain' }}
              />
              {node.active && (
                <motion.div
                  animate={{ scale: [1, 1.7, 1.7], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #0066cc', pointerEvents: 'none' }}
                />
              )}
            </motion.div>

            {/* Persistent position label — always visible below circle */}
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
          </div>
        ))}

        {/*
          ── Hover tooltip ───────────────────────────────────────────────────
          Rendered at the OVERLAY level (not nested inside the node wrapper),
          positioned using the same pctX/pctY as the node plus a fixed pixel
          offset = NODE_R + TIP_GAP. This avoids any conflict with the
          transform: translate(-50%,-50%) on the node wrapper.
          ─────────────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {activeNode && (
            <motion.div
              key={activeNode.id}
              // Only animate opacity — if we also animate scale/y/x, Framer Motion
              // writes its own transform which overwrites the CSS translate that
              // controls the tooltip's position, causing it to appear in the wrong spot.
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                // Horizontal: centred on the node
                left: `${activeNode.pctX}%`,
                // Vertical: offset by (NODE_R + gap) from the node centre
                ...(activeNode.tipSide === 'above'
                  ? {
                      // tooltip sits ABOVE the circle
                      // top sets the BOTTOM of the tooltip via translateY(-100%)
                      top: `calc(${activeNode.pctY}% - ${NODE_R + TIP_GAP}px)`,
                      transform: 'translate(-50%, -100%)',
                    }
                  : {
                      // tooltip sits BELOW the circle
                      top: `calc(${activeNode.pctY}% + ${NODE_R + TIP_GAP}px)`,
                      transform: 'translateX(-50%)',
                    }),
                background: '#1d1d1f',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 14px',
                whiteSpace: 'nowrap',
                zIndex: 50,
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>{activeNode.title}</div>
              <div style={{ color: '#aeaeb2', fontSize: '12px', marginBottom: '2px' }}>{activeNode.org}</div>
              <div style={{ color: '#5ac8fa', fontSize: '11px', fontWeight: 600 }}>{activeNode.dates}</div>

              {/* Caret — points toward the node circle */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  ...(activeNode.tipSide === 'above'
                    ? { bottom: -6, borderTop: '6px solid #1d1d1f' }
                    : { top: -6, borderBottom: '6px solid #1d1d1f' }),
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Y-axis legend */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '4px', pointerEvents: 'none' }}>
          {['Expert', 'Mid', 'Entry'].map(l => (
            <span key={l} style={{ fontSize: '10px', fontWeight: 600, color: '#c7c7ca', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
