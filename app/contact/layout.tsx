import Navigation from '@/components/Navigation'

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main style={{ marginLeft: '80px' }}>{children}</main>
    </>
  )
}
