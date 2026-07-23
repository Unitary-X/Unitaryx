import RequestCard from './RequestCard';

export default function RequestGrid({ requests, isEmpty, onOpen }) {
  if (isEmpty) {
    return (
      <div className="req-empty glass">
        <p className="req-empty-title">No project requests yet</p>
        <p className="req-empty-note">
          Once you submit a request it will appear here with live status updates.
        </p>
        <a className="dash-btn dash-btn--primary" href="/#contact">
          Submit your first request
        </a>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="req-empty glass">
        <p className="req-empty-title">No requests match your filters</p>
        <p className="req-empty-note">Try clearing the search or status filter.</p>
      </div>
    );
  }

  return (
    <div className="req-grid">
      {requests.map((r, i) => (
        <RequestCard key={r.id} request={r} index={i} onOpen={onOpen} />
      ))}
    </div>
  );
}
