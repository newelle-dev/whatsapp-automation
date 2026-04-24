const fs = require('fs');
const path = require('path');

const CLIENTS_FILE = path.join(__dirname, '../data/clients.json');

// Initialize clients.json if it doesn't exist
if (!fs.existsSync(CLIENTS_FILE)) {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify([]), 'utf8');
}

const readClientData = async () => {
    try {
        const data = await fs.promises.readFile(CLIENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading client data:', error);
        return [];
    }
};

const writeClientData = async (clients) => {
    try {
        await fs.promises.writeFile(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing client data:', error);
    }
};

module.exports = {
    readClientData,
    writeClientData
};
