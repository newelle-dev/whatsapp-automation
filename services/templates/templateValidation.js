const { OUTLETS, getOutletByKey } = require('../config/outlets');

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isValidHttpUrl(value) {
    if (!isNonEmptyString(value)) {
        return false;
    }

    try {
        const parsedUrl = new URL(value.trim());
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (_error) {
        return false;
    }
}

function hasUnresolvedPlaceholders(messageText) {
    return /\{\{[^{}]+\}\}/.test(String(messageText || ''));
}

function createPreflightError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lintTemplateForHardcodedOutlets(template) {
    const templateText = String(template || '');
    const warnings = [];

    Object.values(OUTLETS).forEach((outlet) => {
        if (outlet?.name) {
            const outletNamePattern = new RegExp(escapeRegExp(outlet.name), 'i');
            if (outletNamePattern.test(templateText)) {
                warnings.push(`Template hardcodes outlet name "${outlet.name}". Use {{outletName}} instead.`);
            }
        }

        if (outlet?.mapLink) {
            const outletMapLinkPattern = new RegExp(escapeRegExp(outlet.mapLink), 'i');
            if (outletMapLinkPattern.test(templateText)) {
                warnings.push(`Template hardcodes a map link for "${outlet.name}". Use {{outletMapLink}} instead.`);
            }
        }
    });

    return warnings;
}

function validateSelectedOutlet(selectedOutletKey) {
    if (!isNonEmptyString(selectedOutletKey)) {
        throw createPreflightError('Outlet is required before sending.');
    }

    const outlet = getOutletByKey(selectedOutletKey);
    if (!outlet) {
        throw createPreflightError(`Unknown outlet "${String(selectedOutletKey).trim()}".`);
    }

    if (!isValidHttpUrl(outlet.mapLink)) {
        throw createPreflightError(`Selected outlet "${outlet.name}" is missing a valid map link.`);
    }

    return outlet;
}

function validateRenderedMessages(queue, buildMessageForItem, selectedOutletKey) {
    if (!Array.isArray(queue) || queue.length === 0) {
        throw createPreflightError('No recipients are selected to send.');
    }

    if (typeof buildMessageForItem !== 'function') {
        throw createPreflightError('Message builder is unavailable for validation.');
    }

    for (const item of queue) {
        const renderedMessage = buildMessageForItem({
            ...item,
            selectedOutletKey
        });

        if (hasUnresolvedPlaceholders(renderedMessage)) {
            throw createPreflightError('Message template has unresolved placeholders.');
        }
    }
}

function validateSendPreflight({ selectedOutletKey, queue, buildMessageForItem }) {
    validateSelectedOutlet(selectedOutletKey);
    validateRenderedMessages(queue, buildMessageForItem, selectedOutletKey);
}

module.exports = {
    lintTemplateForHardcodedOutlets,
    hasUnresolvedPlaceholders,
    isValidHttpUrl,
    validateRenderedMessages,
    validateSelectedOutlet,
    validateSendPreflight
};