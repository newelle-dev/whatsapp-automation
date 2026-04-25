const fs = require('fs');
const {
    DEFAULT_TEMPLATE,
    LAST_VISIT_TEMPLATE_FILE
} = require('../parsers/columnNames');
const { renderLastVisitTemplate } = require('../campaigns/lastVisitCampaign');

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

module.exports = {
    prepareTemplate,
    prepareLastVisitTemplate
};
