const express = require('express');
const { startSendingFlow } = require('../services/sendingService');

function createSendingRoutes({ state, io, addLog, resetLogs, buildMessageForItem }) {
    const router = express.Router();

    router.post('/api/start-sending', async (req, res) => {
        const queueFromRequest = Array.isArray(req.body?.queue) ? req.body.queue : null;

        if (!state.isAuthReady) {
            return res.status(400).json({ error: 'WhatsApp is not ready' });
        }
        if (state.isSending) {
            return res.status(400).json({ error: 'Already sending messages' });
        }

        if (queueFromRequest) {
            state.sendingQueue = queueFromRequest.filter((item) => !item.isExcluded);
        }

        if (state.sendingQueue.length === 0) {
            return res.status(400).json({ error: 'No recipients are selected to send.' });
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
