import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Rubén Calderón — MLOps & Applied AI Engineer',
  description:
    'MLOps & Applied AI Engineer specializing in enterprise AI execution, agentic workflows, and production-grade ML infrastructure across OCI, GCP, and Azure.',
  keywords: ['AI Cloud Engineer', 'MLOps', 'OCI', 'GCP', 'Kubernetes', 'Terraform', 'LangGraph'],
  icons: {
    icon: [{ url: '/RCLogo3.png', type: 'image/png' }],
    apple: '/RCLogo3.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
