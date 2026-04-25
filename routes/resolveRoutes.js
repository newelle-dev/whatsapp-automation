const express = require('express');

function createResolveRoutes({ state, addLog, buildMessageForItem, formatPhone, readClientData, writeClientData }) {
    const router = express.Router();

    router.post('/api/resolve-issues', async (req, res) => {
        try {
            const { resolved } = req.body;
            if (!resolved || !Array.isArray(resolved)) {
                return res.status(400).json({ error: 'Invalid data format. Expected array of resolved clients.' });
            }

            const resolvedMap = new Map();
            resolved.forEach(({ name, phone }) => {
                if (!name || !phone) return;
                const formatted = formatPhone(phone);
                if (formatted) resolvedMap.set(name, formatted);
            });

            const stillUnresolved = [];
            for (const item of state.manualReviewQueue) {
                const phone = resolvedMap.get(item.name);
                if (phone) {
                    item.phone = phone;
                    item.message = buildMessageForItem(item);
                    state.sendingQueue.push(item);
                } else {
                    stillUnresolved.push(item);
                }
            }
            state.manualReviewQueue = stillUnresolved;

            const existingClients = await readClientData();
            for (const [name, phone] of resolvedMap.entries()) {
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

            addLog(`Resolved ${resolvedMap.size} clients. Sending queue: ${state.sendingQueue.length}, remaining issues: ${state.manualReviewQueue.length}`);
            res.json({ sendingQueue: state.sendingQueue, manualReviewQueue: state.manualReviewQueue });
        } catch (err) {
            console.error('Error resolving issues:', err);
            res.status(500).json({ error: 'Failed to resolve issues.' });
        }
    });

    return router;
}

module.exports = { createResolveRoutes };
