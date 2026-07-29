import { useEffect } from 'react';

const DEFAULT_TITLE = 'Unitary X — Web, Software & Embedded Hardware Studio';

// Keeps <title> and a noindex robots meta in sync with the active SPA route.
// robots.txt already disallows /dashboard and /admin, but that only stops
// crawling — a noindex tag is what actually keeps an already-linked or
// bookmarked private page out of search results.
export function usePageMeta(title = DEFAULT_TITLE, { noindex = false } = {}) {
  useEffect(() => {
    document.title = title;

    let meta = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'robots';
        document.head.appendChild(meta);
      }
      meta.content = 'noindex, nofollow';
    }

    return () => {
      document.title = DEFAULT_TITLE;
      if (noindex && meta) meta.remove();
    };
  }, [title, noindex]);
}
