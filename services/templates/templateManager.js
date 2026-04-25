const fs = require('fs');
const { TEMPLATE_FILE, DEFAULT_TEMPLATE } = require('../parsers/columnNames');

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
    readTemplate,
    writeTemplate
};
