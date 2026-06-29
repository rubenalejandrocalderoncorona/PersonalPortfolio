'use client'

import { motion } from 'framer-motion'
import { competencies } from '@/lib/data'
import ScrollReveal from './ScrollReveal'
import CompetenciesAnimation from './CompetenciesAnimation'

export default function CompetenciesSection() {
  return (
    <section
      data-section="competencies"
      style={{ background: '#f5f5f7' }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '96px 48px',
          display: 'grid',
          gridTemplateColumns: '0.85fr 1.15fr',
          gap: '64px',
          alignItems: 'start',
        }}
      >
        {/* Sticky left column */}
        <ScrollReveal style={{ position: 'sticky', top: '64px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#0066cc',
              marginBottom: '18px',
            }}
          >
            Core competencies
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '44px',
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: '-0.025em',
              margin: '0 0 20px',
              color: '#1d1d1f',
            }}
          >
            What I do.
          </h2>
          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.5,
              color: '#6e6e73',
              margin: '0 0 32px',
            }}
          >
            I bridge cloud infrastructure engineering with applied AI — automating incident response,
            reducing manual toil, and improving system reliability at enterprise scale.
          </p>
          <CompetenciesAnimation />
        </ScrollReveal>

        {/* Right list */}
        <div>
          {competencies.map((c, i) => (
            <motion.div
              key={c.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.28, 0.11, 0.32, 1] }}
              whileHover={{ background: '#ffffff' }}
              style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'flex-start',
                padding: '28px 20px',
                borderTop: '1px solid #dadadd',
                borderRadius: '14px',
                cursor: 'default',
                transition: 'background 0.2s ease',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#0066cc',
                  paddingTop: '4px',
                  minWidth: '28px',
                }}
              >
                {c.n}
              </span>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-text)',
                    fontSize: '24px',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    margin: '0 0 8px',
                    color: '#1d1d1f',
                  }}
                >
                  {c.title}
                </h3>
                <p
                  style={{
                    fontSize: '17px',
                    lineHeight: 1.47,
                    color: '#6e6e73',
                    margin: 0,
                  }}
                >
                  {c.desc}
                </p>
              </div>
              <span style={{ color: '#86868b', fontSize: '22px', paddingTop: '2px' }}>›</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
