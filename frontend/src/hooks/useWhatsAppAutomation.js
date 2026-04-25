import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const DEFAULT_TEMPLATE = 'Hello {{name}}, this is a reminder for {{service}} on {{date}} at {{time}}.';
const LAST_VISIT_DEFAULT_TEMPLATE = `Hi {{name}},

We're just checking in to see how your recent service experience was. We hope you're enjoying the results 😊

If you're planning your next visit, we'd be happy to assist with an advance booking for your convenience.

Feel free to share your preferred date and time, and we can also update you on any ongoing promotions.`;
const DEFAULT_PREVIEW_DATA = {
  displayName: 'Alex Morgan',
  service: 'Appointment',
  time: '10:00 AM',
  date: 'Monday, April 25, 2026',
  day: 'Monday'
};

const socket = io('http://localhost:3000');

export const useWhatsAppAutomation = () => {
  const [step, setStep] = useState(1);
  const [campaignMode, setCampaignMode] = useState('appointments');
  const [clientsFile, setClientsFile] = useState(null);
  const [apptsFile, setApptsFile] = useState(null);
  const [showClientUploadModal, setShowClientUploadModal] = useState(false);
  const [showResolveIssuesModal, setShowResolveIssuesModal] = useState(false);
  const [showTemplateEditorModal, setShowTemplateEditorModal] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateError, setTemplateError] = useState('');
  
  const [queues, setQueues] = useState({ sendingQueue: [], manualReviewQueue: [] });
  const [qrCode, setQrCode] = useState('');
  const [authStatus, setAuthStatus] = useState('none');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    socket.on('qr', (url) => setQrCode(url));
    socket.on('ready', (isReady) => {
      if (isReady) setAuthStatus('ready');
    });
    socket.on('log', (newLogs) => setLogs(newLogs));
    socket.on('progress', (prog) => setProgress(prog));
    socket.on('completed', (updatedReviewQueue) => {
      setQueues(prev => ({ ...prev, manualReviewQueue: updatedReviewQueue }));
      setAuthStatus('ready');
    });

    return () => {
      socket.off('qr'); 
      socket.off('ready'); 
      socket.off('log'); 
      socket.off('progress'); 
      socket.off('completed');
    };
  }, []);

  const loadTemplate = async () => {
    setTemplateLoading(true);
    setTemplateError('');
    const isLastVisitCampaign = campaignMode === 'last-visit';
    const fallbackTemplate = isLastVisitCampaign ? LAST_VISIT_DEFAULT_TEMPLATE : DEFAULT_TEMPLATE;

    try {
      const res = await axios.get('http://localhost:3000/api/template', {
        params: { campaign: isLastVisitCampaign ? 'last-visit' : 'appointments' }
      });
      setTemplateContent(res.data.template || fallbackTemplate);
    } catch (err) {
      setTemplateError(err.response?.data?.error || 'Failed to load message template.');
      setTemplateContent(fallbackTemplate);
    } finally {
      setTemplateLoading(false);
    }
  };

  const openTemplateEditor = async () => {
    setShowTemplateEditorModal(true);
    await loadTemplate();
  };

  const closeTemplateEditor = () => {
    setShowTemplateEditorModal(false);
    setTemplateError('');
  };

  const saveTemplate = async (nextTemplate) => {
    setTemplateSaving(true);
    setTemplateError('');
    const isLastVisitCampaign = campaignMode === 'last-visit';

    try {
      const res = await axios.post('http://localhost:3000/api/template', {
        template: nextTemplate,
        campaign: isLastVisitCampaign ? 'last-visit' : 'appointments'
      });
      setTemplateContent(res.data.template || nextTemplate);

      if (Array.isArray(res.data.sendingQueue) || Array.isArray(res.data.manualReviewQueue)) {
        setQueues({
          sendingQueue: res.data.sendingQueue || [],
          manualReviewQueue: res.data.manualReviewQueue || []
        });
      }

      setShowTemplateEditorModal(false);
      alert(res.data.message || 'Template updated successfully.');
    } catch (err) {
      setTemplateError(err.response?.data?.error || 'Failed to save message template.');
      alert('Template save failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setTemplateSaving(false);
    }
  };

  const resetTemplate = async () => {
    setTemplateSaving(true);
    setTemplateError('');
    const isLastVisitCampaign = campaignMode === 'last-visit';
    const fallbackTemplate = isLastVisitCampaign ? LAST_VISIT_DEFAULT_TEMPLATE : DEFAULT_TEMPLATE;

    try {
      const res = await axios.post('http://localhost:3000/api/template', {
        template: fallbackTemplate,
        campaign: isLastVisitCampaign ? 'last-visit' : 'appointments'
      });
      setTemplateContent(res.data.template || fallbackTemplate);

      if (Array.isArray(res.data.sendingQueue) || Array.isArray(res.data.manualReviewQueue)) {
        setQueues({
          sendingQueue: res.data.sendingQueue || [],
          manualReviewQueue: res.data.manualReviewQueue || []
        });
      }
    } catch (err) {
      setTemplateError(err.response?.data?.error || 'Failed to reset message template.');
      alert('Template reset failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setTemplateSaving(false);
    }
  };

  const templatePreviewData = queues.sendingQueue[0] || queues.manualReviewQueue[0] || DEFAULT_PREVIEW_DATA;

  const handleFileUpload = async (reprocessFile = null) => {
    const fileToUpload = reprocessFile || apptsFile;
    if (!fileToUpload) {
      const requiredFileLabel = campaignMode === 'last-visit' ? 'Last Visit.csv' : 'appointments file';
      return alert(`Please select a ${requiredFileLabel}.`);
    }
    
    const formData = new FormData();
    const isLastVisitCampaign = campaignMode === 'last-visit';
    formData.append(isLastVisitCampaign ? 'lastVisitCsv' : 'appointmentsCsv', fileToUpload);

    try {
      const endpoint = isLastVisitCampaign
        ? 'http://localhost:3000/api/upload-last-visit'
        : 'http://localhost:3000/api/upload';

      const res = await axios.post(endpoint, formData);
      setQueues(res.data);
      
      if (res.data.manualReviewQueue && res.data.manualReviewQueue.length > 0) {
        setShowResolveIssuesModal(true);
      } else {
        setStep(2);
      }
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleResolveIssues = async (resolvedClients) => {
    try {
      const res = await axios.post('http://localhost:3000/api/resolve-issues', { resolved: resolvedClients });
      setQueues(res.data);
      // Close the modal and proceed to preview even if some items remain unresolved.
      setShowResolveIssuesModal(false);
      setStep(2);
    } catch (err) {
      alert("Failed to save phone numbers: " + (err.response?.data?.error || err.message));
    }
  };

  const handleClientFileUpload = async () => {
    if (!clientsFile) return alert("Please select a client list file.");

    const formData = new FormData();
    formData.append('clientsCsv', clientsFile);

    try {
      const res = await axios.post('http://localhost:3000/api/upload-clients', formData);
      alert(res.data.message);
      setShowClientUploadModal(false);
      setClientsFile(null);
    } catch (err) {
      alert("Client list upload failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleClearClients = async () => {
    if (!window.confirm("Are you sure you want to clear the entire client list? This will remove all stored customer names and phone numbers.")) return;
    
    try {
      await axios.delete('http://localhost:3000/api/clients');
      alert("Client list cleared successfully.");
      setShowClientUploadModal(false);
    } catch (err) {
      alert("Failed to clear client list: " + (err.response?.data?.error || err.message));
    }
  };

  const handleStartSending = async () => {
    setStep(3);
    try {
      const statusRes = await axios.get('http://localhost:3000/api/whatsapp-status');
      if (statusRes.data.status !== 'ready') {
        await axios.post('http://localhost:3000/api/init-whatsapp');
      } else {
        await axios.post('http://localhost:3000/api/start-sending');
      }
    } catch (err) {
      alert("Failed to start: " + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    if (step === 3 && authStatus === 'ready') {
      axios.post('http://localhost:3000/api/start-sending').catch(err => {
        console.error("Auto-start failed:", err);
      });
    }
  }, [authStatus, step]);

  return {
    step, setStep,
    campaignMode, setCampaignMode,
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
  };
};
