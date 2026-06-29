'use client'

import { useState, useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

/* ─── Command ─────────────────────────────────────────────────── */
const CMD = ' npx deploy-skills@latest rubencalderon/profile --init'

/* ─── 6-line ASCII art banner: RUBEN SKILLS ─────────────────── */
const ASCII_LINES = [
  '██████╗  ██╗   ██╗ ██████╗  ███████╗ ███╗   ██╗    ██████╗  ██╗  ██╗ ██╗ ██╗      ██╗      ██████╗ ',
  '██╔══██╗ ██║   ██║ ██╔══██╗ ██╔════╝ ████╗  ██║   ██╔════╝ ██║ ██╔╝ ██║ ██║      ██║      ██╔════╝',
  '██████╔╝ ██║   ██║ ██████╔╝ █████╗   ██╔██╗ ██║   ╚█████╗  █████╔╝  ██║ ██║      ██║      ╚█████╗ ',
  '██╔══██╗ ██║   ██║ ██╔══██╗ ██╔══╝   ██║╚██╗██║    ╚═══██╗ ██╔═██╗  ██║ ██║      ██║       ╚═══██╗',
  '██║  ██║ ╚██████╔╝ ██████╔╝ ███████╗ ██║ ╚████║   ██████╔╝ ██║  ██╗ ██║ ███████╗ ███████╗ ██████╔╝',
  '╚═╝  ╚═╝  ╚═════╝  ╚═════╝  ╚══════╝ ╚═╝  ╚═══╝   ╚═════╝  ╚═╝  ╚═╝ ╚═╝ ╚══════╝ ╚══════╝ ╚═════╝ ',
]

/* ─── Deployment tree ─────────────────────────────────────────── */
type LT = 'normal' | 'flower' | 'divider'

const TREE: { t: string; k: LT }[] = [
  { t: 'o Source: github.com/rubencalderon/profile.git', k: 'normal' },
  { t: '|', k: 'divider' },
  { t: 'o Cloned 2 main skill modules:', k: 'normal' },
  { t: '| ├── [1] cloud-infra-observability', k: 'normal' },
  { t: '| └── [2] agentic-ai-mlops', k: 'normal' },
  { t: '|', k: 'divider' },
  { t: '❁ Deploying Module [1]: Cloud & Infra', k: 'flower' },
  { t: '| ⚡ IaC: Terraform & Ansible initialized', k: 'normal' },
  { t: '| ⚡ K8s: Certified Administrator (CKA) active', k: 'normal' },
  { t: '| ⚡ Cloud: OCI, GCP (Anthos/GKE) & Azure', k: 'normal' },
  { t: '| ⚡ Observability: Prometheus, Grafana & ELK', k: 'normal' },
  { t: '|', k: 'divider' },
  { t: '❁ Deploying Module [2]: AI & MLOps', k: 'flower' },
  { t: '| ⚡ Agents: LangGraph multi-agent frameworks', k: 'normal' },
  { t: '| ⚡ GenAI: Advanced RAG, Vector Search & Embeddings', k: 'normal' },
  { t: '| ⚡ LLMOps: Prompt tuning, Evaluation & Guardrails', k: 'normal' },
  { t: '| ⚡ Analytics: High-throughput ETL & PANDAS ML', k: 'normal' },
  { t: '|', k: 'divider' },
  { t: 'o Verified Certifications:', k: 'normal' },
  { t: '| ✔ GCP Prof. ML Engineer / Cloud Architect', k: 'normal' },
  { t: '| ✔ Azure AI Engineer / K8s Admin (CKA)', k: 'normal' },
]

function TreeRow({ row }: { row: { t: string; k: LT } }) {
  // ❁ lines: entire line is cyan
  if (row.k === 'flower') return <span style={{ color: '#30b0c7', fontWeight: 700 }}>{row.t}</span>
  // Everything else black; ⚡ emoji and ✔ render in their natural glyph color
  return <span style={{ color: '#1d1d1f' }}>{row.t}</span>
}

/* ─── Progress display ────────────────────────────────────────── */
// Fill goes 0→100 for both bar width and label.
function displayPct(fill: number) {
  return Math.round(fill)
}

/* ─── Component ───────────────────────────────────────────────── */
type Phase = 'idle' | 'cmd' | 'ascii' | 'load' | 'tree' | 'done'

export default function CLIAnimation() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(wrapRef, { once: true, margin: '-60px' })

  const [phase, setPhase] = useState<Phase>('idle')
  const [cmdChars, setCmdChars] = useState(0)
  const [fill, setFill] = useState(0)         // 0–100, controls bar width
  const [lines, setLines] = useState(0)        // tree lines revealed

  /* ── Trigger on scroll-into-view ── */
  useEffect(() => {
    if (isInView && phase === 'idle') setPhase('cmd')
  }, [isInView, phase])

  /* ── Type command — 24 ms/char ── */
  useEffect(() => {
    if (phase !== 'cmd') return
    if (cmdChars < CMD.length) {
      const t = setTimeout(() => setCmdChars((n) => n + 1), 24)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPhase('ascii'), 260)
    return () => clearTimeout(t)
  }, [phase, cmdChars])

  /* ── ascii → load ── */
  useEffect(() => {
    if (phase !== 'ascii') return
    const t = setTimeout(() => setPhase('load'), 450)
    return () => clearTimeout(t)
  }, [phase])

  /* ── Loading bar over ~3 s ── */
  useEffect(() => {
    if (phase !== 'load') return
    let pct = 0
    const iv = setInterval(() => {
      pct = Math.min(100, pct + 100 / 30)  // 30 steps × 100 ms = 3 s
      setFill(pct)
      if (pct >= 100) clearInterval(iv)
    }, 100)
    return () => clearInterval(iv)
  }, [phase])

  /* ── load → tree ── */
  useEffect(() => {
    if (phase !== 'load' || fill < 100) return
    const t = setTimeout(() => setPhase('tree'), 275)
    return () => clearTimeout(t)
  }, [phase, fill])

  /* ── Reveal tree lines — 330 ms each ── */
  useEffect(() => {
    if (phase !== 'tree') return
    if (lines < TREE.length) {
      const t = setTimeout(() => setLines((n) => n + 1), 330)
      return () => clearTimeout(t)
    }
    setPhase('done')
  }, [phase, lines])

  const after = (...ps: Phase[]) => ps.includes(phase)

  return (
    <div
      ref={wrapRef}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 10px 48px rgba(0,0,0,0.12), 0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid #e2e2e2',
        background: '#ffffff',
        fontFamily: '"Courier New", Courier, monospace',
        lineHeight: 1.58,
      }}
    >
      {/* ── macOS title bar ── */}
      <div
        style={{
          background: '#f5f5f5',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          borderBottom: '1px solid #e5e5e5',
        }}
      >
        {(['#ff5f57', '#febc2e', '#28c840'] as const).map((c, i) => (
          <span
            key={i}
            style={{ width: 11, height: 11, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 }}
          />
        ))}
        <span
          style={{
            fontSize: '12px',
            color: '#8e8e93',
            marginLeft: '8px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 500,
          }}
        >
          rubencalderon — skills deployment
        </span>
      </div>

      {/* ── Terminal body — expands to fit all content, no scroll ── */}
      <div
        style={{
          padding: '16px 20px',
          color: '#1d1d1f',
          fontSize: '12.5px',
        }}
      >
        {/* Command */}
        {after('cmd', 'ascii', 'load', 'tree', 'done') && (
          <div style={{ marginBottom: '2px' }}>
            <span style={{ color: '#28c840', fontWeight: 700 }}>$</span>
            <span style={{ color: '#1d1d1f' }}>{CMD.slice(0, cmdChars)}</span>
            {phase === 'cmd' && (
              <span
                style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '13px',
                  background: '#1d1d1f',
                  marginLeft: '1px',
                  verticalAlign: 'text-bottom',
                  animation: 'cursor-blink 1s step-end infinite',
                }}
              />
            )}
          </div>
        )}

        {/* 6-line ASCII banner + fetching */}
        {after('ascii', 'load', 'tree', 'done') && (
          <div style={{ margin: '10px 0 6px' }}>
            {/* Scrollable banner wrapper so wide ASCII never breaks the layout */}
            <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
              <div style={{ display: 'inline-block', whiteSpace: 'pre' }}>
                {ASCII_LINES.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color: '#30b0c7',
                      fontWeight: 700,
                      fontSize: '9px',
                      letterSpacing: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '8px', color: '#1d1d1f', fontSize: '12.5px' }}>
              Fetching remote modules...
            </div>
          </div>
        )}

        {/* Progress bar — label starts at −27%, bar fills 0→100% */}
        {after('load', 'tree', 'done') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 10px', fontSize: '12.5px' }}>
            <span
              style={{
                color: '#1d1d1f',
                minWidth: '42px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {displayPct(fill)}%
            </span>
            <div
              style={{
                flex: 1,
                height: '10px',
                background: '#f0f0f0',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid #e0e0e0',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${fill}%`,
                  background: 'linear-gradient(90deg, #30b0c7 0%, #5ac8fa 100%)',
                  transition: 'width 0.09s linear',
                  borderRadius: '3px',
                }}
              />
            </div>
            <span style={{ color: '#1d1d1f', whiteSpace: 'nowrap' }}>Loading AI agents...</span>
          </div>
        )}

        {/* Deployment tree */}
        {after('tree', 'done') && (
          <div style={{ fontSize: '12.5px' }}>
            {TREE.slice(0, lines).map((row, i) => (
              <div key={i}>
                <TreeRow row={row} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
