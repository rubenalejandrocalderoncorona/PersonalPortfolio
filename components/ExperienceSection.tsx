'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { timeline } from '@/lib/data'
import ScrollReveal from './ScrollReveal'
import CareerAnimation from './CareerAnimation'

type Tab = 'path' | 'timeline'

/* Company logos for the timeline — shown as small inline badges */
const ORG_LOGOS: Record<string, string> = {
  Oracle:    '/images/svglogos/Oracle.svg',
  SAP:       '/images/svglogos/SAP.svg',
  Liverpool: '/images/svglogos/LiverPoolLogo.svg',
}

function getOrgLogo(org: string) {
  if (org.includes('Oracle'))    return ORG_LOGOS.Oracle
  if (org.includes('SAP'))       return ORG_LOGOS.SAP
  if (org.includes('Liverpool')) return ORG_LOGOS.Liverpool
  return null
}

export default function ExperienceSection() {
  const [tab, setTab] = useState<Tab>('path')

  return (
    <section
      data-section="experience"
      style={{ background: '#ffffff' }}
    >
      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '96px 48px' }}>

        {/* ── Header ── */}
        <ScrollReveal style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0066cc', marginBottom: '14px' }}>
            Career journey
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '44px', fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.025em', margin: '0 0 32px', color: '#1d1d1f' }}>
            From infrastructure to intelligence.
          </h2>

          {/* ── Tab switcher ── */}
          <div
            style={{
              display: 'inline-flex',
              background: '#f5f5f7',
              borderRadius: '12px',
              padding: '4px',
              gap: '2px',
            }}
          >
            {([
              { id: 'path',     label: 'Career Path' },
              { id: 'timeline', label: 'Full Timeline' },
            ] as { id: Tab; label: string }[]).map(({ id, label }) => (
              <motion.button
                key={id}
                onClick={() => setTab(id)}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-text)',
                  letterSpacing: '-0.01em',
                  background: tab === id ? '#ffffff' : 'transparent',
                  color: tab === id ? '#1d1d1f' : '#86868b',
                  boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </ScrollReveal>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">
          {tab === 'path' ? (
            <motion.div
              key="path"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
            >
              {/* Instruction hint */}
              <p style={{ fontSize: '13px', color: '#aeaeb2', marginBottom: '20px', textAlign: 'center' }}>
                Hover over a logo to reveal the role — click through to the Full Timeline for details.
              </p>
              <CareerAnimation />
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
            >
              <div style={{ position: 'relative', paddingLeft: '30px' }}>
                {/* Vertical rule */}
                <div style={{ position: 'absolute', left: '5px', top: '6px', bottom: '6px', width: '1px', background: '#e0e0e0' }} />

                {timeline.map((job, i) => {
                  const logo = getOrgLogo(job.org)
                  return (
                    <motion.div
                      key={job.role}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.7, delay: i * 0.1, ease: [0.28, 0.11, 0.32, 1] }}
                      style={{ position: 'relative', paddingBottom: '44px' }}
                    >
                      {/* Timeline dot */}
                      <span style={{ position: 'absolute', left: '-30px', top: '5px', width: '11px', height: '11px', borderRadius: '50%', background: '#0066cc', border: '2px solid #fff', boxShadow: '0 0 0 1px #e0e0e0' }} />

                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {logo && (
                            <img
                              src={logo}
                              alt={job.org}
                              style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0, filter: 'grayscale(20%)' }}
                            />
                          )}
                          <h3 style={{ fontFamily: 'var(--font-text)', fontSize: '23px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: '#1d1d1f' }}>
                            {job.role}
                          </h3>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0066cc', whiteSpace: 'nowrap' }}>
                          {job.dates}
                        </span>
                      </div>

                      <div style={{ fontSize: '15px', color: '#86868b', marginBottom: '16px' }}>
                        {job.org}
                      </div>

                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {job.points.map((pt) => (
                          <li key={pt} style={{ position: 'relative', paddingLeft: '20px', fontSize: '16px', lineHeight: 1.5, color: '#48484a' }}>
                            <span style={{ position: 'absolute', left: 0, top: 0, color: '#c7c7ca' }}>—</span>
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
