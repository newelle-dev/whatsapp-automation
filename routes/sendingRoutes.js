const express = require('express');
const { startSendingFlow } = require('../services/sendingService');
const { validateSendPreflight } = require('../services/templates/templateValidation');

function createSendingRoutes({ state, io, addLog, resetLogs, buildMessageForItem }) {
    const router = express.Router();

    router.post('/api/start-sending', async (req, res) => {
        const queueFromRequest = Array.isArray(req.body?.queue) ? req.body.queue : null;
        const selectedOutletKey = req.body?.selectedOutletKey;
        const nextQueue = queueFromRequest
            ? queueFromRequest.filter((item) => !item.isExcluded).map((item) => ({
                ...item,
                selectedOutletKey
            }))
            : state.sendingQueue;

        if (!state.isAuthReady) {
            return res.status(400).json({ error: 'WhatsApp is not ready' });
        }
        if (state.isSending) {
            return res.status(400).json({ error: 'Already sending messages' });
        }

        try {
            validateSendPreflight({
                selectedOutletKey,
                queue: nextQueue,
                buildMessageForItem
            });
        } catch (error) {
            return res.status(error.statusCode || 400).json({ error: error.message });
        }

        if (queueFromRequest) {
            state.sendingQueue = nextQueue;
        }

        state.isSending = true;
        state.manualReviewQueue = [];
        state.sendResults = [];
        state.sendSummary = { total: state.sendingQueue.length, sent: 0, failed: 0 };
        resetLogs();
        addLog('Starting execution flow...');

        res.json({ status: 'started', total: state.sendingQueue.length });

        startSendingFlow({ state, io, addLog, buildMessageForItem });
    });

    return router;
}

module.exports = { createSendingRoutes };
