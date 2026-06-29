import Navigation from '@/components/Navigation'

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main style={{ marginLeft: '80px' }}>{children}</main>
    </>
  )
}
