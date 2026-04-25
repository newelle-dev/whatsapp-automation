const express = require('express');
const { initializeWhatsApp, getWhatsAppStatus } = require('../services/whatsappService');

function createWhatsAppRoutes({ state, io }) {
    const router = express.Router();

    router.post('/api/init-whatsapp', (req, res) => {
        if (state.whatsappClient) {
            if (state.isAuthReady) {
                return res.json({ status: 'ready' });
            }
            return res.json({ status: 'initializing' });
        }

        initializeWhatsApp({ state, io });
        res.json({ status: 'initializing' });
    });

    router.get('/api/whatsapp-status', (req, res) => {
        return res.json({ status: getWhatsAppStatus(state) });
    });

    return router;
}

module.exports = { createWhatsAppRoutes };
