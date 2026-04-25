const state = {
    whatsappClient: null,
    clientMap: new Map(),
    sendingQueue: [],
    manualReviewQueue: [],
    currentLog: [],
    isAuthReady: false,
    isSending: false
};

module.exports = state;
