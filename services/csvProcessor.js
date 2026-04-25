const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { simplifyService, parseTimeStr, formatPhone } = require('../utils/formatter');

const TEMPLATE_FILE = path.join(__dirname, '..', 'message-template.txt');
const LAST_VISIT_TEMPLATE_FILE = path.join(__dirname, '..', 'message-template-last-visit.txt');
const DEFAULT_TEMPLATE = 'Hello {{name}}, this is a reminder for {{service}} on {{date}} at {{time}}.';
const LAST_VISIT_DEFAULT_TEMPLATE = `Hi {{name}},

We're just checking in to see how your recent service experience was. We hope you're enjoying the results 😊

If you're planning your next visit, we'd be happy to assist with an advance booking for your convenience.

Feel free to share your preferred date and time, and we can also update you on any ongoing promotions.`;
const NAME_COL = 'Full Name';
const PHONE_COL = 'Mobile Number';
const APP_NAME_COL = 'Client';
const SERVICE_COL = 'Service';
const TIME_COL = 'Time';
const DATE_COL = 'Scheduled Date';
const LAST_VISIT_NAME_COL = 'Name';
const LAST_VISIT_CODE_COL = 'Code';
const LAST_VISIT_PHONE_COL = 'Telephone (Mobile)';
const LAST_VISIT_DATE_COL = 'Last Visit';
const LAST_VISIT_BRANCH_COL = 'Branch';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateDMY(dateValue) {
    if (!dateValue) return null;

    const match = String(dateValue).trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return null;

    const [, day, month, year] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));

    if (Number.isNaN(parsed.getTime())) return null;

    return parsed;
}

function diffInDays(earlierDate, laterDate) {
    return Math.round((startOfLocalDay(laterDate).getTime() - startOfLocalDay(earlierDate).getTime()) / DAY_IN_MS);
}

function getLastVisitTemplate(templateFile = LAST_VISIT_TEMPLATE_FILE) {
    if (!fs.existsSync(templateFile)) {
        return LAST_VISIT_DEFAULT_TEMPLATE;
    }

    return fs.readFileSync(templateFile, 'utf8');
}

function renderLastVisitTemplate(payload, templateFile = LAST_VISIT_TEMPLATE_FILE) {
    let template = getLastVisitTemplate(templateFile);
    template = template.replace(/\{\{name\}\}/g, payload.displayName || payload.name || 'Client');
    template = template.replace(/\{\{lastVisitDate\}\}/g, payload.lastVisitDate || '');
    template = template.replace(/\{\{daysSinceVisit\}\}/g, String(payload.daysSinceVisit || 7));
    template = template.replace(/\{\{branch\}\}/g, payload.branch || '');
    return template;
}

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

