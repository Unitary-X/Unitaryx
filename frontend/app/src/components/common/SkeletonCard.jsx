import './SkeletonCard.css';

export default function SkeletonCard({ className = '' }) {
  return <div className={`skeleton-card ${className}`} aria-hidden="true" />;
}
