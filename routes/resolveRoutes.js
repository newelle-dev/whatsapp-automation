const express = require('express');

function createResolveRoutes({ state, addLog, buildMessageForItem, formatPhone, readClientData, writeClientData }) {
    const router = express.Router();

    router.post('/api/resolve-issues', async (req, res) => {
        try {
            const { resolved } = req.body;
            if (!resolved || !Array.isArray(resolved)) {
                return res.status(400).json({ error: 'Invalid data format. Expected array of resolved clients.' });
            }

            const resolvedByIndex = new Map();
            resolved.forEach(({ queueIndex, phone }) => {
                if (!Number.isInteger(queueIndex) || queueIndex < 0 || !phone) return;
                const formatted = formatPhone(phone);
                if (formatted) {
                    resolvedByIndex.set(queueIndex, formatted);
                }
            });

            const stillUnresolved = [];
            const resolvedClientPairs = [];
            for (let index = 0; index < state.manualReviewQueue.length; index += 1) {
                const item = state.manualReviewQueue[index];
                const phone = resolvedByIndex.get(index);

                if (phone) {
                    item.phone = phone;
                    item.message = buildMessageForItem(item);
                    state.sendingQueue.push(item);
                    resolvedClientPairs.push({ name: item.name, phone });
                } else {
                    stillUnresolved.push(item);
                }
            }
            state.manualReviewQueue = stillUnresolved;

            const existingClients = await readClientData();
            for (const { name, phone } of resolvedClientPairs) {
                const existing = existingClients.find((c) => c.name === name);
                if (existing) {
                    if (!existing.phones.includes(phone)) {
                        existing.phones.push(phone);
                    }
                } else {
                    existingClients.push({ name, phones: [phone] });
                }

                if (!state.clientMap.has(name)) state.clientMap.set(name, new Set());
                state.clientMap.get(name).add(phone);
            }
            await writeClientData(existingClients);

            addLog(`Resolved ${resolvedClientPairs.length} clients. Sending queue: ${state.sendingQueue.length}, remaining issues: ${state.manualReviewQueue.length}`);
            res.json({ sendingQueue: state.sendingQueue, manualReviewQueue: state.manualReviewQueue });
        } catch (err) {
            console.error('Error resolving issues:', err);
            res.status(500).json({ error: 'Failed to resolve issues.' });
        }
    });

    return router;
}

module.exports = { createResolveRoutes };
