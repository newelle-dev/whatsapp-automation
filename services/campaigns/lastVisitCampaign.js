const fs = require('fs');
const csv = require('csv-parser');
const { formatPhone } = require('../../utils/formatter');
const {
    LAST_VISIT_TEMPLATE_FILE,
    LAST_VISIT_DEFAULT_TEMPLATE,
    LAST_VISIT_NAME_COL,
    LAST_VISIT_CODE_COL,
    LAST_VISIT_PHONE_COL,
    LAST_VISIT_DATE_COL,
    LAST_VISIT_BRANCH_COL
} = require('../parsers/columnNames');
const { startOfLocalDay, parseDateDMY, diffInDays } = require('../utils/dateUtils');

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

module.exports = {
    getLastVisitTemplate,
    renderLastVisitTemplate,
    processLastVisitCampaign
};
