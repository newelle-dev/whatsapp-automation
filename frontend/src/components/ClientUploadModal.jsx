import { UploadCloud, X } from 'lucide-react';
import FileDropzone from './FileDropzone';

const ClientUploadModal = ({ 
  onClose, 
  clientsFile, 
  setClientsFile, 
  onUpload, 
  onClear 
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Upload Customer List</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close client upload modal">
            <X size={18} />
          </button>
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
          Import your master customer database. This maps names to numbers when exports only contain contact info.
        </p>

        <FileDropzone label="Customer List CSV" file={clientsFile} setFile={setClientsFile} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={onClear} style={{ color: '#fda4af' }}>
            Clear Current List
          </button>
          <button className="btn" disabled={!clientsFile} onClick={onUpload}>
            Upload New List <UploadCloud size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientUploadModal;
