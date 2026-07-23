import { formatId, formatDate, priorityScore } from './dashboardUtils';

// Client-side CSV of the currently filtered/sorted request list.
// Columns mirror the previous dashboard export.
export function exportRequestsToCsv(requests) {
  const header = ['Request ID', 'Service', 'Status', 'Priority', 'Priority Score', 'Value', 'Date', 'Updated'];
  const rows = [header];

  requests.forEach((r) => {
    rows.push([
      formatId(r.id),
      r.service,
      r.status,
      r.priority,
      priorityScore(r.priority),
      r.value || 0,
      formatDate(r.created_at),
      r.is_updated ? 'Yes' : 'No',
    ]);
  });

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'unitaryx_requests.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
