import NavBar from '../components/layout/NavBar';
import Footer from '../components/layout/Footer';
import MagneticButton from '../components/common/MagneticButton';
import { usePageMeta } from '../hooks/usePageMeta';
import './NotFound.css';

export default function NotFound() {
  usePageMeta('Page not found — Unitary X', { noindex: true });

  return (
    <>
      <NavBar />
      <main className="not-found-shell">
        <div className="not-found-inner glass">
          <span className="eyebrow">404</span>
          <h1>This page doesn&apos;t exist.</h1>
          <p>
            The link you followed may be broken, or the page may have moved. Head back to the
            homepage to find what you're looking for.
          </p>
          <MagneticButton as="a" href="/">
            Back to homepage
          </MagneticButton>
        </div>
      </main>
      <Footer />
    </>
  );
}
