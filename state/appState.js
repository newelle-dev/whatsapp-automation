const state = {
    whatsappClient: null,
    clientMap: new Map(),
    sendingQueue: [],
    manualReviewQueue: [],
    sendResults: [],
    sendSummary: { total: 0, sent: 0, failed: 0 },
    currentLog: [],
    isAuthReady: false,
    isSending: false
};

module.exports = state;
