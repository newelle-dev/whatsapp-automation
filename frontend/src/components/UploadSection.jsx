import { ArrowRight } from 'lucide-react';
import FileDropzone from './FileDropzone';
import { OUTLET_OPTIONS, isValidHttpUrl } from '../config/outlets';

const UploadSection = ({ 
  campaignMode,
  setCampaignMode,
  selectedOutletKey,
  setSelectedOutletKey,
  selectedOutlet,
  apptsFile, 
  setApptsFile, 
  onProcess, 
  onShowModal 
}) => {
  const isLastVisitCampaign = campaignMode === 'last-visit';
  const selectedOutletLabel = selectedOutlet?.name || 'No outlet selected';
  const selectedOutletMapLink = selectedOutlet?.mapLink || '';
  const outletHasValidMapLink = isValidHttpUrl(selectedOutletMapLink);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{isLastVisitCampaign ? 'Upload Last Visit Data' : 'Upload Appointments Data'}</h2>
        <button className="btn" onClick={onShowModal} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          Manage Client List
        </button>
      </div>

      <div style={{
        display: 'grid',
        gap: '0.85rem',
        marginBottom: '1rem',
        padding: '1rem',
        borderRadius: '14px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(0,0,0,0.16)'
      }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Selected outlet</span>
          <select
            value={selectedOutletKey}
            onChange={(event) => setSelectedOutletKey?.(event.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.15)',
              color: 'var(--text-primary)'
            }}
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
        </label>
        <p style={{ color: outletHasValidMapLink ? 'var(--text-muted)' : '#fca5a5', margin: 0 }}>
          {outletHasValidMapLink
            ? `Messages will use ${selectedOutletLabel} and its map link.`
            : `${selectedOutletLabel} is missing a valid map link, so sending will stay blocked until it is fixed.`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={`btn ${campaignMode === 'appointments' ? '' : 'btn-ghost'}`}
          onClick={() => setCampaignMode('appointments')}
          style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
        >
          Appointments Reminder
        </button>
        <button
          className={`btn ${campaignMode === 'last-visit' ? '' : 'btn-ghost'}`}
          onClick={() => setCampaignMode('last-visit')}
          style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
        >
          7-Day Last Visit Follow-up
        </button>
      </div>

      <p className="subtitle">
        {isLastVisitCampaign
          ? 'Upload your daily Wessconnect Last Visit.csv export to target customers whose last visit was 7 days ago.'
          : 'Upload your daily Fresha Appointments export below. Ensure your client list is up-to-date.'}
      </p>
      <div className="upload-grid">
        <FileDropzone
          label={isLastVisitCampaign ? 'Wessconnect Last Visit.csv' : 'Exported Appointments'}
          file={apptsFile}
          setFile={setApptsFile}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn" disabled={!apptsFile} onClick={onProcess}>
          {isLastVisitCampaign ? 'Process Last Visit Campaign' : 'Process Appointments'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default UploadSection;
