'use client'

import { useRef } from 'react'
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion'
import { logos } from '@/lib/data'

const SPEED = 90 // px/s

export default function PlatformsStrip() {
  const xRef = useRef(0)
  const x = useMotionValue(0)
  const trackRef = useRef<HTMLDivElement>(null)

  // Triple the logos so there are always enough items to fill the viewport during scroll
  const tripled = [...logos, ...logos, ...logos]

  useAnimationFrame((_, delta) => {
    const track = trackRef.current
    if (!track) return

    // Width of ONE full logo set (1/3 of the tripled track)
    const singleSet = track.scrollWidth / 3

    xRef.current -= (delta / 1000) * SPEED

    // Once we've scrolled one full set, snap back by exactly one set — seamless
    if (Math.abs(xRef.current) >= singleSet) {
      xRef.current += singleSet
    }

    x.set(xRef.current)
  })

  return (
    <section style={{ background: '#ffffff', borderBottom: '1px solid #f0f0f0', overflow: 'hidden' }}>
      <div style={{ padding: '22px 0' }}>
        <div
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            ref={trackRef}
            style={{
              display: 'flex',
              alignItems: 'center',
              x,
              width: 'max-content',
            }}
          >
            {tripled.map((logo, i) => (
              <div
                key={i}
                title={logo.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 36px',
                  flexShrink: 0,
                }}
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  style={{
                    height: '34px',
                    width: 'auto',
                    maxWidth: '80px',
                    objectFit: 'contain',
                    filter: 'grayscale(100%) opacity(50%)',
                    transition: 'filter 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.filter = 'grayscale(0%) opacity(100%)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.filter = 'grayscale(100%) opacity(50%)'
                  }}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
