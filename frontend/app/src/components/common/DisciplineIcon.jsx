const PATHS = {
  web: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.6 2.3 4 5.3 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.3-4-8.5s1.4-6.2 4-8.5Z" />
    </>
  ),
  software: (
    <>
      <path d="M8.5 8 4 12l4.5 4" />
      <path d="M15.5 8 20 12l-4.5 4" />
      <path d="M13.25 6.5 10.75 17.5" />
    </>
  ),
  hardware: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M7 4v3M12 4v3M17 4v3M7 17v3M12 17v3M17 17v3M4 7h3M4 12h3M4 17h3M17 7h3M17 12h3M17 17h3" />
    </>
  ),
};

export default function DisciplineIcon({ type, className = '' }) {
  const paths = PATHS[type];
  if (!paths) return null;
  return (
    <svg
      className={`discipline-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
