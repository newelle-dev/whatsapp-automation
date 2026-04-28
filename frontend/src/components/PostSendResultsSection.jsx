import { useMemo } from 'react';
import { CheckCircle2, Clock3, Copy, Download, RefreshCcw, XCircle } from 'lucide-react';

const statusConfig = {
  sent: {
    label: 'Sent',
    icon: CheckCircle2,
    color: 'var(--success)',
    background: 'rgba(16, 185, 129, 0.12)'
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: '#f87171',
    background: 'rgba(248, 113, 113, 0.12)'
  }
};

const buildCsv = (results) => {
  const headers = ['name', 'phone', 'status', 'error', 'timestamp', 'message'];
  const rows = results.map((result) => headers.map((header) => JSON.stringify(result[header] || '')).join(','));

  return [headers.join(','), ...rows].join('\n');
};

const PostSendResultsSection = ({
  results,
  summary,
  progress,
  onRetryFailed,
  onResetView
}) => {
  const sortedResults = useMemo(
    () => [...results].sort((left, right) => left.timestamp.localeCompare(right.timestamp)),
    [results]
  );

  const handleExport = () => {
    const csv = buildCsv(sortedResults);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whatsapp-send-results-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPhone = async (phone) => {
    await navigator.clipboard.writeText(phone);
  };

  return (
    <div className="fade-in results-section">
      <div className="results-header">
        <div>
          <h2>Send Results</h2>
          <p className="subtitle">A batch summary with per-recipient status and quick actions for follow-up.</p>
        </div>
        <div className="results-actions">
          <button className="btn btn-secondary" onClick={handleExport} disabled={sortedResults.length === 0}>
            Export CSV <Download size={16} />
          </button>
          <button className="btn btn-secondary" onClick={onRetryFailed} disabled={summary.failed === 0}>
            Retry Failed <RefreshCcw size={16} />
          </button>
          <button className="btn btn-secondary" onClick={onResetView}>
            Review Queue <Clock3 size={16} />
          </button>
        </div>
      </div>

      <div className="results-summary-grid">
        {[
          { label: 'Total', value: summary.total },
          { label: 'Sent', value: summary.sent, color: 'var(--success)' },
          { label: 'Failed', value: summary.failed, color: '#f87171' },
          { label: 'Progress', value: progress.total ? `${progress.current}/${progress.total}` : '0/0' }
        ].map((item) => (
          <div key={item.label} className="result-card">
            <div className="label">{item.label}</div>
            <div className="value" style={{ color: item.color || 'var(--text-primary)' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th>Recipient</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => {
              const config = statusConfig[result.status] || statusConfig.sent;
              const StatusIcon = config.icon;

              return (
                <tr key={`${result.phone}-${result.timestamp}-${index}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 600 }}>{result.name}</div>
                    {result.message && (
                      <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>Show message</summary>
                        <pre className="message-pre">{result.message}</pre>
                      </details>
                    )}
                    {result.error && <div style={{ marginTop: '0.5rem', color: '#fca5a5', fontSize: '0.9rem' }}>{result.error}</div>}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>{result.phone}</td>
                  <td style={{ verticalAlign: 'top' }}>
                    <span className="status-badge" style={{ background: config.background, color: config.color }}>
                      <StatusIcon size={14} /> {config.label}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'top', color: 'var(--text-muted)' }}>
                    {result.timestamp ? new Date(result.timestamp).toLocaleString() : '-'}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <div className="result-row-actions">
                      <button className="btn btn-secondary" onClick={() => handleCopyPhone(result.phone)}>
                        <Copy size={14} /> Copy
                      </button>
                      <a
                        className="btn btn-secondary"
                        style={{ textDecoration: 'none' }}
                        href={`https://web.whatsapp.com/send/?phone=${String(result.phone).replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Chat
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedResults.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No send results available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PostSendResultsSection;