function processLastVisitCampaign(filePath) {
    return new Promise((resolve, reject) => {
        const sendingQueue = [];
        const manualReviewQueue = [];
        const groupedCustomers = new Map();

        if (!fs.existsSync(filePath)) {
            return resolve({ sendingQueue, manualReviewQueue });
        }

        let skipLines = 0;
        try {
            const initialLines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
            if ((initialLines[0] || '').trim() === '') {
                skipLines = 1;
            }

            const markerLine = (initialLines[skipLines] || '').replace(/"/g, '').trim().toLowerCase();
            if (markerLine === 'last visit') {
                skipLines += 1;
            }
        } catch (err) {
            // Fall back to zero skipped lines when probing metadata fails.
            skipLines = 0;
        }

        const today = startOfLocalDay(new Date());

        fs.createReadStream(filePath)
            .pipe(csv({ skipLines }))
            .on('data', (row) => {
                const name = row[LAST_VISIT_NAME_COL]?.trim();
                const code = row[LAST_VISIT_CODE_COL]?.trim();
                const rawPhone = row[LAST_VISIT_PHONE_COL]?.trim();
                const lastVisitRaw = row[LAST_VISIT_DATE_COL]?.trim();

                if (!name || /^grand total$/i.test(name)) return;

                const lastVisitDate = parseDateDMY(lastVisitRaw);
                if (!lastVisitDate) return;

                const daysSinceVisit = diffInDays(lastVisitDate, today);
                if (daysSinceVisit !== 7) return;

                const normalizedName = name.replace(/\s+/g, ' ').trim();
                const customerKey = code ? `code:${code}` : `name:${normalizedName.toLowerCase()}`;

                if (!groupedCustomers.has(customerKey)) {
                    groupedCustomers.set(customerKey, {
                        name: normalizedName,
                        code,
                        phones: new Set(),
                        branch: row[LAST_VISIT_BRANCH_COL]?.trim() || '',
                        lastVisitDate: lastVisitRaw,
                        daysSinceVisit,
                        rows: []
                    });
                }

                const customer = groupedCustomers.get(customerKey);
                customer.rows.push(row);

                if (rawPhone) {
                    const formattedPhone = formatPhone(rawPhone);
                    if (formattedPhone) {
                        customer.phones.add(formattedPhone);
                    }
                }

                if (!customer.branch && row[LAST_VISIT_BRANCH_COL]) {
                    customer.branch = row[LAST_VISIT_BRANCH_COL].trim();
                }

                if (!customer.lastVisitDate && lastVisitRaw) {
                    customer.lastVisitDate = lastVisitRaw;
                }
            })
            .on('end', () => {
                for (const customer of groupedCustomers.values()) {
                    const phones = Array.from(customer.phones);
                    const payload = {
                        name: customer.name,
                        displayName: customer.name,
                        phone: phones[0],
                        branch: customer.branch,
                        lastVisitDate: customer.lastVisitDate,
                        daysSinceVisit: customer.daysSinceVisit,
                        originalData: customer.rows[0],
                        source: 'last-visit'
                    };

                    if (phones.length === 1) {
                        sendingQueue.push(payload);
                    } else if (phones.length > 1) {
                        manualReviewQueue.push({
                            ...payload,
                            reason: `Collision: Multiple phone numbers found for ${customer.name}`,
                            candidates: phones
                        });
                    } else {
                        manualReviewQueue.push({
                            ...payload,
                            reason: `No valid phone number found for ${customer.name}`
                        });
                    }
                }

                resolve({ sendingQueue, manualReviewQueue });
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
        return DEFAULT_TEMPLATE
            .replace(/\{\{name\}\}/g, payload.displayName)
            .replace(/\{\{service\}\}/g, payload.service)
            .replace(/\{\{time\}\}/g, payload.time)
            .replace(/\{\{date\}\}/g, payload.date)
            .replace(/\{\{day\}\}/g, payload.day);
    }
    let template = fs.readFileSync(templateFile, 'utf8');
    template = template.replace(/\{\{name\}\}/g, payload.displayName);
    template = template.replace(/\{\{service\}\}/g, payload.service);
    template = template.replace(/\{\{time\}\}/g, payload.time);
    template = template.replace(/\{\{date\}\}/g, payload.date);
    template = template.replace(/\{\{day\}\}/g, payload.day);
    return template;
}

function prepareLastVisitTemplate(payload, templateFile = LAST_VISIT_TEMPLATE_FILE) {
    return renderLastVisitTemplate(payload, templateFile);
}

function readTemplate(templateFile = TEMPLATE_FILE) {
    if (!fs.existsSync(templateFile)) {
        return DEFAULT_TEMPLATE;
    }

    return fs.readFileSync(templateFile, 'utf8');
}

async function writeTemplate(templateContent, templateFile = TEMPLATE_FILE) {
    await fs.promises.writeFile(templateFile, templateContent, 'utf8');
}

module.exports = {
    readClients,
    processAppointments,
    processLastVisitCampaign,
    prepareTemplate,
    prepareLastVisitTemplate,
    readTemplate,
    writeTemplate,
    DEFAULT_TEMPLATE,
    LAST_VISIT_TEMPLATE_FILE,
    LAST_VISIT_DEFAULT_TEMPLATE,
    TEMPLATE_FILE,
    NAME_COL,
    PHONE_COL,
    APP_NAME_COL,
    SERVICE_COL,
    TIME_COL,
    DATE_COL,
    LAST_VISIT_NAME_COL,
    LAST_VISIT_CODE_COL,
    LAST_VISIT_PHONE_COL,
    LAST_VISIT_DATE_COL,
    LAST_VISIT_BRANCH_COL,
    parseDateDMY,
    diffInDays
};
