const { readClients } = require('./parsers/clientParser');
const { processAppointments } = require('./campaigns/appointmentCampaign');
const { processLastVisitCampaign } = require('./campaigns/lastVisitCampaign');
const { prepareTemplate, prepareLastVisitTemplate } = require('./templates/templateRenderer');
const { readTemplate, writeTemplate } = require('./templates/templateManager');
const {
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
    LAST_VISIT_BRANCH_COL
} = require('./parsers/columnNames');
const { parseDateDMY, diffInDays } = require('./utils/dateUtils');

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
