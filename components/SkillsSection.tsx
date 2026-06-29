'use client'

import { motion } from 'framer-motion'
import { skillGroups } from '@/lib/data'
import ScrollReveal from './ScrollReveal'

/* ─── Expertise classification ─────────────────────────────── */
const EXPERT = new Set([
  'OCI', 'GCP', 'GKE', 'Dataflow', 'BigQuery', 'Vertex AI', 'Anthos', 'Azure',
  'Terraform', 'Ansible', 'Kubernetes', 'Docker', 'GitHub Actions',
  'Agentic RAG', 'LangGraph', 'LLM Integration', 'MLOps', 'Vector Search', 'Anomaly Detection',
  'Python', 'Bash',
])

const INTERMEDIATE = new Set([
  'ElasticSearch / ELK', 'Prometheus', 'Grafana', 'OpenTelemetry', 'OCI Monitoring',
  'Java', 'JavaScript', 'SQL', 'GraphQL',
  'CI/CD Pipelines', 'Linux Admin', 'REST APIs', 'Git',
])

function getLevel(tag: string): 'expert' | 'intermediate' | 'familiar' {
  if (EXPERT.has(tag))       return 'expert'
  if (INTERMEDIATE.has(tag)) return 'intermediate'
  return 'familiar'
}

const LEVEL_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  expert:       { color: '#0066cc', bg: 'rgba(0,102,204,0.10)', border: 'rgba(0,102,204,0.28)' },
  intermediate: { color: '#3a8bbf', bg: 'rgba(58,139,191,0.09)', border: 'rgba(58,139,191,0.24)' },
  familiar:     { color: '#7ab3d4', bg: 'rgba(122,179,212,0.08)', border: 'rgba(122,179,212,0.20)' },
}

export default function SkillsSection() {
  return (
    <section data-section="skills" style={{ background: '#f5f5f7' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>

        {/* Header */}
        <ScrollReveal style={{ marginBottom: '32px', maxWidth: '620px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0066cc', marginBottom: '14px' }}>
            Toolbox
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '44px', fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.025em', margin: 0, color: '#1d1d1f' }}>
            The stack I work in.
          </h2>
        </ScrollReveal>

        {/* Legend */}
        <ScrollReveal style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#86868b' }}>
              Expertise level:
            </span>
            {([
              { level: 'expert',       label: 'Expert' },
              { level: 'intermediate', label: 'Intermediate' },
              { level: 'familiar',     label: 'Familiar' },
            ] as const).map(({ level, label }) => {
              const s = LEVEL_STYLE[level]
              return (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{
                    width: '28px', height: '10px', borderRadius: '9999px',
                    background: s.color, opacity: 0.88,
                  }} />
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#48484a' }}>{label}</span>
                </div>
              )
            })}
          </div>
        </ScrollReveal>

        {/* Skills grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
          {skillGroups.map((group, i) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.28, 0.11, 0.32, 1] }}
              style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '18px', padding: '26px 28px' }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0066cc', marginBottom: '16px' }}>
                {group.title}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
                {group.tags.map((tag) => {
                  const lvl = getLevel(tag)
                  const s   = LEVEL_STYLE[lvl]
                  return (
                    <motion.span
                      key={tag}
                      title={`${lvl.charAt(0).toUpperCase() + lvl.slice(1)} level`}
                      whileHover={{ scale: 1.05 }}
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: s.color,
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        cursor: 'default',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      {tag}
                    </motion.span>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
