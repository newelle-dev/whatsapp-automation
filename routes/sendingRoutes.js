const express = require('express');
const { startSendingFlow } = require('../services/sendingService');

function createSendingRoutes({ state, io, addLog, resetLogs, buildMessageForItem }) {
    const router = express.Router();

    router.post('/api/start-sending', async (req, res) => {
        if (!state.isAuthReady) {
            return res.status(400).json({ error: 'WhatsApp is not ready' });
        }
        if (state.isSending) {
            return res.status(400).json({ error: 'Already sending messages' });
        }

        state.isSending = true;
        resetLogs();
        addLog('Starting execution flow...');

        res.json({ status: 'started', total: state.sendingQueue.length });

        startSendingFlow({ state, io, addLog, buildMessageForItem });
    });

    return router;
}

module.exports = { createSendingRoutes };
