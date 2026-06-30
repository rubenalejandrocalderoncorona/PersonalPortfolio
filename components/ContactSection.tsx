'use client'

import { motion } from 'framer-motion'
import ScrollReveal from './ScrollReveal'

export default function ContactSection() {
  const year = new Date().getFullYear()

  return (
    <section
      data-section="contact"
      style={{
        background: '#1d1d1f',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(120% 90% at 50% 120%, rgba(0,102,204,0.2), transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <ScrollReveal style={{ position: 'relative' }}>
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            padding: '104px 48px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 6vw, 52px)',
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: '0 0 20px',
              color: '#ffffff',
            }}
          >
            Let&apos;s build something reliable.
          </h2>
          <p
            style={{
              fontSize: '19px',
              lineHeight: 1.5,
              color: '#aeaeb2',
              margin: '0 auto 40px',
              maxWidth: '520px',
            }}
          >
            Open to senior AI cloud and platform roles. The fastest way to reach me is email.
          </p>

          {/* CTA buttons */}
          <div
            style={{
              display: 'flex',
              gap: '14px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '48px',
            }}
          >
            <motion.a
              href="/contact"
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 26px',
                borderRadius: '9999px',
                background: '#0066cc',
                color: '#fff',
                fontSize: '17px',
                fontWeight: 400,
                cursor: 'pointer',
              }}
            >
              Send email
            </motion.a>
            <motion.a
              href="https://github.com/rubenalejandrocalderoncorona"
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 26px',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '17px',
                fontWeight: 400,
                border: '1px solid rgba(255,255,255,0.16)',
                cursor: 'pointer',
              }}
            >
              GitHub
            </motion.a>
            <motion.a
              href="https://www.linkedin.com/in/ruben-alejandro-calderon-corona"
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 26px',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '17px',
                fontWeight: 400,
                border: '1px solid rgba(255,255,255,0.16)',
                cursor: 'pointer',
              }}
            >
              LinkedIn
            </motion.a>
          </div>

          {/* Contact details */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px 28px',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#86868b',
            }}
          >
            <span>rubenalejandrocalderoncorona@gmail.com</span>
            <span>·</span>
            <span>+52 777 260 0878</span>
            <span>·</span>
            <span>English C2 · German B2</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Footer bar */}
      <div
        style={{
          position: 'relative',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '26px 48px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <span style={{ fontSize: '13px', color: '#6e6e73' }}>
          &copy; {year} Rubén Calderón
        </span>
        <span style={{ fontSize: '13px', color: '#6e6e73' }}>
          M.Sc. Artificial Intelligence (in progress) · UT Austin
        </span>
      </div>
    </section>
  )
}
