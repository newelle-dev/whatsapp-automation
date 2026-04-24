const { parsePhoneNumberFromString } = require('libphonenumber-js');

const serviceKeywords = {
    'Hair': ['cut', 'color', 'root', 'balayage', 'wash & blow', 'hair', 'head spa', 'styling'],
    'Lashes': ['lash', 'eyelash'],
    'Brows': ['eyebrow', 'brow', 'embroidery'],
    'Nails': ['manicure', 'pedicure', 'nail', 'gel color', 'gel polish']
};

function simplifyService(serviceName) {
    if (!serviceName) return '';
    const lowerName = serviceName.toLowerCase();
    for (const [category, keywords] of Object.entries(serviceKeywords)) {
        if (keywords.some(kw => lowerName.includes(kw))) {
            return category;
        }
    }
    return serviceName.trim();
}

function parseTimeStr(timeStr) {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toLowerCase();
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

function formatPhone(rawNumber, appendCus = true) {
    if (!rawNumber) return null;
    const phoneNumber = parsePhoneNumberFromString(rawNumber, 'MY');
    let formatted = null;
    
    if (phoneNumber && phoneNumber.isValid()) {
        formatted = phoneNumber.number.replace('+', '');
    } else {
        let fallback = rawNumber.toString().replace(/\D/g, '');
        if (fallback.startsWith('0')) fallback = '60' + fallback.substring(1);
        if (fallback.length >= 10) {
            formatted = fallback;
        }
    }

    if (formatted && appendCus) {
        return `${formatted}@c.us`;
    }
    return formatted;
}

module.exports = {
    simplifyService,
    parseTimeStr,
    formatPhone
};
