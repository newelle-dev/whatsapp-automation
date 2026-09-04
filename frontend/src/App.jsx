import { useWhatsAppAutomation } from './hooks/useWhatsAppAutomation';
import StepIndicator from './components/StepIndicator';
import UploadSection from './components/UploadSection';
import ClientUploadModal from './components/ClientUploadModal';
import ResolveIssuesModal from './components/ResolveIssuesModal';
import PreviewSection from './components/PreviewSection';
import AuthProgressSection from './components/AuthProgressSection';
import PostSendResultsSection from './components/PostSendResultsSection';
import TemplateEditorModal from './components/TemplateEditorModal';
import { MessageSquare, Settings } from 'lucide-react';
import './index.css';

function App() {
  const {
    step,
    campaignMode, setCampaignMode,
    selectedOutletKey, setSelectedOutletKey,
    selectedOutlet,
    clientsFile, setClientsFile,
    apptsFile, setApptsFile,
    showClientUploadModal, setShowClientUploadModal,
    showResolveIssuesModal, setShowResolveIssuesModal,
    showTemplateEditorModal,
    templateContent,
    templateLoading,
    templateSaving,
    templateError,
    templateWarnings,
    templatePreviewData,
    sendReadiness,
    openTemplateEditor,
    closeTemplateEditor,
    saveTemplate,
    resetTemplate,
    queues, qrCode, authStatus, progress, logs,
    sendResults, sendSummary, sendStatus,
    updatePreviewName,
    togglePreviewExclusion,
    handleFileUpload,
    handleClientFileUpload,
    handleClearClients,
    handleStartSending,
    handleResolveIssues,
    handleRetryFailed,
    setStep
  } = useWhatsAppAutomation();

  const getStatusLabelAndClass = () => {
    if (authStatus === 'ready') {
      return { label: 'WhatsApp Live', dotClass: 'active' };
    }
    if (step === 3 && authStatus !== 'ready') {
      return { label: 'Client Connecting', dotClass: 'pending' };
    }
    return { label: 'Client Offline', dotClass: 'inactive' };
  };

  const status = getStatusLabelAndClass();

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-title-area">
          <div className="app-logo-row">
            <div className="logo-badge">
              <MessageSquare size={22} color="white" />
            </div>
            <h1>176 Avenue WhatsApp</h1>
          </div>
          <p className="subtitle" style={{ margin: 0, marginTop: '0.25rem' }}>Personalized appointment reminders automation hub.</p>
        </div>
        
        <div className="app-actions">
          <div className="status-indicator">
            <span className={`status-dot ${status.dotClass}`}></span>
            <span>{status.label}</span>
          </div>
          <button className="btn btn-ghost" onClick={openTemplateEditor} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Settings size={16} /> Edit Template
          </button>
        </div>
      </div>

      <StepIndicator step={step} />

      {step === 1 && (
        <UploadSection 
          campaignMode={campaignMode}
          setCampaignMode={setCampaignMode}
          apptsFile={apptsFile}
          setApptsFile={setApptsFile}
          onProcess={() => handleFileUpload()}
          onShowModal={() => setShowClientUploadModal(true)}
        />
      )}

      {showClientUploadModal && (
        <ClientUploadModal 
          onClose={() => setShowClientUploadModal(false)}
          clientsFile={clientsFile}
          setClientsFile={setClientsFile}
          onUpload={handleClientFileUpload}
          onClear={handleClearClients}
        />
      )}

      {showResolveIssuesModal && (
        <ResolveIssuesModal
          issues={queues.manualReviewQueue}
          onSubmit={handleResolveIssues}
          onCancel={() => setShowResolveIssuesModal(false)}
        />
      )}

      {showTemplateEditorModal && (
        <TemplateEditorModal
          template={templateContent}
          previewData={templatePreviewData}
          loading={templateLoading}
          saving={templateSaving}
          error={templateError}
          warnings={templateWarnings}
          onSave={saveTemplate}
          onCancel={closeTemplateEditor}
          onReset={resetTemplate}
        />
      )}

      {step === 2 && (
        <PreviewSection 
          queues={queues}
          selectedOutlet={selectedOutlet}
          selectedOutletKey={selectedOutletKey}
          setSelectedOutletKey={setSelectedOutletKey}
          canStartSending={sendReadiness.canStartSending}
          sendDisabledReason={sendReadiness.reason}
          templateWarnings={templateWarnings}
          onStartSending={handleStartSending}
          onEditRecipientName={updatePreviewName}
          onToggleRecipientExclusion={togglePreviewExclusion}
        />
      )}

      {step === 3 && sendStatus !== 'completed' && (
        <AuthProgressSection 
          authStatus={authStatus}
          qrCode={qrCode}
          progress={progress}
          logs={logs}
        />
      )}

      {step === 3 && sendStatus === 'completed' && (
        <PostSendResultsSection
          results={sendResults}
          summary={sendSummary}
          progress={progress}
          onRetryFailed={handleRetryFailed}
          onResetView={() => setStep(2)}
        />
      )}
    </div>
  );
}

export default App;
