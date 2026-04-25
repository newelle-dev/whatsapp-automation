const fs = require('fs');
const csv = require('csv-parser');
const { simplifyService, parseTimeStr } = require('../../utils/formatter');
const { APP_NAME_COL, SERVICE_COL, TIME_COL, DATE_COL } = require('../parsers/columnNames');

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
                if (!name || row.Status === 'Canceled') return;

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

                    const displayName = name.replace(/class\s*pass/i, '').trim();

                    const simplifiedServices = [...new Set(group.services.map(simplifyService))];
                    const combinedService = simplifiedServices.join(' & ');

                    group.times.sort((a, b) => parseTimeStr(a) - parseTimeStr(b));
                    const earliestTime = group.times[0] || '';

                    const payload = {
                        name,
                        displayName,
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

module.exports = {
    processAppointments
};
