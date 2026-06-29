import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import PlatformsStrip from '@/components/PlatformsStrip'
import CompetenciesSection from '@/components/CompetenciesSection'
import ExperienceSection from '@/components/ExperienceSection'
import ProjectsSection from '@/components/ProjectsSection'
import CertificationsSection from '@/components/CertificationsSection'
import SkillsSection from '@/components/SkillsSection'
import ContactSection from '@/components/ContactSection'

export default function Page() {
  return (
    <>
      <Navigation />
      <main style={{ marginLeft: '80px' }}>
        <HeroSection />
        <PlatformsStrip />
        <CompetenciesSection />
        <ExperienceSection />
        <ProjectsSection />
        <CertificationsSection />
        <SkillsSection />
        <ContactSection />
      </main>
    </>
  )
}
