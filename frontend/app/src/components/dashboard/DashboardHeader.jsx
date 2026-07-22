export default function DashboardHeader({ firstName }) {
  const initial = (firstName || 'U').charAt(0).toUpperCase();
  return (
    <header className="dash-header glass">
      <div className="dash-greeting">
        <span className="dash-avatar" aria-hidden="true">
          {initial}
        </span>
        <div>
          <h1>Welcome back{firstName ? `, ${firstName}` : ''}</h1>
          <p>Your project requests and their current status.</p>
        </div>
      </div>
      <div className="dash-header-actions">
        <a className="dash-btn" href="/">
          Website
        </a>
        <a className="dash-btn dash-btn--primary" href="/#contact">
          New request
        </a>
        <a className="dash-btn dash-btn--muted" href="/logout">
          Log out
        </a>
      </div>
    </header>
  );
}
