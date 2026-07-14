import { useMemo } from 'react';
import { CheckCircle2, Clock3, Copy, Download, RefreshCcw, XCircle, ChevronDown, MessageSquare } from 'lucide-react';

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
    color: 'var(--error)',
    background: 'rgba(244, 63, 94, 0.12)'
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
        <div className="header-title-area">
          <h2>Send Campaign Results</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>Review final dispatch statuses, export execution logs, and run target retries.</p>
        </div>
        <div className="results-actions">
          <button className="btn btn-secondary" onClick={handleExport} disabled={sortedResults.length === 0}>
            Export CSV <Download size={16} />
          </button>
          <button className="btn" onClick={onRetryFailed} disabled={summary.failed === 0} style={{ background: 'var(--accent-color)' }}>
            Retry Failed <RefreshCcw size={16} />
          </button>
          <button className="btn btn-ghost" onClick={onResetView}>
            Review Queue <Clock3 size={16} />
          </button>
        </div>
      </div>

      <div className="results-summary-grid">
        {[
          { label: 'Total Recipients', value: summary.total, cssClass: 'card-total', color: 'var(--text-main)' },
          { label: 'Successfully Sent', value: summary.sent, cssClass: 'card-sent', color: 'var(--success)' },
          { label: 'Failed Deliveries', value: summary.failed, cssClass: 'card-failed', color: 'var(--error)' },
          { label: 'Campaign Progress', value: progress.total ? `${progress.current}/${progress.total}` : '0/0', cssClass: 'card-progress', color: 'var(--warning)' }
        ].map((item) => (
          <div key={item.label} className={`result-card ${item.cssClass}`}>
            <div className="label">{item.label}</div>
            <div className="value" style={{ color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th>Recipient Name</th>
              <th>Phone Number</th>
              <th>Dispatch Status</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => {
              const config = statusConfig[result.status] || statusConfig.sent;
              const StatusIcon = config.icon;

              return (
                <tr key={`${result.phone}-${result.timestamp}-${index}`}>
                  <td style={{ verticalAlign: 'top', paddingRight: '1rem' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {result.name}
                    </div>
                    {result.message && (
                      <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ cursor: 'pointer', color: '#818cf8', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', userSelect: 'none' }}>
                          <MessageSquare size={12} /> Show message draft <ChevronDown size={10} />
                        </summary>
                        <div className="whatsapp-bubble-panel" style={{ background: 'transparent', border: 'none', padding: '0.5rem 0 0 0', boxShadow: 'none' }}>
                          <div className="whatsapp-bubble-body sent-bubble" style={{ fontSize: '0.85rem', padding: '0.75rem 1rem' }}>
                            {result.message}
                          </div>
                        </div>
                      </details>
                    )}
                    {result.error && (
                      <div style={{ marginTop: '0.4rem', color: 'var(--error)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        ⚠️ {result.error}
                      </div>
                    )}
                  </td>
                  <td style={{ verticalAlign: 'top', color: 'var(--text-main)', fontWeight: 500 }}>{result.phone}</td>
                  <td style={{ verticalAlign: 'top' }}>
                    <span className="status-badge" style={{ background: config.background, color: config.color }}>
                      <StatusIcon size={12} /> {config.label}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'top', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {result.timestamp ? new Date(result.timestamp).toLocaleString() : '-'}
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                    <div className="result-row-actions" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" onClick={() => handleCopyPhone(result.phone)}>
                        Copy
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
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No send results available yet. Complete the campaign dispatch.
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