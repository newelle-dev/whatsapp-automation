import { ArrowRight } from 'lucide-react';
import FileDropzone from './FileDropzone';

const UploadSection = ({ 
  campaignMode,
  setCampaignMode,
  apptsFile, 
  setApptsFile, 
  onProcess, 
  onShowModal 
}) => {
  const isLastVisitCampaign = campaignMode === 'last-visit';

  return (
    <div className="fade-in">
      <div className="app-header" style={{ borderBottom: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
        <div className="header-title-area">
          <h2>{isLastVisitCampaign ? 'Configure Campaign & Upload Last Visit' : 'Configure Campaign & Upload Appointments'}</h2>
          <p className="subtitle">Set your active outlet, select a campaign type, and import the export file.</p>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={onShowModal}>
            Manage Client List
          </button>
        </div>
      </div>

      <div className="settings-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {/* Campaign Mode Switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span className="template-editor-label">Campaign Type</span>
            <div className="campaign-switcher">
              <button
                type="button"
                className={`campaign-btn ${campaignMode === 'appointments' ? 'active' : ''}`}
                onClick={() => setCampaignMode('appointments')}
              >
                Appointments Reminder
              </button>
              <button
                type="button"
                className={`campaign-btn ${campaignMode === 'last-visit' ? 'active' : ''}`}
                onClick={() => setCampaignMode('last-visit')}
              >
                7-Day Follow-up
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="upload-grid">
        <FileDropzone
          label={isLastVisitCampaign ? 'Wessconnect Last Visit.csv' : 'Exported Appointments'}
          file={apptsFile}
          setFile={setApptsFile}
        />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button className="btn" disabled={!apptsFile} onClick={onProcess}>
          {isLastVisitCampaign ? 'Process Last Visit Campaign' : 'Process Appointments'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default UploadSection;
