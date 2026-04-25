import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function ResolveIssuesModal({ issues, onSubmit, onCancel }) {
  const [phoneInputs, setPhoneInputs] = useState({});

  const handlePhoneChange = (name, value) => {
    setPhoneInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Collect all inputs that have a value
    const resolved = Object.entries(phoneInputs)
      .filter(([name, phone]) => phone.trim() !== '')
      .map(([name, phone]) => ({ name, phone }));
    
    // Proceed even if some inputs are left blank
    onSubmit(resolved);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
          <AlertCircle size={24} /> Resolve Missing Contact Info
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Some appointments are missing valid phone numbers or have multiple numbers associated (collisions). 
          <strong> You may provide a phone number for any of them, but it's optional — you can proceed without filling them all.</strong>
        </p>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto', margin: '1rem 0', paddingRight: '1rem' }}>
          {issues.map((issue, idx) => (
             <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                 <p style={{ margin: 0, fontWeight: 'bold' }}>{issue.name}</p>
                 <span className="badge error" style={{ fontSize: '0.75rem' }}>{issue.reason}</span>
               </div>
               
               <input 
                 type="text" 
                 placeholder="Enter correct phone number (e.g. 0123456789)"
                 value={phoneInputs[issue.name] || ''}
                 onChange={(e) => handlePhoneChange(issue.name, e.target.value)}
                 className="form-control"
                 style={{ marginTop: '0.5rem', width: '100%' }}
               />
             </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button className="btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }} onClick={onCancel}>
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
