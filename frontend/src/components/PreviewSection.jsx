import { Play, Copy, Trash2, Edit3, MapPin, ExternalLink, AlertTriangle, AlertCircle, CheckCircle2, UserCheck, UserMinus } from 'lucide-react';
import { isValidHttpUrl, OUTLET_OPTIONS } from '../config/outlets';

const PreviewSection = ({
  queues,
  selectedOutlet,
  selectedOutletKey,
  setSelectedOutletKey,
  sendDisabledReason,
  canStartSending,
  templateWarnings,
  onStartSending,
  onEditRecipientName,
  onToggleRecipientExclusion
}) => {
  const activeCount = queues.sendingQueue.filter((item) => !item.isExcluded).length;
  const excludedCount = queues.sendingQueue.length - activeCount;
  const selectedOutletLabel = selectedOutlet?.name || 'No outlet selected';
  const selectedOutletMapLink = selectedOutlet?.mapLink || '';
  const outletHasValidMapLink = isValidHttpUrl(selectedOutletMapLink);

  const handleCopy = (message, index) => {
    navigator.clipboard.writeText(message);
    const btn = document.getElementById(`btn-copy-${index}`);
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Copied!';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fade-in">
      <div className="app-header" style={{ borderBottom: 'none', marginBottom: '1rem', paddingBottom: 0 }}>
        <div className="header-title-area">
          <h2>Review Messages</h2>
          <p className="subtitle">Preview rendered appointment reminders and personalize client details before sending.</p>
        </div>
        <button 
          className="btn" 
          onClick={onStartSending}
          disabled={!canStartSending}
          title={sendDisabledReason || ''}
          style={{ background: 'var(--whatsapp-color)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
        >
          Start Sending ({activeCount}) <Play size={18} />
        </button>
      </div>

      {/* Location Selection Card */}
      <div className="settings-card" style={{ marginBottom: '1.5rem' }}>
        <label className="custom-select-label">
          <span className="template-editor-label">Select Outlet Location</span>
          <div className="select-wrapper">
            <select
              value={selectedOutletKey}
              onChange={(event) => setSelectedOutletKey?.(event.target.value)}
            >
              {OUTLET_OPTIONS.map((outlet) => {
                const outletReady = isValidHttpUrl(outlet.mapLink);
                return (
                  <option key={outlet.key} value={outlet.key}>
                    {outlet.name}{outletReady ? '' : ' (map link missing)'}
                  </option>
                );
              })}
            </select>
          </div>
        </label>

        {/* Outlet Validation Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          {outletHasValidMapLink ? (
            <div className="badge success">
              <CheckCircle2 size={14} /> Map Link Validated
            </div>
          ) : (
            <div className="badge error">
              <AlertCircle size={14} /> Map Link Missing
            </div>
          )}
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {outletHasValidMapLink
              ? `Messages will send with location "${selectedOutletLabel}" and its map link.`
              : `Location "${selectedOutletLabel}" has an invalid/missing map link. Sending will be blocked.`}
          </span>
        </div>
      </div>

      <div className="preview-layout">
        {/* Sidebar Summary Card */}
        <div className="sidebar-summary-card">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <MapPin size={16} /> Selected Outlet
            </h3>
            <h3 style={{ marginTop: '0.5rem', fontWeight: 700 }}>{selectedOutletLabel}</h3>
            <p style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
              {outletHasValidMapLink ? (
                <a 
                  href={selectedOutletMapLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: '#818cf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
                >
                  View on Google Maps <ExternalLink size={12} />
                </a>
              ) : (
                <span style={{ color: 'var(--error)' }}>Map link missing for this outlet.</span>
              )}
            </p>
          </div>

          <div className="meta-stats-row">
            <div className="meta-stat-item">
              <span className="label">Active Queue</span>
              <span className="value">{activeCount} clients</span>
            </div>
            <div className="meta-stat-item">
              <span className="label">Removed</span>
              <span className="value">{excludedCount} clients</span>
            </div>
            <div className="meta-stat-item">
              <span className="label">Total Loaded</span>
              <span className="value">{queues.sendingQueue.length} clients</span>
            </div>
          </div>

          <div>
            <div className={`summary-header-badge ${canStartSending ? 'ready' : 'blocked'}`}>
              {canStartSending ? 'Ready to Dispatch' : 'Configuration Warning'}
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {sendDisabledReason ? (
                <span style={{ color: 'var(--error)' }}>{sendDisabledReason}</span>
              ) : (
                'All checks passed. Messages are formatted correctly and locations are verified.'
              )}
            </p>
          </div>
        </div>

        {/* Messaging Preview Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Warnings Banner */}
          {templateWarnings && templateWarnings.length > 0 && (
            <div className="alert-banner">
              <div className="alert-banner-title">
                <AlertTriangle size={18} /> Template Warnings Detected
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6', fontSize: '0.85rem' }}>
                {templateWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* List of bubbles */}
          <div className="whatsapp-chat-container">
            {queues.sendingQueue.map((q, i) => (
              <div
                key={q.previewKey || i}
                className={`whatsapp-bubble-panel ${q.isExcluded ? 'excluded' : ''}`}
              >
                <div className="whatsapp-bubble-header">
                  <div className="whatsapp-bubble-client-info" style={{ flex: 1 }}>
                    <div className="whatsapp-client-avatar">
                      {getInitials(q.displayName || q.name)}
                    </div>
                    <div className="whatsapp-client-details" style={{ flex: 1 }}>
                      <h4>
                        <a 
                          href={`https://web.whatsapp.com/send/?phone=${q.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="Open chat window in WhatsApp Web"
                        >
                          {q.displayName || q.name}
                        </a>
                      </h4>
                      <div className="phone-sub">{q.phone}</div>

                      {!q.isExcluded && (
                        <label style={{ display: 'block', marginTop: '0.4rem' }}>
                          <input
                            type="text"
                            value={q.displayName || ''}
                            onChange={(event) => onEditRecipientName?.(q.previewKey, event.target.value)}
                            className="whatsapp-edit-input"
                            placeholder="Edit recipient name (overrides name)"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="result-row-actions">
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleCopy(q.message, i)}
                      id={`btn-copy-${i}`}
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      disabled={q.isExcluded}
                    >
                      <Copy size={14} /> Copy
                    </button>
                    <button
                      className="btn"
                      onClick={() => onToggleRecipientExclusion?.(q.previewKey)}
                      style={{ 
                        padding: '0.5rem 0.85rem', 
                        fontSize: '0.85rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.35rem',
                        background: q.isExcluded ? 'var(--accent-color)' : 'rgba(244, 63, 94, 0.15)',
                        color: q.isExcluded ? 'white' : '#fca5a5',
                        border: q.isExcluded ? 'none' : '1px solid rgba(244, 63, 94, 0.25)',
                        boxShadow: 'none'
                      }}
                    >
                      {q.isExcluded ? (
                        <>
                          <UserCheck size={14} /> Restore
                        </>
                      ) : (
                        <>
                          <UserMinus size={14} /> Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className={`whatsapp-bubble-body ${q.isExcluded ? '' : 'sent-bubble'}`}>
                  {q.message}
                </div>
              </div>
            ))}

            {queues.sendingQueue.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                <AlertCircle size={36} style={{ marginBottom: '1rem', color: 'var(--accent-color)' }} />
                <p>No valid recipients to preview. Try uploading a different appointments export file.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewSection;
