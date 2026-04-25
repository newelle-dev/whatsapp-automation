const express = require('express');

function createUploadRoutes({ upload, state, addLog, buildMessageForItem, processAppointments, processLastVisitCampaign, removeTempFile }) {
    const router = express.Router();

    router.post('/api/upload', upload.single('appointmentsCsv'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Appointments CSV file is required.' });
            }

            if (state.clientMap.size === 0) {
                removeTempFile(req.file.path);
                return res.status(400).json({ error: 'Client list is empty. Please upload the client list first.' });
            }

            const processed = await processAppointments(req.file.path, state.clientMap);

            state.sendingQueue = processed.sendingQueue.map((item) => ({
                ...item,
                message: buildMessageForItem(item)
            }));
            state.manualReviewQueue = processed.manualReviewQueue;

            removeTempFile(req.file.path, { logErrors: true });

            res.json({
                sendingQueue: state.sendingQueue,
                manualReviewQueue: state.manualReviewQueue
            });
        } catch (err) {
            console.error('Error uploading appointments CSV:', err);
            if (req.file) {
                removeTempFile(req.file.path);
            }
            res.status(500).json({ error: 'Failed to upload appointments CSV.' });
        }
    });

    router.post('/api/upload-last-visit', upload.single('lastVisitCsv'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Last Visit CSV file is required.' });
            }

            const processed = await processLastVisitCampaign(req.file.path);

            state.sendingQueue = processed.sendingQueue.map((item) => ({
                ...item,
                message: buildMessageForItem(item)
            }));
            state.manualReviewQueue = processed.manualReviewQueue.map((item) => ({
                ...item,
                message: buildMessageForItem(item)
            }));

            removeTempFile(req.file.path, { logErrors: true });

            addLog(`Processed last-visit campaign with ${state.sendingQueue.length} sendable customers and ${state.manualReviewQueue.length} manual review items.`);

            res.json({
                sendingQueue: state.sendingQueue,
                manualReviewQueue: state.manualReviewQueue,
                campaign: 'last-visit'
            });
        } catch (err) {
            console.error('Error uploading last visit CSV:', err);
            if (req.file) {
                removeTempFile(req.file.path);
            }
            res.status(500).json({ error: 'Failed to process Last Visit CSV.' });
        }
    });

    return router;
}

module.exports = { createUploadRoutes };
