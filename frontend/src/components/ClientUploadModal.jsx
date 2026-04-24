import { UploadCloud } from 'lucide-react';
import FileDropzone from './FileDropzone';

const ClientUploadModal = ({ 
  onClose, 
  clientsFile, 
  setClientsFile, 
  onUpload, 
  onClear 
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Upload Customer List</h2>
          <button className="btn-icon" onClick={onClose}>✖</button>
        </div>
        <FileDropzone label="Customer List CSV" file={clientsFile} setFile={setClientsFile} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onClear} style={{ background: '#4b5563' }}>
            Clear Current List
          </button>
          <button className="btn" disabled={!clientsFile} onClick={onUpload}>
            Upload New List <UploadCloud size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientUploadModal;
