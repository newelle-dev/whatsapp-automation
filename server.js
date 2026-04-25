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
const upload = multer({ storage });

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
