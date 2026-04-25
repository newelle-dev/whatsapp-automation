const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const qrcodeUrl = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { formatPhone } = require('./utils/formatter');
const { 
    readClients, // This is still needed for parsing CSV, but the storage will be separate
    processAppointments, 
    processLastVisitCampaign,
    prepareTemplate,
    prepareLastVisitTemplate,
    readTemplate,
    writeTemplate,
    TEMPLATE_FILE,
    LAST_VISIT_TEMPLATE_FILE,
    LAST_VISIT_DEFAULT_TEMPLATE,
    DEFAULT_TEMPLATE
} = require('./services/csvProcessor');
const { readClientData, writeClientData } = require('./services/clientDataStore'); // New import

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Set up Multer for file uploads
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadFolder),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// State
let whatsappClient = null;
let clientMap = new Map(); // This will now be loaded from clientDataStore
let sendingQueue = [];
let manualReviewQueue = [];
let currentLog = [];
let isAuthReady = false;
let isSending = false;

// Load client data on startup
(async () => {
    try {
        const clients = await readClientData();
        clientMap.clear();
        clients.forEach(client => clientMap.set(client.name, new Set(client.phones)));
        addLog(`Loaded ${clientMap.size} clients from persistent storage.`);
    } catch (err) {
        addLog(`Error loading client data: ${err.message}`);
    }
})();

const sleep = (min = 15000, max = 45000) => {
    const ms = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, ms));
};

function buildMessageForItem(item) {
    if (item?.source === 'last-visit') {
        return prepareLastVisitTemplate(item, LAST_VISIT_TEMPLATE_FILE);
    }
    return prepareTemplate(item, TEMPLATE_FILE);
}

// Emits socket event
function addLog(msg) {
    console.log(msg);
    currentLog.push({ time: new Date().toLocaleTimeString(), msg });
    io.emit('log', currentLog);
}

// API Endpoints

app.post('/api/upload-clients', upload.single('clientsCsv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Client CSV file is required.' });
        }

        const newClients = await readClients(req.file.path);
        await writeClientData(newClients); // Persist the new client data

        clientMap.clear(); // Clear existing clients
        newClients.forEach(client => clientMap.set(client.name, new Set(client.phones))); // Populate with new clients

        // Delete the temporary file after processing
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr);
        }

        addLog(`Updated client list with ${clientMap.size} entries. Temporary file deleted.`);
        res.json({ message: `Client list updated with ${clientMap.size} entries.`, clientCount: clientMap.size });
    } catch (err) {
        console.error('Error uploading client CSV:', err);
        // Attempt to clean up even on error
        if (req.file) fs.unlinkSync(req.file.path).catch(() => {});
        res.status(500).json({ error: 'Failed to upload client CSV.' });
    }
});

app.delete('/api/clients', async (req, res) => {
    try {
        await writeClientData([]);
        clientMap.clear();
        addLog('Client list cleared from persistent storage.');
        res.json({ message: 'Client list cleared successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear client list.' });
    }
});

app.get('/api/template', (req, res) => {
    try {
        const campaign = req.query.campaign === 'last-visit' ? 'last-visit' : 'appointments';
        const templateFile = campaign === 'last-visit' ? LAST_VISIT_TEMPLATE_FILE : TEMPLATE_FILE;
        const fallbackTemplate = campaign === 'last-visit' ? LAST_VISIT_DEFAULT_TEMPLATE : DEFAULT_TEMPLATE;
        const template = readTemplate(templateFile) || fallbackTemplate;
        res.json({ template });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load message template.' });
    }
});

app.post('/api/template', async (req, res) => {
    try {
        const { template, campaign } = req.body;
        const campaignType = campaign === 'last-visit' ? 'last-visit' : 'appointments';
        const templateFile = campaignType === 'last-visit' ? LAST_VISIT_TEMPLATE_FILE : TEMPLATE_FILE;

        if (typeof template !== 'string') {
            return res.status(400).json({ error: 'Template must be a string.' });
        }

        await writeTemplate(template, templateFile);

        // Refresh queued message previews so UI reflects the latest template immediately.
        sendingQueue = sendingQueue.map((item) => ({
            ...item,
            message: buildMessageForItem(item)
        }));

        manualReviewQueue = manualReviewQueue.map((item) => ({
            ...item,
            message: buildMessageForItem(item)
        }));

        addLog('Message template updated successfully.');
        res.json({
            message: 'Template updated successfully.',
            template,
            campaign: campaignType,
            sendingQueue,
            manualReviewQueue
        });
    } catch (err) {
        console.error('Error saving message template:', err);
        res.status(500).json({ error: 'Failed to save message template.' });
    }
});

app.post('/api/resolve-issues', async (req, res) => {
    try {
        const { resolved } = req.body; // [{ name, phone }]
        if (!resolved || !Array.isArray(resolved)) {
            return res.status(400).json({ error: 'Invalid data format. Expected array of resolved clients.' });
        }

        // Build a lookup: name -> formatted phone
        const resolvedMap = new Map();
        resolved.forEach(({ name, phone }) => {
            if (!name || !phone) return;
            const formatted = formatPhone(phone);
            if (formatted) resolvedMap.set(name, formatted);
        });

        // Move resolved items from manualReviewQueue to sendingQueue
        const stillUnresolved = [];
        for (const item of manualReviewQueue) {
            const phone = resolvedMap.get(item.name);
            if (phone) {
                item.phone = phone;
                item.message = buildMessageForItem(item);
                sendingQueue.push(item);
            } else {
                stillUnresolved.push(item);
            }
        }
        manualReviewQueue = stillUnresolved;

        // Also persist the resolved phones into clientDataStore for future runs
        const existingClients = await readClientData();
        for (const [name, phone] of resolvedMap.entries()) {
            let existing = existingClients.find(c => c.name === name);
            if (existing) {
                if (!existing.phones.includes(phone)) {
                    existing.phones.push(phone);
                }
            } else {
                existingClients.push({ name, phones: [phone] });
            }
            // Update in-memory map too
            if (!clientMap.has(name)) clientMap.set(name, new Set());
            clientMap.get(name).add(phone);
        }
        await writeClientData(existingClients);

        addLog(`Resolved ${resolvedMap.size} clients. Sending queue: ${sendingQueue.length}, remaining issues: ${manualReviewQueue.length}`);
        res.json({ sendingQueue, manualReviewQueue });
    } catch (err) {
        console.error('Error resolving issues:', err);
        res.status(500).json({ error: 'Failed to resolve issues.' });
    }
});

