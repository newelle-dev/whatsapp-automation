import { useWhatsAppAutomation } from './hooks/useWhatsAppAutomation';
import StepIndicator from './components/StepIndicator';
import UploadSection from './components/UploadSection';
import ClientUploadModal from './components/ClientUploadModal';
import ResolveIssuesModal from './components/ResolveIssuesModal';
import PreviewSection from './components/PreviewSection';
import AuthProgressSection from './components/AuthProgressSection';
import TemplateEditorModal from './components/TemplateEditorModal';
import './index.css';

function App() {
  const {
    step,
    clientsFile, setClientsFile,
    apptsFile, setApptsFile,
    showClientUploadModal, setShowClientUploadModal,
    showResolveIssuesModal, setShowResolveIssuesModal,
    showTemplateEditorModal,
    templateContent,
    templateLoading,
    templateSaving,
    templateError,
    templatePreviewData,
    openTemplateEditor,
    closeTemplateEditor,
    saveTemplate,
    resetTemplate,
    queues, qrCode, authStatus, progress, logs,
    handleFileUpload,
    handleClientFileUpload,
    handleClearClients,
    handleStartSending,
    handleResolveIssues
  } = useWhatsAppAutomation();

  return (
    <div className="app-container">
      <div className="app-header">
        <div>
          <h1>WhatsApp Automation</h1>
          <p className="subtitle">Send personalized appointment reminders automatically.</p>
        </div>
        <div className="app-actions">
          <button className="btn btn-ghost" onClick={openTemplateEditor}>
            Edit Template
          </button>
        </div>
      </div>

      <StepIndicator step={step} />

      {step === 1 && (
        <UploadSection 
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
          onSave={saveTemplate}
          onCancel={closeTemplateEditor}
          onReset={resetTemplate}
        />
      )}

      {step === 2 && (
        <PreviewSection 
          queues={queues}
          onStartSending={handleStartSending}
        />
      )}

      {step === 3 && (
        <AuthProgressSection 
          authStatus={authStatus}
          qrCode={qrCode}
          progress={progress}
          logs={logs}
        />
      )}
    </div>
  );
}

export default App;
