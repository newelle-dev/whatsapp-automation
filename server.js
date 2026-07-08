const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { formatPhone } = require('./utils/formatter');
const {
    readClients,
    processAppointments,
    processLastVisitCampaign,
    readTemplate,
    writeTemplate,
    TEMPLATE_FILE,
    LAST_VISIT_TEMPLATE_FILE,
    LAST_VISIT_DEFAULT_TEMPLATE,
    DEFAULT_TEMPLATE
} = require('./services/csvProcessor');
const { readClientData, writeClientData } = require('./services/clientDataStore');
const state = require('./state/appState');
const { buildMessageForItem } = require('./services/messageBuilder');
const { createLoggingService } = require('./services/loggingService');
const { removeTempFile } = require('./utils/fileCleanup');
const { createClientRoutes } = require('./routes/clientRoutes');
const { createTemplateRoutes } = require('./routes/templateRoutes');
const { createUploadRoutes } = require('./routes/uploadRoutes');
const { createResolveRoutes } = require('./routes/resolveRoutes');
const { createWhatsAppRoutes } = require('./routes/whatsappRoutes');
const { createSendingRoutes } = require('./routes/sendingRoutes');

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
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = new Set(['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/plain']);
        const hasCsvExtension = path.extname(file.originalname || '').toLowerCase() === '.csv';
        const hasAcceptedMime = allowedMimeTypes.has((file.mimetype || '').toLowerCase());

        if (!hasCsvExtension && !hasAcceptedMime) {
            return cb(new Error('Only CSV files are allowed.'));
        }

        return cb(null, true);
    }
});

const { addLog, resetLogs } = createLoggingService(io, state);

(async () => {
    try {
        const clients = await readClientData();
        state.clientMap.clear();
        clients.forEach((client) => state.clientMap.set(client.name, new Set(client.phones)));
        addLog(`Loaded ${state.clientMap.size} clients from persistent storage.`);
    } catch (err) {
        addLog(`Error loading client data: ${err.message}`);
    }
})();

app.use(createClientRoutes({
    upload,
    state,
    addLog,
    readClients,
    writeClientData,
    removeTempFile
}));

app.use(createTemplateRoutes({
    state,
    addLog,
    buildMessageForItem,
    readTemplate,
    writeTemplate,
    TEMPLATE_FILE,
    LAST_VISIT_TEMPLATE_FILE,
    LAST_VISIT_DEFAULT_TEMPLATE,
    DEFAULT_TEMPLATE
}));

app.use(createUploadRoutes({
    upload,
    state,
    addLog,
    buildMessageForItem,
    processAppointments,
    processLastVisitCampaign,
    removeTempFile
}));

app.use(createResolveRoutes({
    state,
    addLog,
    buildMessageForItem,
    formatPhone,
    readClientData,
    writeClientData
}));

app.use(createWhatsAppRoutes({ state, io }));
app.use(createSendingRoutes({ state, io, addLog, resetLogs, buildMessageForItem }));

app.use((err, req, res, next) => {
    if (!err) {
        return next();
    }

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'CSV file is too large. Maximum allowed size is 5MB.' });
        }

        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }

    if (err.message === 'Only CSV files are allowed.') {
        return res.status(400).json({ error: err.message });
    }

    return next(err);
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
