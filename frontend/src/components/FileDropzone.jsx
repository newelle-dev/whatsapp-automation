import { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

const FileDropzone = ({ label, file, setFile }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, [setFile]);

  return (
    <div 
      className={`upload-box ${file ? 'has-file' : ''} ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById(`file-${label}`).click()}
    >
      <input 
        id={`file-${label}`}
        type="file" 
        accept=".csv" 
        style={{ display: 'none' }} 
        onChange={(e) => setFile(e.target.files[0])}
      />
      {file ? (
        <FileSpreadsheet className="file-icon" />
      ) : (
        <UploadCloud className="upload-icon" />
      )}
      <h3 style={{ marginBottom: "0.5rem", fontWeight: 600 }}>{label}</h3>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>
        {file ? file.name : "Drag & drop CSV export or click to browse"}
      </p>
      {file && (
        <span className="badge success" style={{ marginTop: '1rem' }}>
          File Selected
        </span>
      )}
    </div>
  );
};

export default FileDropzone;
