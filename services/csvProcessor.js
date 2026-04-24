const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { simplifyService, parseTimeStr, formatPhone } = require('../utils/formatter');

const TEMPLATE_FILE = path.join(__dirname, '..', 'message-template.txt');
const NAME_COL = 'Full Name';
const PHONE_COL = 'Mobile Number';
const APP_NAME_COL = 'Client';
const SERVICE_COL = 'Service';
const TIME_COL = 'Time';
const DATE_COL = 'Scheduled Date';

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

function processAppointments(filePath, clientMap) {
    return new Promise((resolve, reject) => {
        const sendingQueue = [];
        const manualReviewQueue = [];
        const groupedAppointments = new Map();

        if (!fs.existsSync(filePath)) {
            return resolve({ sendingQueue, manualReviewQueue });
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const name = row[APP_NAME_COL]?.trim();
                if (!name || row['Status'] === 'Canceled') return;

                const dateStr = row[DATE_COL] || '';
                const groupKey = `${name}|${dateStr}`;

                if (!groupedAppointments.has(groupKey)) {
                    groupedAppointments.set(groupKey, {
                        name,
                        dateStr,
                        services: [],
                        times: [],
                        originalData: row
                    });
                }
                
                const group = groupedAppointments.get(groupKey);
                if (row[SERVICE_COL]) group.services.push(row[SERVICE_COL]);
                if (row[TIME_COL]) group.times.push(row[TIME_COL]);
            })
            .on('end', () => {
                for (const group of groupedAppointments.values()) {
                    const name = group.name;
                    const phonesSet = clientMap.get(name);
                    const phones = phonesSet ? Array.from(phonesSet) : [];

                    const dateStr = group.dateStr;
                    let dayName = '';
                    if (dateStr) {
                        const dateObj = new Date(dateStr);
                        if (!isNaN(dateObj.getTime())) {
                            dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                        }
                    }

                    let displayName = name.replace(/class\s*pass/i, '').trim();

                    const simplifiedServices = [...new Set(group.services.map(simplifyService))];
                    const combinedService = simplifiedServices.join(' & ');

                    group.times.sort((a, b) => parseTimeStr(a) - parseTimeStr(b));
                    const earliestTime = group.times[0] || '';

                    const payload = {
                        name: name,
                        displayName: displayName,
                        service: combinedService,
                        time: earliestTime,
                        date: dateStr,
                        day: dayName,
                        originalData: group.originalData
                    };

                    if (phones.length === 1) {
                        payload.phone = phones[0];
                        sendingQueue.push(payload);
                    } else if (phones.length > 1) {
                        payload.reason = `Collision: Multiple phone numbers found for ${name}`;
                        payload.candidates = phones;
                        manualReviewQueue.push(payload);
                    } else {
                        payload.reason = `No valid phone number found for ${name}`;
                        manualReviewQueue.push(payload);
                    }
                }
                resolve({ sendingQueue, manualReviewQueue });
            })
            .on('error', reject);
    });
}

function prepareTemplate(payload, templateFile) {
    if (!fs.existsSync(templateFile)) {
        return `Hello ${payload.displayName}, this is a reminder for ${payload.service} on ${payload.date} at ${payload.time}.`;
    }
    let template = fs.readFileSync(templateFile, 'utf8');
    template = template.replace(/\{\{name\}\}/g, payload.displayName);
    template = template.replace(/\{\{service\}\}/g, payload.service);
    template = template.replace(/\{\{time\}\}/g, payload.time);
    template = template.replace(/\{\{date\}\}/g, payload.date);
    template = template.replace(/\{\{day\}\}/g, payload.day);
    return template;
}

module.exports = {
    readClients,
    processAppointments,
    prepareTemplate,
    TEMPLATE_FILE,
    NAME_COL,
    PHONE_COL,
    APP_NAME_COL,
    SERVICE_COL,
    TIME_COL,
    DATE_COL
};
