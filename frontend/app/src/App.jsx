import AmbientBackground from './components/layout/AmbientBackground';
import ScrollRail from './components/layout/ScrollRail';
import CustomCursor from './components/layout/CustomCursor';
import Hero from './components/sections/Hero';
import Services from './components/sections/Services';
import FoundersCarousel from './components/sections/founders/FoundersCarousel';
import ProjectsGrid from './components/sections/projects/ProjectsGrid';
import Contact from './components/sections/Contact';

export default function App() {
  return (
    <>
      <AmbientBackground />
      <ScrollRail />
      <CustomCursor />
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
