export default function RequestToolbar({ filters, setFilters, resultCount, onReset, onExport }) {
  const update = (patch) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="dash-toolbar">
      <input
        className="dash-input"
        type="search"
        placeholder="Search by id, service, message…"
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        aria-label="Search requests"
      />
      <select
        className="dash-select"
        value={filters.status}
        onChange={(e) => update({ status: e.target.value })}
        aria-label="Filter by status"
      >
        <option value="all">All status</option>
        <option value="new">New</option>
        <option value="in progress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <select
        className="dash-select"
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value })}
        aria-label="Sort requests"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="highvalue">Highest value</option>
        <option value="priority">Highest priority</option>
      </select>
      <label className="dash-toggle">
        <input
          type="checkbox"
          checked={filters.updatedOnly}
          onChange={(e) => update({ updatedOnly: e.target.checked })}
        />
        Updated only
      </label>
      <button type="button" className="dash-chip" onClick={onReset}>
        Clear
      </button>
      <button type="button" className="dash-chip" onClick={onExport}>
        Export CSV
      </button>
      <span className="dash-result-count">{resultCount} result{resultCount === 1 ? '' : 's'}</span>
    </div>
  );
}
