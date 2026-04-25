const { DAY_IN_MS } = require('../parsers/columnNames');

function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateDMY(dateValue) {
    if (!dateValue) return null;

    const match = String(dateValue).trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return null;

    const [, day, month, year] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));

    if (Number.isNaN(parsed.getTime())) return null;

    return parsed;
}

function diffInDays(earlierDate, laterDate) {
    return Math.round((startOfLocalDay(laterDate).getTime() - startOfLocalDay(earlierDate).getTime()) / DAY_IN_MS);
}

module.exports = {
    startOfLocalDay,
    parseDateDMY,
    diffInDays
};
