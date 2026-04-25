const path = require('path');

const TEMPLATE_FILE = path.join(__dirname, '..', '..', 'message-template.txt');
const LAST_VISIT_TEMPLATE_FILE = path.join(__dirname, '..', '..', 'message-template-last-visit.txt');
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

module.exports = {
    TEMPLATE_FILE,
    LAST_VISIT_TEMPLATE_FILE,
    DEFAULT_TEMPLATE,
    LAST_VISIT_DEFAULT_TEMPLATE,
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
    DAY_IN_MS
};
