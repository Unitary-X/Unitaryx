import './FounderCard.css';

export default function FounderCard({ founder, style, isActive }) {
  return (
    <div className="founder-card" style={style} aria-hidden={!isActive}>
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
      </div>
    </div>
  );
}
