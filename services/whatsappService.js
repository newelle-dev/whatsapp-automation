const qrcodeUrl = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

function initializeWhatsApp({ state, io }) {
    state.isAuthReady = false;
    state.whatsappClient = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { headless: true }
    });

    state.whatsappClient.on('qr', async (qr) => {
        try {
            const url = await qrcodeUrl.toDataURL(qr);
            io.emit('qr', url);
        } catch (e) {
            console.error('QR code generation error', e);
        }
    });

    state.whatsappClient.on('ready', () => {
        state.isAuthReady = true;
        io.emit('ready', true);
    });

    state.whatsappClient.on('authenticated', () => {
        io.emit('auth', 'authenticated');
    });

    state.whatsappClient.on('auth_failure', () => {
        io.emit('auth', 'failed');
        state.whatsappClient = null;
    });

    state.whatsappClient.on('disconnected', () => {
        state.isAuthReady = false;
        io.emit('ready', false);
        state.whatsappClient = null;
    });

    state.whatsappClient.initialize();
}

function getWhatsAppStatus(state) {
    if (!state.whatsappClient) {
        return 'none';
    }

    return state.isAuthReady ? 'ready' : 'initializing';
}

module.exports = {
    initializeWhatsApp,
    getWhatsAppStatus
};
