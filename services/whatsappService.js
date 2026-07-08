const qrcodeUrl = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const INITIALIZE_RETRY_DELAY_MS = 1500;
const INITIALIZE_MAX_ATTEMPTS = 2;

function createWhatsAppClient() {
    return new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        }
    });
}

function isTransientInitializeError(error) {
    const message = String(error?.message || error || '');

    return message.includes('Execution context was destroyed') || message.includes('most likely because of a navigation');
}

async function destroyWhatsAppClient(state) {
    const client = state.whatsappClient;

    if (!client) {
        return;
    }

    try {
        await client.destroy();
    } catch (error) {
        // Ignore shutdown errors during retry or cleanup.
    }

    if (state.whatsappClient === client) {
        state.whatsappClient = null;
    }
}

function registerWhatsAppClientListeners(client, { state, io }) {
    client.on('qr', async (qr) => {
        try {
            const url = await qrcodeUrl.toDataURL(qr);
            io.emit('qr', url);
        } catch (e) {
            console.error('QR code generation error', e);
        }
    });

    client.on('ready', () => {
        if (state.whatsappClient === client) {
            state.isAuthReady = true;
        }
        io.emit('ready', true);
    });

    client.on('authenticated', () => {
        io.emit('auth', 'authenticated');
    });

    client.on('auth_failure', () => {
        io.emit('auth', 'failed');
        state.isAuthReady = false;

        if (state.whatsappClient === client) {
            state.whatsappClient = null;
        }
    });

    client.on('disconnected', () => {
        state.isAuthReady = false;
        io.emit('ready', false);

        if (state.whatsappClient === client) {
            state.whatsappClient = null;
        }
    });
}

async function initializeWhatsApp({ state, io }) {
    if (state.whatsappInitPromise) {
        return state.whatsappInitPromise;
    }

    state.isAuthReady = false;

    state.whatsappInitPromise = (async () => {
        for (let attempt = 1; attempt <= INITIALIZE_MAX_ATTEMPTS; attempt += 1) {
            const client = createWhatsAppClient();
            state.whatsappClient = client;
            registerWhatsAppClientListeners(client, { state, io });

            try {
                await client.initialize();
                return client;
            } catch (error) {
                const shouldRetry = isTransientInitializeError(error) && attempt < INITIALIZE_MAX_ATTEMPTS;

                console.error(`WhatsApp initialization failed on attempt ${attempt}:`, error);
                await destroyWhatsAppClient(state);

                if (!shouldRetry) {
                    state.isAuthReady = false;
                    io.emit('ready', false);
                    io.emit('auth', 'failed');
                    throw error;
                }

                await new Promise((resolve) => setTimeout(resolve, INITIALIZE_RETRY_DELAY_MS));
            }
        }
    })().finally(() => {
        state.whatsappInitPromise = null;
    });

    return state.whatsappInitPromise;
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
