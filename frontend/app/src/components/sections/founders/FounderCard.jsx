import './FounderCard.css';

export default function FounderCard({ founder, isActive }) {
  const socials = founder.socials || {};
  const socialEntries = Object.entries(socials).filter(([, url]) => url);

  return (
    <div className={`founder-card ${isActive ? 'is-active' : ''}`} aria-hidden={!isActive}>
      {founder.photo_url ? (
        <img src={founder.photo_url} alt={`${founder.name}, ${founder.role}`} loading="lazy" />
      ) : (
        <div className="founder-card-placeholder" aria-hidden="true">
          {founder.name
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')}
        </div>
      )}
      <div className="founder-card-overlay">
        <p className="founder-name">{founder.name}</p>
        <p className="founder-role">{founder.role}</p>
        {isActive && founder.bio && <p className="founder-bio">{founder.bio}</p>}
        {isActive && socialEntries.length > 0 && (
          <div className="founder-socials">
            {socialEntries.map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
