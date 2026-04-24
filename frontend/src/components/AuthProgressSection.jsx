import { CheckCircle, Smartphone } from 'lucide-react';

const AuthProgressSection = ({ authStatus, qrCode, progress, logs }) => {
  return (
    <div className="fade-in">
      {authStatus === 'ready' ? (
        <div className="qr-container" style={{ textAlign: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '2rem', borderRadius: '50%', marginBottom: '1rem', display: 'inline-flex' }}>
            <CheckCircle size={64} color="var(--success)" />
          </div>
          <h3>WhatsApp Connected Successfully!</h3>
          <p className="subtitle">Your session is active and messages are being sent.</p>
        </div>
      ) : qrCode ? (
        <div className="qr-container">
          <div className="qr-code">
            <img src={qrCode} alt="WhatsApp QR Code" width="256" height="256" />
          </div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone /> Scan with WhatsApp
          </h3>
          <p className="subtitle" style={{ textAlign: 'center', maxWidth: '400px', marginTop: '0.5rem' }}>
            Open WhatsApp on your phone - Settings - Linked Devices - Link a Device, and point your camera at this QR code.
          </p>
        </div>
      ) : (
        <div className="qr-container">
          <p>Initializing WhatsApp Client...</p>
        </div>
      )}

      {authStatus === 'ready' && progress.total > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Sending Progress</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
          <p className="subtitle" style={{ textAlign: 'center', fontSize: '0.875rem' }}>
            Please keep this window open until all messages are sent.
          </p>
        </div>
      )}

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Live Logs</h3>
      <div className="logs-container">
        {logs.map((log, i) => (
          <div key={i} className="log-entry">
            <span className="log-time">[{log.time}]</span>
            <span className="log-msg">{log.msg}</span>
          </div>
        ))}
        {logs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Waiting for execution to start...</p>}
      </div>
    </div>
  );
};

export default AuthProgressSection;
