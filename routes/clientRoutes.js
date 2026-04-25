const express = require('express');

function createClientRoutes({ upload, state, addLog, readClients, writeClientData, removeTempFile }) {
    const router = express.Router();

    router.post('/api/upload-clients', upload.single('clientsCsv'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Client CSV file is required.' });
            }

            const newClients = await readClients(req.file.path);
            await writeClientData(newClients);

            state.clientMap.clear();
            newClients.forEach((client) => state.clientMap.set(client.name, new Set(client.phones)));

            removeTempFile(req.file.path, { logErrors: true });

            addLog(`Updated client list with ${state.clientMap.size} entries. Temporary file deleted.`);
            res.json({ message: `Client list updated with ${state.clientMap.size} entries.`, clientCount: state.clientMap.size });
        } catch (err) {
            console.error('Error uploading client CSV:', err);
            if (req.file) {
                removeTempFile(req.file.path);
            }
            res.status(500).json({ error: 'Failed to upload client CSV.' });
        }
    });

    router.delete('/api/clients', async (req, res) => {
        try {
            await writeClientData([]);
            state.clientMap.clear();
            addLog('Client list cleared from persistent storage.');
            res.json({ message: 'Client list cleared successfully.' });
        } catch (err) {
            res.status(500).json({ error: 'Failed to clear client list.' });
        }
    });

    return router;
}

module.exports = { createClientRoutes };
