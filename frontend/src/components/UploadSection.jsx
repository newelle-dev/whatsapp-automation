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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{isLastVisitCampaign ? 'Upload Last Visit Data' : 'Upload Appointments Data'}</h2>
        <button className="btn" onClick={onShowModal} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          Manage Client List
        </button>
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
