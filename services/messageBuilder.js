const {
    prepareTemplate,
    prepareLastVisitTemplate,
    TEMPLATE_FILE,
    LAST_VISIT_TEMPLATE_FILE
} = require('./csvProcessor');

function buildMessageForItem(item) {
    if (item?.source === 'last-visit') {
        return prepareLastVisitTemplate(item, LAST_VISIT_TEMPLATE_FILE);
    }

    return prepareTemplate(item, TEMPLATE_FILE);
}

module.exports = { buildMessageForItem };
