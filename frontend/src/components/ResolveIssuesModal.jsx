import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ResolveIssuesModal({ issues, onSubmit, onCancel }) {
  const [phoneInputs, setPhoneInputs] = useState({});

  const handlePhoneChange = (queueIndex, value) => {
    setPhoneInputs(prev => ({ ...prev, [queueIndex]: value }));
  };

  const handleSubmit = () => {
    // Collect all inputs that have a value
    const resolved = Object.entries(phoneInputs)
      .filter(([, phone]) => phone.trim() !== '')
      .map(([queueIndex, phone]) => {
        const issue = issues[Number(queueIndex)] || {};

        return {
          queueIndex: Number(queueIndex),
          name: issue.name || '',
          phone
        };
      });
    
    // Proceed even if some inputs are left blank
    onSubmit(resolved);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', margin: 0, fontWeight: 700 }}>
            <AlertCircle size={24} /> Resolve Missing Contact Info
          </h2>
          <button className="btn-icon" onClick={onCancel} aria-label="Close resolve issues modal">
            <X size={18} />
          </button>
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Some imported appointments are missing valid phone numbers or have multiple numbers associated (collisions). 
          You may provide a phone number for any of them, or proceed without filling them all.
        </p>
        
        <div style={{ maxHeight: '350px', overflowY: 'auto', margin: '1rem 0', paddingRight: '0.5rem' }}>
          {issues.map((issue, idx) => (
             <div key={idx} className="resolve-item-box">
               <div className="resolve-item-header">
                 <p className="resolve-item-name">{issue.name}</p>
                 <span className="badge error">{issue.reason}</span>
               </div>
               
               <input 
                 type="text" 
                 placeholder="Enter correct phone number (e.g. 0123456789)"
                 value={phoneInputs[idx] || ''}
                 onChange={(e) => handlePhoneChange(idx, e.target.value)}
                 className="resolve-input-field"
                 style={{ marginTop: '0.25rem' }}
               />
             </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel Upload
          </button>
          <button className="btn" onClick={handleSubmit}>
            Save & Reprocess
          </button>
        </div>
      </div>
    </div>
  );
}
