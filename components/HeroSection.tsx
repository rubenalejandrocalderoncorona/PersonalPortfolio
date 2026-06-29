'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import TypewriterText from './TypewriterText'
import GlitchName from './GlitchName'

const ROLE = 'MLOps & Applied AI Engineer'
const DESC =
  'Specializing in enterprise AI execution, autonomous agentic workflows, and production-grade machine learning infrastructure. Backed by 6+ years of experience driving self-healing operations across AWS, OCI, GCP, and Azure, with deep expertise in MLOps, infrastructure as code (IaC), and automated systems engineering.'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, delay, ease: [0.28, 0.11, 0.32, 1] as [number, number, number, number] },
})

export default function HeroSection() {
  const [showDesc, setShowDesc] = useState(false)

  return (
    <section
      data-section="hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        color: '#fff',
      }}
    >
      {/* ── Layer 1: Alumica video background ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
        src="https://cdn.sceneai.art/Hero%20Section%20Video/5a6cf9a9-9f93-4e44-88f3-cf666065daf7.mp4"
      />

      {/* ── Layer 2: 40% black overlay ── */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 1 }}
      />

      {/* ── Layer 3: Blue radial glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(120% 80% at 50% -10%, rgba(0,102,204,0.24), transparent 58%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* ── Layer 4: Content ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '80px 32px 80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Social links */}
        <motion.div
          {...fadeUp(0.1)}
          style={{ display: 'flex', gap: '16px', marginBottom: '36px' }}
        >
          {[
            {
              href: 'https://github.com/rubenalejandrocalderoncorona',
              label: 'GitHub',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.46.1 2.72.64.71 1.03 1.62 1.03 2.74 0 3.92-2.34 4.78-4.57 5.04.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
                </svg>
              ),
            },
            {
              href: 'https://www.linkedin.com/in/ruben-alejandro-calderon-corona',
              label: 'LinkedIn',
              icon: (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.96-1.8-2.96-1.8 0-2.08 1.4-2.08 2.86V21H9z" />
                </svg>
              ),
            },
            {
              href: 'https://www.credly.com/users/ruben-alejandro-calderon-corona/badges/credly',
              label: 'Credly badges',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="9" r="5.5" />
                  <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" />
                </svg>
              ),
            },
            {
              href: 'mailto:rubenalejandrocalderoncorona@gmail.com',
              label: 'Email',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3.5 7 8.5 6 8.5-6" />
                </svg>
              ),
            },
          ].map(({ href, label, icon }) => (
            <motion.a
              key={label}
              href={href}
              title={label}
              aria-label={label}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              whileHover={{ background: 'rgba(255,255,255,0.13)', scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              {icon}
            </motion.a>
          ))}
        </motion.div>

        {/* ── Glass intro card ── */}
        <motion.div
          {...fadeUp(0.18)}
          style={{
            background: 'rgba(0, 0, 0, 0.38)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '28px',
            padding: '40px 36px 36px',
            width: '100%',
            maxWidth: '600px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          {/* Profile photo */}
          <div
            style={{
              width: '128px',
              height: '128px',
              borderRadius: '50%',
              padding: '3px',
              background: 'linear-gradient(160deg, rgba(0,102,204,0.75), rgba(255,255,255,0.14))',
              marginBottom: '20px',
              flexShrink: 0,
            }}
          >
            <Image
              id="rc-headshot"
              src="/images/profileimage/ProfileImage.jpeg"
              alt="Rubén Calderón"
              width={122}
              height={122}
              priority
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block',
                width: '122px',
                height: '122px',
              }}
            />
          </div>

          {/* Available badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 13px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.11)',
              marginBottom: '24px',
            }}
          >
            <span style={{ position: 'relative', width: '7px', height: '7px', flexShrink: 0 }}>
              <span className="ping-dot" />
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#34c759' }} />
            </span>
            <span style={{ fontSize: '13px', color: '#d6d6d8', letterSpacing: '-0.01em' }}>
              Available · Remote
            </span>
          </div>

          {/* ── Name: Glitch reveal animation ── */}
          <GlitchName
            style={{ width: '100%', marginBottom: '12px' }}
            onResolved={() => {/* role starts via its own startDelay */}}
          />

          {/* Role — starts immediately alongside the glitch animation */}
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(15px, 2.2vw, 19px)',
              fontWeight: 300,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              color: 'rgba(255,255,255,0.72)',
              margin: '0 0 18px',
            }}
          >
            <TypewriterText
              text={ROLE}
              startDelay={0}
              baseSpeed={32}
              hideCursorWhenDone={true}
              onComplete={() => setShowDesc(true)}
            />
          </p>

          {/* Description — types right after role finishes, fast */}
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.55)',
              margin: 0,
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            {showDesc ? (
              <TypewriterText
                text={DESC}
                startDelay={60}
                baseSpeed={8}
              />
            ) : (
              <span style={{ visibility: 'hidden', fontSize: '14px' }}>{DESC.slice(0, 1)}</span>
            )}
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          {...fadeUp(0.3)}
          style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <motion.a
            href="#contact"
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault()
              const el = document.querySelector('section[data-section="contact"]')
              if (el)
                window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' })
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              borderRadius: '9999px',
              background: '#0066cc',
              color: '#fff',
              fontSize: '17px',
              fontWeight: 400,
              cursor: 'pointer',
            }}
          >
            Get in touch
          </motion.a>
          <motion.a
            href="/RubenCalderonFinalCV.pdf"
            download="RubenCalderonFinalCV.pdf"
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.10)',
              color: '#fff',
              fontSize: '17px',
              fontWeight: 400,
              border: '1px solid rgba(255,255,255,0.16)',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            View Resume
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
