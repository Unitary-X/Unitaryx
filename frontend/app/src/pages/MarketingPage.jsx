import ScrollRail from '../components/layout/ScrollRail';
import Hero from '../components/sections/Hero';
import Services from '../components/sections/Services';
import FoundersCarousel from '../components/sections/founders/FoundersCarousel';
import ProjectsGrid from '../components/sections/projects/ProjectsGrid';
import Contact from '../components/sections/Contact';

export default function MarketingPage() {
  return (
    <>
      <ScrollRail />
      <main>
        <Hero />
        <Services />
        <FoundersCarousel />
        <ProjectsGrid />
        <Contact />
      </main>
    </>
  );
}
