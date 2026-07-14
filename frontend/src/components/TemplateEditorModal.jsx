import { useEffect, useState } from 'react';
import { Edit3, Save, RotateCcw, X } from 'lucide-react';

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
  warnings,
  onSave,
  onCancel,
  onReset
}) {
  const [draft, setDraft] = useState(template || DEFAULT_TEMPLATE);

  useEffect(() => {
    setDraft(template || DEFAULT_TEMPLATE);
  }, [template]);

  const previewText = substituteTemplate(draft || DEFAULT_TEMPLATE, previewData || {});
  const hasChanges = draft !== (template || DEFAULT_TEMPLATE);

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
    setDraft(DEFAULT_TEMPLATE);
    onReset(DEFAULT_TEMPLATE);
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content template-editor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="template-editor-header">
          <div>
            <h2 className="template-editor-title">
              <Edit3 size={22} /> Edit Message Template
            </h2>
            <p className="template-editor-subtitle">
              Update the reusable reminder text that is sent for every appointment.
            </p>
          </div>
          <button className="btn-icon" onClick={handleCancel} aria-label="Close template editor">
            <X size={20} />
          </button>
        </div>

        <div className="template-editor-layout">
          <div className="template-editor-panel">
            <label className="template-editor-label" htmlFor="message-template">Template</label>
            <textarea
              id="message-template"
              className="template-editor-textarea"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write your message template here..."
              rows={12}
              disabled={loading || saving}
            />
            <div className="template-editor-actions">
              <button className="btn template-secondary-btn" onClick={handleReset} disabled={loading || saving}>
                <RotateCcw size={16} /> Reset
              </button>
              <button className="btn" onClick={handleSave} disabled={loading || saving || !hasChanges}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
            {error && <p className="template-editor-error">{error}</p>}
            {Array.isArray(warnings) && warnings.length > 0 && (
              <div className="template-editor-warning-block">
                <p className="template-help-title">Template warnings</p>
                <ul className="template-editor-warning-list">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="template-editor-panel template-preview-panel">
            <div className="template-editor-label">Live Preview</div>
            <div className="template-preview-card">
              {loading ? 'Loading current template...' : previewText}
            </div>
            <div className="template-help-block">
              <p className="template-help-title">Supported placeholders</p>
              <div className="template-placeholder-list">
                {PLACEHOLDERS.map((placeholder) => (
                  <span className="template-placeholder-pill" key={placeholder.key} title={placeholder.label}>
                    {placeholder.key}
                  </span>
                ))}
              </div>
              <p className="template-help-note">
                Preview uses the first queued appointment when available, otherwise a sample reminder. Use the outlet placeholders to keep one template reusable across Bangsar, KLGCC, and SS2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}