app.post('/api/upload', upload.single('appointmentsCsv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Appointments CSV file is required.' });
        }

        if (clientMap.size === 0) {
            // Still delete the file if we can't process it due to missing clients
            try { fs.unlinkSync(req.file.path); } catch(e) {}
            return res.status(400).json({ error: 'Client list is empty. Please upload the client list first.' });
        }

        const processed = await processAppointments(req.file.path, clientMap);
        
        sendingQueue = processed.sendingQueue.map(item => ({
            ...item,
            message: buildMessageForItem(item)
        }));
        manualReviewQueue = processed.manualReviewQueue;

        // Delete the temporary file after processing
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr);
        }

        res.json({
            sendingQueue,
            manualReviewQueue
        });
    } catch (err) {
        console.error('Error uploading appointments CSV:', err);
        if (req.file) try { fs.unlinkSync(req.file.path); } catch(e) {}
        res.status(500).json({ error: 'Failed to upload appointments CSV.' });
    }
});

app.post('/api/upload-last-visit', upload.single('lastVisitCsv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Last Visit CSV file is required.' });
        }

        const processed = await processLastVisitCampaign(req.file.path);

        sendingQueue = processed.sendingQueue.map(item => ({
            ...item,
            message: buildMessageForItem(item)
        }));
        manualReviewQueue = processed.manualReviewQueue.map(item => ({
            ...item,
            message: buildMessageForItem(item)
        }));

        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr);
        }

        addLog(`Processed last-visit campaign with ${sendingQueue.length} sendable customers and ${manualReviewQueue.length} manual review items.`);

        res.json({
            sendingQueue,
            manualReviewQueue,
            campaign: 'last-visit'
        });
    } catch (err) {
        console.error('Error uploading last visit CSV:', err);
        if (req.file) try { fs.unlinkSync(req.file.path); } catch(e) {}
        res.status(500).json({ error: 'Failed to process Last Visit CSV.' });
    }
});

app.post('/api/init-whatsapp', (req, res) => {
    if (whatsappClient) {
        if (isAuthReady) {
            return res.json({ status: 'ready' });
        }
        return res.json({ status: 'initializing' });
    }

    isAuthReady = false;
    whatsappClient = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { headless: true }
    });

    whatsappClient.on('qr', async (qr) => {
        try {
            const url = await qrcodeUrl.toDataURL(qr);
            io.emit('qr', url);
        } catch (e) {
            console.error('QR code generation error', e);
        }
    });

    whatsappClient.on('ready', () => {
        isAuthReady = true;
        io.emit('ready', true);
    });

    whatsappClient.on('authenticated', () => {
        io.emit('auth', 'authenticated');
    });

    whatsappClient.on('auth_failure', () => {
        io.emit('auth', 'failed');
        whatsappClient = null;
    });

    whatsappClient.on('disconnected', () => {
        isAuthReady = false;
        io.emit('ready', false);
        whatsappClient = null;
    });

    whatsappClient.initialize();
    res.json({ status: 'initializing' });
});

app.get('/api/whatsapp-status', (req, res) => {
    if (!whatsappClient) return res.json({ status: 'none' });
    return res.json({ status: isAuthReady ? 'ready' : 'initializing' });
});

app.post('/api/start-sending', async (req, res) => {
    if (!isAuthReady) {
        return res.status(400).json({ error: 'WhatsApp is not ready' });
    }
    if (isSending) {
        return res.status(400).json({ error: 'Already sending messages' });
    }

    isSending = true;
    currentLog = [];
    addLog('Starting execution flow...');

    res.json({ status: 'started', total: sendingQueue.length });

    (async () => {
        for (let i = 0; i < sendingQueue.length; i++) {
            const item = sendingQueue[i];
            try {
                const messageText = buildMessageForItem(item);
                addLog(`[${i + 1}/${sendingQueue.length}] Sending to ${item.name} (${item.phone})...`);

                await whatsappClient.sendMessage(item.phone, messageText);

                addLog(`Success! Messages sent: ${i + 1}/${sendingQueue.length}`);
            } catch (error) {
                addLog(`ERROR: Failed to send to ${item.name} (${item.phone}) - ${error.message}`);
                manualReviewQueue.push({ ...item, reason: 'API Error', error: error.message });
            } finally {
                // Progress should reflect processed recipients, not only successful sends.
                io.emit('progress', { current: i + 1, total: sendingQueue.length });

                if (i < sendingQueue.length - 1) {
                    addLog('Waiting randomized delay (15s - 45s) to avoid spam flags...');
                    await sleep(15000, 45000);
                }
            }
        }

        isSending = false;
        addLog('=== FINISHED SENDING ===');
        io.emit('completed', manualReviewQueue);
    })();
});

// Serve frontend if running in prod (built mode)
const frontendPath = path.join(__dirname, 'frontend/dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get(/.*/, (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
