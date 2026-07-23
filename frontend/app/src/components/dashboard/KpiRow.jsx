import { formatValue } from './dashboardUtils';

export default function KpiRow({ kpis }) {
  return (
    <section className="kpi-row">
      <article className="kpi-card glass">
        <p className="kpi-label">Completion</p>
        <p className="kpi-value">{kpis.completion}%</p>
        <div className="kpi-progress" role="progressbar" aria-valuenow={kpis.completion} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${kpis.completion}%` }} />
        </div>
      </article>
      <article className="kpi-card glass">
        <p className="kpi-label">Total Project Value</p>
        <p className="kpi-value">{formatValue(kpis.totalValue)}</p>
        <p className="kpi-sub">Across all your requests</p>
      </article>
      <article className="kpi-card glass">
        <p className="kpi-label">Average Value</p>
        <p className="kpi-value">{formatValue(kpis.avgValue)}</p>
        <p className="kpi-sub">Mean request value</p>
      </article>
      <article className="kpi-card glass">
        <p className="kpi-label">Live Updates</p>
        <p className="kpi-value">{kpis.updates}</p>
        <p className="kpi-sub">Recently updated requests</p>
      </article>
    </section>
  );
}
