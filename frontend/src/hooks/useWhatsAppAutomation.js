import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

export const useWhatsAppAutomation = () => {
  const [step, setStep] = useState(1);
  const [clientsFile, setClientsFile] = useState(null);
  const [apptsFile, setApptsFile] = useState(null);
  const [showClientUploadModal, setShowClientUploadModal] = useState(false);
  const [showResolveIssuesModal, setShowResolveIssuesModal] = useState(false);
  
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

  const handleFileUpload = async (reprocessFile = null) => {
    const fileToUpload = reprocessFile || apptsFile;
    if (!fileToUpload) return alert("Please select an appointments file.");
    
    const formData = new FormData();
    formData.append('appointmentsCsv', fileToUpload);

    try {
      const res = await axios.post('http://localhost:3000/api/upload', formData);
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
      setShowResolveIssuesModal(false);
      
      // If there are still unresolved issues, keep the modal open
      if (res.data.manualReviewQueue && res.data.manualReviewQueue.length > 0) {
        setShowResolveIssuesModal(true);
      } else {
        setStep(2);
      }
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
  };
};
