import { Play, Copy, Trash2, Edit3 } from 'lucide-react';
import { isValidHttpUrl } from '../config/outlets';

const PreviewSection = ({
  queues,
  selectedOutlet,
  sendDisabledReason,
  canStartSending,
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
      btn.innerText = 'Copied!';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Preview Messages</h2>
          <p className="subtitle">Generated messages ready for review. Edit a name, remove a recipient, and confirm the selected outlet before you start sending.</p>
        </div>
        <button 
          className="btn" 
          onClick={onStartSending}
          disabled={!canStartSending}
          title={sendDisabledReason || ''}
        >
          Start Sending ({activeCount}) <Play size={18} />
        </button>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        alignItems: 'flex-start',
        marginTop: '1rem',
        padding: '1rem',
        borderRadius: '14px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(0,0,0,0.16)'
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Selected outlet</p>
          <h3 style={{ margin: '0.35rem 0 0.35rem' }}>{selectedOutletLabel}</h3>
          <p style={{ margin: '0 0 0.75rem', color: outletHasValidMapLink ? 'var(--text-muted)' : '#fca5a5' }}>
            {outletHasValidMapLink
              ? <a href={selectedOutletMapLink} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Open map link</a>
              : 'Map link missing for this outlet.'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ padding: '0.35rem 0.65rem', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', fontSize: '0.85rem', border: '1px solid var(--glass-border)' }}>
              Active recipients: {activeCount}
            </span>
            <span style={{ padding: '0.35rem 0.65rem', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', fontSize: '0.85rem', border: '1px solid var(--glass-border)' }}>
              Removed from send: {excludedCount}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: '12rem' }}>
          <p style={{ margin: 0, color: sendDisabledReason ? '#fca5a5' : 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
            {sendDisabledReason ? 'Send blocked' : 'Ready to send'}
          </p>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {sendDisabledReason || 'Selected outlet and rendered messages passed preflight.'}
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        {queues.sendingQueue.map((q, i) => (
          <div
            key={q.previewKey || i}
            style={{
              background: 'var(--bg-secondary)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              opacity: q.isExcluded ? 0.6 : 1,
              position: 'relative'
            }}
          >
            {q.isExcluded && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Trash2 size={14} /> Removed from send
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ flex: 1, paddingRight: '1rem' }}>
                <h3 style={{ margin: '0 0 0.75rem 0' }}>
                  <a 
                    href={`https://web.whatsapp.com/send/?phone=${q.phone.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    title="Open in WhatsApp"
                  >
                    {q.displayName || q.name}
                  </a>{' '}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'normal' }}>({q.phone})</span>
                </h3>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '28rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Edit3 size={14} /> Recipient name for this send
                  </span>
                  <input
                    type="text"
                    value={q.displayName || ''}
                    onChange={(event) => onEditRecipientName?.(q.previewKey, event.target.value)}
                    disabled={q.isExcluded}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(0,0,0,0.15)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Edit recipient name"
                  />
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
                <button 
                  className="btn" 
                  onClick={() => handleCopy(q.message, i)}
                  id={`btn-copy-${i}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Copy size={14} /> Copy Message
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onToggleRecipientExclusion?.(q.previewKey)}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: q.isExcluded ? '#374151' : '#7c2d12' }}
                >
                  <Trash2 size={14} /> {q.isExcluded ? 'Undo Remove' : 'Remove from Send'}
                </button>
              </div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px', margin: 0, border: '1px solid var(--glass-border)' }}>{q.message}</pre>
          </div>
        ))}
        {queues.sendingQueue.length === 0 && <p>No valid scripts to preview.</p>}
      </div>

    </div>
  );
};

export default PreviewSection;
