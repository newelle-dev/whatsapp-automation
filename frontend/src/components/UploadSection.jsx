import { ArrowRight } from 'lucide-react';
import FileDropzone from './FileDropzone';

const UploadSection = ({ 
  apptsFile, 
  setApptsFile, 
  onProcess, 
  onShowModal 
}) => {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Upload Appointments Data</h2>
        <button className="btn" onClick={onShowModal} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          Manage Client List
        </button>
      </div>
      <p className="subtitle">Upload your daily Fresha Appointments export below. Ensure your client list is up-to-date.</p>
      <div className="upload-grid">
        <FileDropzone label="Exported Appointments" file={apptsFile} setFile={setApptsFile} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn" disabled={!apptsFile} onClick={onProcess}>
          Process Appointments <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default UploadSection;
