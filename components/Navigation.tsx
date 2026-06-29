'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

const navItems = [
  {
    id: 'hero',
    label: 'About',
    shortLabel: 'About',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
  {
    id: 'competencies',
    label: 'Core Competencies',
    shortLabel: 'Core',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'experience',
    label: 'Experience',
    shortLabel: 'Career',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="7" width="19" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M2.5 12h19" />
      </svg>
    ),
  },
  {
    id: 'projects',
    label: 'Projects',
    shortLabel: 'Work',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2Z" />
      </svg>
    ),
  },
  {
    id: 'certifications',
    label: 'Certifications',
    shortLabel: 'Certs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="5.5" />
        <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" />
      </svg>
    ),
  },
  {
    id: 'skills',
    label: 'Toolbox',
    shortLabel: 'Stack',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h6v6H9z" />
        <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
      </svg>
    ),
  },
  {
    id: 'contact',
    label: 'Contact',
    shortLabel: 'Contact',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3.5 7 8.5 6 8.5-6" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const [active, setActive] = useState('hero')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.getAttribute('data-section') ?? 'hero')
          }
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    )

    const sectionEls = document.querySelectorAll('section[data-section]')
    sectionEls.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.querySelector(`section[data-section="${id}"]`)
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 8,
        behavior: 'smooth',
      })
    }
  }

  return (
    <nav
      aria-label="Section navigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '80px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      {/* Logo — pinned to top */}
      <motion.div
        whileHover={{ scale: 1.06 }}
        style={{
          position: 'absolute',
          top: '18px',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: 'default',
          flexShrink: 0,
        }}
      >
        <Image
          src="/images/profileimage/RCIcon.png"
          alt="RC"
          width={38}
          height={38}
          priority
          style={{ objectFit: 'cover', borderRadius: '50%', width: '38px', height: '38px' }}
        />
      </motion.div>

      {/* Nav buttons — centered in the FULL sidebar height */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        {navItems.map((item) => {
          const isActive = active === item.id
          return (
            <motion.button
              key={item.id}
              title={item.label}
              aria-label={item.label}
              onClick={() => scrollTo(item.id)}
              whileHover={{ background: 'rgba(0,0,0,0.05)' }}
              whileTap={{ scale: 0.92 }}
              style={{
                position: 'relative',
                width: '62px',
                border: 'none',
                background: 'none',
                color: isActive ? '#0066cc' : '#86868b',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                borderRadius: '12px',
                transition: 'color 0.2s ease',
                padding: '10px 4px 8px',
              }}
            >
              {/* Active left-edge indicator */}
              <motion.span
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  left: '-9px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '22px',
                  borderRadius: '9999px',
                  background: '#0066cc',
                }}
              />
              {item.icon}
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  fontFamily: 'var(--font-text)',
                }}
              >
                {item.shortLabel}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
