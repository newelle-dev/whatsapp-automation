const qrcodeUrl = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const INITIALIZE_RETRY_DELAY_MS = 1500;
const INITIALIZE_MAX_ATTEMPTS = 2;

function firstExistingPath(candidates) {
    return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

function resolveBrowserExecutablePath() {
    const envPath = firstExistingPath([
        process.env.PUPPETEER_EXECUTABLE_PATH,
        process.env.CHROME_BIN,
        process.env.GOOGLE_CHROME_BIN,
        process.env.EDGE_BIN
    ]);

    if (envPath) {
        return envPath;
    }

    if (process.platform !== 'win32') {
        return null;
    }

    return firstExistingPath([
        path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    ]);
}

function addSpawnUnknownHint(error) {
    const message = String(error?.message || error || '');

    if (!message.includes('spawn UNKNOWN')) {
        return error;
    }

    const hint = 'Browser launch failed (spawn UNKNOWN). Ensure Chrome or Edge is installed, set PUPPETEER_EXECUTABLE_PATH if needed, and use a Node.js LTS release.';

    if (error instanceof Error) {
        error.message = `${error.message}. ${hint}`;
        return error;
    }

    return new Error(`${message}. ${hint}`);
}

function createWhatsAppClient() {
    const executablePath = resolveBrowserExecutablePath();

    const puppeteerOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };

    if (executablePath) {
        puppeteerOptions.executablePath = executablePath;
    }

    const authStrategy = new LocalAuth();

    // Patch logout to prevent crash on Windows when session files are locked by Chromium or OneDrive sync
    const originalLogout = authStrategy.logout.bind(authStrategy);
    authStrategy.logout = async function () {
        try {
            await originalLogout();
        } catch (error) {
            console.warn(
                'Warning: Failed to clear session directory during logout. This is common on Windows ' +
                'when files are locked by the browser or cloud sync services (e.g. OneDrive). Error:',
                error.message
            );
        }
    };

    return new Client({
        authStrategy: authStrategy,
        puppeteer: puppeteerOptions
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
                const normalizedError = addSpawnUnknownHint(error);
                const shouldRetry = isTransientInitializeError(error) && attempt < INITIALIZE_MAX_ATTEMPTS;

                console.error(`WhatsApp initialization failed on attempt ${attempt}:`, normalizedError);
                await destroyWhatsAppClient(state);

                if (!shouldRetry) {
                    state.isAuthReady = false;
                    io.emit('ready', false);
                    io.emit('auth', 'failed');
                    throw normalizedError;
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
