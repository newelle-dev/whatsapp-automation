const fs = require('fs');
const csv = require('csv-parser');
const { formatPhone } = require('../../utils/formatter');
const { NAME_COL, PHONE_COL } = require('./columnNames');

function readClients(filePath) {
    const clientMap = new Map();
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) return resolve([]);
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const name = row[NAME_COL]?.trim();
                const rawPhone = row[PHONE_COL]?.trim();
                if (name && rawPhone) {
                    const formatted = formatPhone(rawPhone);
                    if (formatted) {
                        if (!clientMap.has(name)) clientMap.set(name, new Set());
                        clientMap.get(name).add(formatted);
                    }
                }
            })
            .on('end', () => {
                const result = Array.from(clientMap.entries()).map(([name, phonesSet]) => ({
                    name,
                    phones: Array.from(phonesSet)
                }));
                resolve(result);
            })
            .on('error', reject);
    });
}

module.exports = {
    readClients
};
