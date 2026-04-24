import { useWhatsAppAutomation } from './hooks/useWhatsAppAutomation';
import StepIndicator from './components/StepIndicator';
import UploadSection from './components/UploadSection';
import ClientUploadModal from './components/ClientUploadModal';
import ResolveIssuesModal from './components/ResolveIssuesModal';
import PreviewSection from './components/PreviewSection';
import AuthProgressSection from './components/AuthProgressSection';
import './index.css';

function App() {
  const {
    step,
    clientsFile, setClientsFile,
    apptsFile, setApptsFile,
    showClientUploadModal, setShowClientUploadModal,
    showResolveIssuesModal, setShowResolveIssuesModal,
    queues, qrCode, authStatus, progress, logs,
    handleFileUpload,
    handleClientFileUpload,
    handleClearClients,
    handleStartSending,
    handleResolveIssues
  } = useWhatsAppAutomation();

  return (
    <div className="app-container">
      <h1>WhatsApp Automation</h1>
      <p className="subtitle">Send personalized appointment reminders automatically.</p>

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
