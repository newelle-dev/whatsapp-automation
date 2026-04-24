import { Play, Copy, AlertCircle } from 'lucide-react';

const PreviewSection = ({ queues, onStartSending }) => {
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
          <p className="subtitle">Generated messages ready for review. Click 'Start Sending' to broadcast via WhatsApp.</p>
        </div>
        <button 
          className="btn" 
          onClick={onStartSending}
          disabled={queues.sendingQueue.length === 0}
        >
          Start Sending <Play size={18} />
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        {queues.sendingQueue.map((q, i) => (
          <div key={i} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>
                <a 
                  href={`https://web.whatsapp.com/send/?phone=${q.phone.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'inherit', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  title="Open in WhatsApp"
                >
                  {q.name}
                </a>{' '}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'normal' }}>({q.phone})</span>
              </h3>
              <button 
                className="btn" 
                onClick={() => handleCopy(q.message, i)}
                id={`btn-copy-${i}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Copy size={14} /> Copy Message
              </button>
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
