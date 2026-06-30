'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-text)',
  fontSize: '15px',
  color: '#1d1d1f',
  background: '#f5f5f7',
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  padding: '13px 16px',
  outline: 'none',
  transition: 'border-color 0.15s ease, background 0.15s ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#48484a',
  marginBottom: '7px',
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    const form = e.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      company: String(data.get('company') ?? ''),
      message: String(data.get('message') ?? ''),
      honeypot: String(data.get('website') ?? ''), // hidden field — bots fill it, humans don't
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      setStatus('sent')
      form.reset()
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please check your connection and try again.')
    }
  }

  const fieldStyle = (name: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused === name ? '#0066cc' : '#e0e0e0',
    background: focused === name ? '#ffffff' : '#f5f5f7',
  })

  if (status === 'sent') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: 'center',
          padding: '48px 32px',
          background: '#f5f5f7',
          borderRadius: '18px',
          border: '1px solid #e0e0e0',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(0,102,204,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: '#1d1d1f', margin: '0 0 8px' }}>
          Message sent.
        </h2>
        <p style={{ fontSize: '15px', color: '#6e6e73', margin: 0 }}>
          Thanks for reaching out — I&apos;ll reply directly to your email soon.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from real users via CSS, bots fill any visible-looking field */}
      <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
        <div>
          <label style={labelStyle} htmlFor="name">Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jane Doe"
            style={fieldStyle('name')}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="email">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="jane@company.com"
            style={fieldStyle('email')}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />
        </div>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle} htmlFor="company">Company <span style={{ color: '#aeaeb2', fontWeight: 400 }}>(optional)</span></label>
        <input
          id="company"
          name="company"
          type="text"
          placeholder="Acme Inc."
          style={fieldStyle('company')}
          onFocus={() => setFocused('company')}
          onBlur={() => setFocused(null)}
        />
      </div>

      <div style={{ marginBottom: '26px' }}>
        <label style={labelStyle} htmlFor="message">Message *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder="Tell me a bit about the role or what you'd like to build..."
          style={{ ...fieldStyle('message'), resize: 'vertical', fontFamily: 'var(--font-text)', lineHeight: 1.5 }}
          onFocus={() => setFocused('message')}
          onBlur={() => setFocused(null)}
        />
      </div>

      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              fontSize: '14px',
              color: '#cc3333',
              background: 'rgba(204,51,51,0.08)',
              border: '1px solid rgba(204,51,51,0.2)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '18px',
            }}
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={status === 'sending'}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '15px 28px',
          borderRadius: '9999px',
          background: status === 'sending' ? '#7aa6d4' : '#0066cc',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 600,
          border: 'none',
          cursor: status === 'sending' ? 'default' : 'pointer',
        }}
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </motion.button>

      <p style={{ fontSize: '12px', color: '#aeaeb2', textAlign: 'center', marginTop: '16px' }}>
        Your message goes straight to my inbox — I reply within a day or two.
      </p>
    </form>
  )
}
