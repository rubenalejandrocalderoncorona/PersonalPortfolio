'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
  once?: boolean
}

export default function ScrollReveal({
  children,
  className,
  style,
  delay = 0,
  once = true,
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.28, 0.11, 0.32, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
