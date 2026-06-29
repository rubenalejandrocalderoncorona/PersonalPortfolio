'use client'

import { useRouter } from 'next/navigation'

export default function BackButton({ label = 'Back to portfolio' }: { label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        border: 'none',
        color: '#0066cc',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'var(--font-text)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  )
}
