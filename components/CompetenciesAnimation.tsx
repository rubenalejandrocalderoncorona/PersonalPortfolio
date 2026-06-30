'use client'

import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

/* ─── Canvas ─── */
const W = 920
const H = 300
const CYCLE = 11000 // ms

const eio  = (t: number) => t < 0.5 ? 2*t*t : 1-(-2*t+2)**2/2
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const pg = (ms: number, s: number, e: number) => eio(clamp((ms-s)/(e-s), 0, 1))

type V2 = { x: number; y: number }

/* ─── Icon positions ─── */
const SZ = 82   // logo icon diameter (bigger — new icons need more room to read clearly)
const R  = SZ / 2

const POS = {
  aiops: { x: 72,  y: 150 },   // AI-Powered Operations
  rag:   { x: 225, y: 150 },   // Agentic RAG Workflows
  iac:   { x: 378, y: 150 },   // Infrastructure as Code
  mlops: { x: 531, y: 150 },   // Observability & MLOps
  tool:  { x: 672, y: 96  },   // AITool (upper)
  dev:   { x: 672, y: 204 },   // DeveloperIcon (lower)
  plus:  { x: 672, y: 150 },   // "+" midpoint between tool and dev
  corp:  { x: 848, y: 150 },   // Corporate
}

/* ─── Arrow definitions ─── */
// Each arrow: from edge of source to edge of target
function edgePt(from: V2, to: V2): { s: V2; e: V2 } {
  const dx = to.x - from.x, dy = to.y - from.y
  const dist = Math.hypot(dx, dy)
  const ux = dx/dist, uy = dy/dist
  return {
    s: { x: from.x + ux*(R+2), y: from.y + uy*(R+2) },
    e: { x: to.x   - ux*(R+8), y: to.y   - uy*(R+8) },
  }
}

const ARROWS: Array<{ from: V2; to: V2; color: string; startMs: number }> = [
  { from: POS.aiops, to: POS.rag,   color: '#f59e0b', startMs: 900  },
  { from: POS.rag,   to: POS.iac,   color: '#3b82f6', startMs: 1700 },
  { from: POS.iac,   to: POS.mlops, color: '#ef4444', startMs: 2500 },
  { from: POS.mlops, to: POS.tool,  color: '#8b5cf6', startMs: 3300 },
  { from: POS.mlops, to: POS.dev,   color: '#6366f1', startMs: 3500 },
  { from: POS.plus,  to: POS.corp,  color: '#ffd700', startMs: 4600 },
]
const ARROW_DUR = 680  // ms to draw each arrow

const ICONS: Array<{ key: string; src: string; pos: V2 }> = [
  { key: 'aiops', src: '/images/widoanimation/AIOperations.svg', pos: POS.aiops },
  { key: 'rag',   src: '/images/widoanimation/AgentRAG.svg',     pos: POS.rag   },
  { key: 'iac',   src: '/images/widoanimation/IaC.svg',          pos: POS.iac   },
  { key: 'mlops', src: '/images/widoanimation/MLOps.svg',        pos: POS.mlops },
  { key: 'tool',  src: '/images/widoanimation/AITool.svg',       pos: POS.tool  },
  { key: 'dev',   src: '/images/widoanimation/DeveloperIcon.svg', pos: POS.dev  },
  { key: 'corp',  src: '/images/widoanimation/Corporate.svg',    pos: POS.corp  },
]

const PLUS_START  = 4200   // "+" appears
const CORP_GLOW_S = 5600
const LABEL_S     = 6000

