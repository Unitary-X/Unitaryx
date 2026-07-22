const ACTIONS = [
  { label: 'Browse services', href: '/#services' },
  { label: 'See portfolio', href: '/#projects' },
  { label: 'Submit a request', href: '/#contact' },
  { label: 'Back to site', href: '/' },
];

export default function QuickActions() {
  return (
    <section className="dash-card glass">
      <h2 className="dash-card-title">Quick actions</h2>
      <div className="quick-grid">
        {ACTIONS.map((a) => (
          <a key={a.label} className="quick-card" href={a.href}>
            {a.label}
          </a>
        ))}
      </div>
    </section>
  );
}
