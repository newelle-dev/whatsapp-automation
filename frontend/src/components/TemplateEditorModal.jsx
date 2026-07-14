/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useRef } from 'react';
import { Edit3, Save, RotateCcw, X } from 'lucide-react';
import { OUTLETS } from '../config/outlets';

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lintTemplateForHardcodedOutlets(template) {
  const templateText = String(template || '');
  const warnings = [];

  Object.values(OUTLETS).forEach((outlet) => {
    if (outlet?.name) {
      const outletNamePattern = new RegExp(escapeRegExp(outlet.name), 'i');
      if (outletNamePattern.test(templateText)) {
        warnings.push(`Template hardcodes outlet name "${outlet.name}". Use {{outletName}} instead.`);
      }
    }

    if (outlet?.mapLink) {
      const outletMapLinkPattern = new RegExp(escapeRegExp(outlet.mapLink), 'i');
      if (outletMapLinkPattern.test(templateText)) {
        warnings.push(`Template hardcodes a map link for "${outlet.name}". Use {{outletMapLink}} instead.`);
      }
    }
  });

  return warnings;
}

const PLACEHOLDERS = [
  { key: '{{name}}', label: 'Client name' },
  { key: '{{service}}', label: 'Service' },
  { key: '{{time}}', label: 'Time' },
  { key: '{{date}}', label: 'Date' },
  { key: '{{day}}', label: 'Day' },
  { key: '{{outletName}}', label: 'Selected outlet name' },
  { key: '{{outletMapLink}}', label: 'Selected outlet map link' }
];

const DEFAULT_TEMPLATE = `Hi {{name}},

Greetings from {{outletName}}✨

This is a friendly reminder of your upcoming appointment:

📅 Date: {{day}}, {{date}}
⏰ Time: {{time}}
💇 Service: {{service}}

To secure your slot, kindly reply:
✔ Y – to confirm
❌ NO – to cancel

⏰ Please confirm. Unconfirmed slots may be released to clients on our waitlist.

Location Reminder:
🏢 {{outletName}}
📍{{outletMapLink}}

📣 As our stylists have limited availability during this period, your confirmation is greatly appreciated.

Thank you and have a wonderful day! 😊

Warm regards,
176 Avenue ✨`;

const substituteTemplate = (template, data) => {
  const outletName = data.outletName || '176 Avenue @ Bangsar';
  const outletMapLink = data.outletMapLink || 'https://maps.app.goo.gl/9jSejq5iw6cToF8P8';

  return template
    .replace(/\{\{name\}\}/g, data.displayName || data.name || 'Client')
    .replace(/\{\{service\}\}/g, data.service || 'your appointment')
    .replace(/\{\{time\}\}/g, data.time || 'the scheduled time')
    .replace(/\{\{date\}\}/g, data.date || 'the scheduled date')
    .replace(/\{\{day\}\}/g, data.day || 'the scheduled day')
    .replace(/\{\{outletName\}\}/g, outletName)
    .replace(/\{\{outletMapLink\}\}/g, outletMapLink);
};

export default function TemplateEditorModal({
  template,
  previewData,
  loading,
  saving,
  error,
  onSave,
  onCancel,
  onReset
}) {
  const [draft, setDraft] = useState(template || DEFAULT_TEMPLATE);
  const textareaRef = useRef(null);

  useEffect(() => {
    setDraft(template || DEFAULT_TEMPLATE);
  }, [template]);

  const previewText = substituteTemplate(draft || DEFAULT_TEMPLATE, previewData || {});
  const hasChanges = draft !== (template || DEFAULT_TEMPLATE);
  const liveWarnings = lintTemplateForHardcodedOutlets(draft);

  const handleCancel = () => {
    if (hasChanges && !window.confirm('Discard unsaved template changes?')) {
      return;
    }
    onCancel();
  };

  const handleSave = () => {
    onSave(draft);
  };

  const handleReset = () => {
    if (window.confirm('Reset template to default template?')) {
      setDraft(DEFAULT_TEMPLATE);
      onReset(DEFAULT_TEMPLATE);
    }
  };

  const handleInsertPlaceholder = (placeholderKey) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const nextValue = before + placeholderKey + after;
    setDraft(nextValue);

    // Refocus the textarea and position cursor after the inserted placeholder
    setTimeout(() => {
      textarea.focus();
      const nextCursorPos = start + placeholderKey.length;
      textarea.setSelectionRange(nextCursorPos, nextCursorPos);
    }, 0);
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content template-editor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="template-editor-header">
          <div>
            <h2 className="template-editor-title">
              <Edit3 size={22} style={{ color: 'var(--accent-color)' }} /> Edit Message Template
            </h2>
            <p className="template-editor-subtitle">
              Modify the reusable reminder template used for campaign dispatches.
            </p>
          </div>
          <button className="btn-icon" onClick={handleCancel} aria-label="Close template editor">
            <X size={20} />
          </button>
        </div>

        <div className="template-editor-layout">
          {/* Edit Panel */}
          <div className="template-editor-panel">
            <label className="template-editor-label" htmlFor="message-template">Template Text</label>
            <textarea
              id="message-template"
              ref={textareaRef}
              className="template-editor-textarea"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write your message template here..."
              disabled={loading || saving}
            />
            
            <div style={{ marginTop: '1.25rem' }}>
              <span className="template-editor-label" style={{ fontSize: '0.8rem' }}>Placeholders (Click to insert)</span>
              <div className="template-placeholder-list">
                {PLACEHOLDERS.map((placeholder) => (
                  <button
                    key={placeholder.key}
                    type="button"
                    className="template-placeholder-pill"
                    onClick={() => handleInsertPlaceholder(placeholder.key)}
                    title={placeholder.label}
                  >
                    {placeholder.key}
                  </button>
                ))}
              </div>
            </div>

            <div className="template-editor-actions">
              <button className="btn btn-secondary" onClick={handleReset} disabled={loading || saving}>
                <RotateCcw size={16} /> Reset Default
              </button>
              <button className="btn" onClick={handleSave} disabled={loading || saving || !hasChanges}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
            {error && <p className="template-editor-error">{error}</p>}
          </div>

          {/* Live Preview Panel */}
          <div className="template-editor-panel template-preview-panel">
            <div className="template-editor-label">Live Preview (Simulated Bubble)</div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '10px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading template...</div>
              ) : (
                <div className="whatsapp-bubble-panel" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                  <div className="whatsapp-bubble-body sent-bubble" style={{ fontSize: '0.9rem' }}>
                    {previewText}
                  </div>
                </div>
              )}
            </div>

            {liveWarnings.length > 0 && (
              <div className="template-editor-warning-block">
                <p className="template-help-title">Template Safety Warnings</p>
                <ul className="template-editor-warning-list">
                  {liveWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="template-help-note">
              The preview simulates the rendering output. Click the placeholder pills above to insert dynamic tokens. Use outlet tags to support automatic branch mapping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}