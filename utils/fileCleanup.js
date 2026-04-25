const fs = require('fs');

function removeTempFile(filePath, options = {}) {
    const { logErrors = false } = options;

    if (!filePath) {
        return;
    }

    try {
        fs.unlinkSync(filePath);
    } catch (err) {
        if (logErrors) {
            console.error('Error deleting temp file:', err);
        }
    }
}

module.exports = { removeTempFile };
