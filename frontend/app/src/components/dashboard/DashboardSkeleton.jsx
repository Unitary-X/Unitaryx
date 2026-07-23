import SkeletonCard from '../common/SkeletonCard';

export default function DashboardSkeleton() {
  return (
    <div className="dash-shell" aria-busy="true" aria-label="Loading dashboard">
      <SkeletonCard className="dash-skel-header" />
      <div className="kpi-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="dash-skel-kpi" />
        ))}
      </div>
      <div className="dash-two-col">
        <SkeletonCard className="dash-skel-block" />
        <SkeletonCard className="dash-skel-block" />
      </div>
      <div className="req-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="dash-skel-req" />
        ))}
      </div>
    </div>
  );
}
