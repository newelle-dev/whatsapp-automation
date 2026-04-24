import { useCallback } from 'react';
import { UploadCloud, FileType } from 'lucide-react';

const FileDropzone = ({ label, file, setFile }) => {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, [setFile]);

  return (
    <div 
      className={`upload-box ${file ? 'has-file' : ''}`}
      onDragOver={(e) => e.preventDefault()}
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
      {file ? <FileType /> : <UploadCloud />}
      <h3 style={{ marginBottom: "0.5rem" }}>{label}</h3>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
        {file ? file.name : "Drag & drop CSV or click to browse"}
      </p>
    </div>
  );
};

export default FileDropzone;