export default function CompetenciesAnimation() {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isInView  = useInView(wrapRef, { once: false, margin: '-80px' })
  const startRef  = useRef<number | null>(null)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxRaw = canvas.getContext('2d')
    if (!ctxRaw) return
    const ctx: CanvasRenderingContext2D = ctxRaw

    /* Load images */
    const imgs: Record<string, HTMLImageElement> = {}
    let loaded = 0
    ICONS.forEach(({ key, src }) => {
      const img = new Image()
      img.onload = img.onerror = () => { if (++loaded === ICONS.length) loop() }
      img.src = src
      imgs[key] = img
    })

    /* ── Draw dotted arrow with moving arrowhead ── */
    function drawArrow(s: V2, e: V2, color: string, progress: number) {
      if (progress <= 0) return
      const dx = e.x - s.x, dy = e.y - s.y
      const dist = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx)
      const tip: V2 = {
        x: s.x + dx * progress,
        y: s.y + dy * progress,
      }

      // Dotted line from s to current tip
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth   = 2.5
      ctx.setLineDash([7, 6])
      ctx.lineCap     = 'round'
      ctx.shadowColor = color
      ctx.shadowBlur  = 9
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(tip.x, tip.y)
      ctx.stroke()
      ctx.setLineDash([])

      // Arrowhead at tip (always visible while drawing)
      const aw = 12, ah = 6
      ctx.fillStyle   = color
      ctx.shadowBlur  = 12
      ctx.save()
      ctx.translate(tip.x, tip.y)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-aw, -ah)
      ctx.lineTo(-aw,  ah)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
      ctx.restore()
    }

    /* ── Draw icon (preserves each SVG's natural aspect ratio) ── */
    function drawIcon(key: string, pos: V2, alpha: number, scale = 1) {
      const img = imgs[key]
      if (!img || alpha <= 0) return
      const box = SZ * scale
      // Fit image within box×box without distortion
      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1
      let dw = box, dh = box
      if (ratio > 1) dh = box / ratio
      else dw = box * ratio

      ctx.save()
      ctx.globalAlpha = alpha
      // Circle background
      ctx.shadowColor = 'rgba(0,0,0,0.10)'
      ctx.shadowBlur  = 10
      ctx.fillStyle   = '#ffffff'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, R + 2, 0, Math.PI * 2)
      ctx.fill()
      // Icon image, centered, aspect-correct
      ctx.shadowBlur = 0
      ctx.drawImage(img, pos.x - dw/2, pos.y - dh/2, dw, dh)
      ctx.restore()
    }

    /* ── Main loop ── */
    function loop() {
      function frame(ts: number) {
        if (!startRef.current) startRef.current = ts
        const tms = (ts - startRef.current) % CYCLE

        /* Background */
        ctx.clearRect(0, 0, W, H)
        const bg = ctx.createLinearGradient(0, 0, W, H)
        bg.addColorStop(0, '#eef4ff')
        bg.addColorStop(1, '#f6f8fc')
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, W, H)

        /* All icons appear simultaneously */
        const iconAlpha = pg(tms, 0, 650)
        ICONS.forEach(({ key, pos }) => drawIcon(key, pos, iconAlpha))

        /* Corporate glow pulse */
        const corpGlow = pg(tms, CORP_GLOW_S, CORP_GLOW_S + 1000)
        if (corpGlow > 0) {
          ctx.save()
          ctx.globalAlpha = corpGlow * 0.35
          ctx.strokeStyle = '#ffd700'
          ctx.lineWidth   = 2
          ctx.shadowColor = '#ffd700'
          ctx.shadowBlur  = 20
          for (let r = R + 8; r <= R + 30; r += 12) {
            ctx.beginPath()
            ctx.arc(POS.corp.x, POS.corp.y, r, 0, Math.PI * 2)
            ctx.stroke()
          }
          ctx.restore()
          // Redraw icon on top
          drawIcon('corp', POS.corp, iconAlpha, 1 + corpGlow * 0.08)
        }

        /* Sequential dotted arrows */
        ARROWS.forEach(({ from, to, color, startMs }) => {
          const p = pg(tms, startMs, startMs + ARROW_DUR)
          if (p <= 0) return
          const { s, e } = edgePt(from, to)
          drawArrow(s, e, color, p)
        })

        /* "+" between tool and dev */
        const plusAlpha = pg(tms, PLUS_START, PLUS_START + 500)
        if (plusAlpha > 0) {
          ctx.save()
          ctx.globalAlpha  = plusAlpha
          ctx.fillStyle    = '#1d1d1f'
          ctx.font         = `bold ${Math.round(20)}px system-ui,-apple-system,sans-serif`
          ctx.textAlign    = 'center'
          ctx.textBaseline = 'middle'
          ctx.shadowColor  = '#6366f1'
          ctx.shadowBlur   = 8 * plusAlpha
          ctx.fillText('+', POS.plus.x, POS.plus.y)
          ctx.restore()
        }

        /* Label */
        const labelAlpha = pg(tms, LABEL_S, LABEL_S + 500)
        if (labelAlpha > 0) {
          ctx.save()
          ctx.globalAlpha  = labelAlpha
          ctx.fillStyle    = '#0066cc'
          ctx.font         = 'bold 10px system-ui,-apple-system,sans-serif'
          ctx.textAlign    = 'center'
          ctx.textBaseline = 'top'
          ctx.fillText('ENTERPRISE AI', POS.corp.x, POS.corp.y + R + 10)
          ctx.restore()
        }

        rafRef.current = requestAnimationFrame(frame)
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-product)',
        background: '#eef4ff',
        lineHeight: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  )
}
