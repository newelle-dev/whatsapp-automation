import { CheckCircle, Smartphone, Loader2 } from 'lucide-react';

const AuthProgressSection = ({ authStatus, qrCode, progress, logs }) => {
  return (
    <div className="fade-in">
      {authStatus === 'ready' ? (
        <div className="qr-container" style={{ textAlign: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '2rem', borderRadius: '50%', marginBottom: '1.25rem', display: 'inline-flex', boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle size={64} color="var(--success)" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>WhatsApp Connected Successfully!</h3>
          <p className="subtitle" style={{ marginBottom: 0, marginTop: '0.25rem' }}>Your active session is running and messages are ready to dispatch.</p>
        </div>
      ) : qrCode ? (
        <div className="qr-container">
          <div className="qr-code-wrapper">
            <div className="qr-code-scanner-line"></div>
            <img src={qrCode} alt="WhatsApp QR Code" width="256" height="256" style={{ filter: 'contrast(1.1)' }} />
          </div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <Smartphone style={{ color: 'var(--accent-color)' }} /> Link WhatsApp Client
          </h3>
          <p className="subtitle" style={{ textAlign: 'center', maxWidth: '440px', marginTop: '0.5rem', marginBottom: 0 }}>
            Open WhatsApp on your phone → Settings / Menu → Linked Devices → Link a Device, then focus your phone camera on this QR code.
          </p>
        </div>
      ) : (
        <div className="qr-container" style={{ padding: '4rem 2rem' }}>
          <Loader2 size={42} className="animate-spin" style={{ color: 'var(--accent-color)', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }} />
          <h3 style={{ fontWeight: 600 }}>Initializing WhatsApp Client...</h3>
          <p className="subtitle" style={{ marginBottom: 0, marginTop: '0.25rem' }}>Preparing local Chromium headless process. This may take up to 20 seconds.</p>
        </div>
      )}

      {authStatus === 'ready' && progress.total > 0 && (
        <div className="progress-section-container">
          <div className="progress-header">
            <span>Sending Dispatch Progress</span>
            <span style={{ color: 'var(--accent-color)' }}>
              {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
            </span>
          </div>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
          <p className="subtitle" style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: 0, marginTop: '0.5rem' }}>
            Please keep this tab and backend terminal running until the execution reaches completion.
          </p>
        </div>
      )}

      {/* MacOS terminal styled logs */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot close"></span>
            <span className="terminal-dot minimize"></span>
            <span className="terminal-dot zoom"></span>
          </div>
          <div className="terminal-title">whatsapp-client-logs.sh</div>
          <div style={{ width: '40px' }}></div> {/* spacer */}
        </div>
        <div className="logs-container">
          {logs.map((log, i) => (
            <div key={i} className="log-entry">
              <span className="log-time">[{log.time}]</span>
              <span className="log-msg" style={{
                color: log.msg.toLowerCase().includes('failed') || log.msg.toLowerCase().includes('error') ? 'var(--error)' :
                       log.msg.toLowerCase().includes('sent') || log.msg.toLowerCase().includes('success') ? 'var(--success)' : 'inherit'
              }}>
                {log.msg}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'monospace' }}>
              Waiting for client execution logs to stream...
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthProgressSection;
