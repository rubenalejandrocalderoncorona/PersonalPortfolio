import type { Metadata } from 'next'
import BackButton from '@/components/BackButton'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Get in Touch — Rubén Calderón',
  description: 'Send Rubén Calderón a message about senior AI cloud and platform roles.',
}

export default function ContactPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: 'var(--font-text)',
        color: '#1d1d1f',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Back navigation */}
      <div style={{ padding: '32px 48px 0', maxWidth: '760px', margin: '0 auto' }}>
        <BackButton />
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 48px 120px' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#0066cc',
            marginBottom: '14px',
            textAlign: 'center',
          }}
        >
          Contact
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 44px)',
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            color: '#1d1d1f',
            margin: '0 0 16px',
            textAlign: 'center',
          }}
        >
          Let&apos;s build something reliable.
        </h1>
        <p
          style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: '#6e6e73',
            margin: '0 0 44px',
            textAlign: 'center',
          }}
        >
          Open to senior AI cloud and platform roles. Send a message and I&apos;ll reply directly to your email.
        </p>

        <ContactForm />
      </div>
    </div>
  )
}
