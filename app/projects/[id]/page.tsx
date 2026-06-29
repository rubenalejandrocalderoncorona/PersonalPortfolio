import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { projects } from '@/lib/data'
import { projectDetails } from '@/lib/projectDetails'
import ProjectImageViewer from '@/components/ProjectImageViewer'
import BackButton from '@/components/BackButton'

type Props = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = projects.find((p) => p.id === id)
  return { title: project ? `${project.title} — Rubén Calderón` : 'Project' }
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const project = projects.find((p) => p.id === id)
  const detail  = projectDetails[id]

  if (!project) notFound()

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
      {/* ── Back navigation (restores exact scroll position) ── */}
      <div style={{ padding: '32px 48px 0', maxWidth: '1180px', margin: '0 auto' }}>
        <BackButton />
      </div>

      {/* ── Hero image with expand / lightbox ── */}
      <div style={{ maxWidth: '1180px', margin: '28px auto 0', padding: '0 48px' }}>
        <ProjectImageViewer
          src={project.image ?? null}
          alt={project.title}
          gradient={project.gradient ?? null}
        />
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: '820px', margin: '56px auto 96px', padding: '0 48px' }}>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4.5vw, 42px)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            color: '#1d1d1f',
            margin: '0 0 20px',
          }}
        >
          {project.title}
        </h1>

        {/* Primary tech badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '40px' }}>
          {project.tech.map((t) => (
            <span
              key={t}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#0066cc',
                background: 'rgba(0,102,204,0.08)',
                border: '1px solid rgba(0,102,204,0.22)',
                borderRadius: '9999px',
                padding: '6px 14px',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '0 0 40px' }} />

        {/* Full description */}
        {detail?.fullDesc.map((para, i) => (
          <p
            key={i}
            style={{
              fontSize: '17px',
              lineHeight: 1.75,
              color: i === 0 ? '#1d1d1f' : '#48484a',
              margin: '0 0 22px',
            }}
          >
            {para}
          </p>
        ))}

        {/* All skills */}
        {detail?.skills && detail.skills.length > 0 && (
          <div style={{ marginTop: '52px' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#0066cc',
                marginBottom: '20px',
              }}
            >
              Complete skills &amp; tools used
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {detail.skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: '#1d1d1f',
                    background: '#f5f5f7',
                    border: '1px solid #e8e8ea',
                    borderRadius: '9999px',
                    padding: '7px 14px',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div
          style={{
            marginTop: '56px',
            paddingTop: '32px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 26px',
              borderRadius: '9999px',
              background: '#1d1d1f',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.46.1 2.72.64.71 1.03 1.62 1.03 2.74 0 3.92-2.34 4.78-4.57 5.04.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
            </svg>
            View on GitHub
          </a>
          <BackButton label="← Back to all projects" />
        </div>
      </div>
    </div>
  )
}
