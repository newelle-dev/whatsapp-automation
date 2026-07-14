const fs = require('fs');
const {
    DEFAULT_TEMPLATE,
    LAST_VISIT_TEMPLATE_FILE
} = require('../parsers/columnNames');
const { renderLastVisitTemplate } = require('../campaigns/lastVisitCampaign');
const { resolveOutletContext } = require('../config/outlets');

function replaceTemplateTokens(template, replacements) {
    return Object.entries(replacements).reduce((nextTemplate, [token, value]) => (
        nextTemplate.replace(new RegExp(`\\{\\{${token}\\}\\}`, 'g'), value == null ? '' : String(value))
    ), template);
}

function getAppointmentTemplateReplacements(payload = {}) {
    const outlet = resolveOutletContext(payload);

    return {
        name: payload.displayName || payload.name || 'Client',
        service: payload.service || 'your appointment',
        time: payload.time || 'the scheduled time',
        date: payload.date || 'the scheduled date',
        day: payload.day || 'the scheduled day',
        outletName: outlet.name,
        outletMapLink: outlet.mapLink
    };
}

function prepareTemplate(payload, templateFile) {
    const template = fs.existsSync(templateFile)
        ? fs.readFileSync(templateFile, 'utf8')
        : DEFAULT_TEMPLATE;

    return replaceTemplateTokens(template, getAppointmentTemplateReplacements(payload));
}

function prepareLastVisitTemplate(payload, templateFile = LAST_VISIT_TEMPLATE_FILE) {
    return renderLastVisitTemplate(payload, templateFile);
}

module.exports = {
    prepareTemplate,
    prepareLastVisitTemplate,
    replaceTemplateTokens,
    getAppointmentTemplateReplacements
};
