const OUTLETS = Object.freeze({
    bangsar: Object.freeze({
        key: 'bangsar',
        name: '176 Avenue @ Bangsar',
        mapLink: 'https://maps.app.goo.gl/9jSejq5iw6cToF8P8'
    }),
    klgcc: Object.freeze({
        key: 'klgcc',
        name: '176 Avenue @ KLGCC',
        mapLink: 'https://maps.app.goo.gl/8qP3Yi1eL67sBpQf6'
    }),
    ss2: Object.freeze({
        key: 'ss2',
        name: '176 Avenue @ SS2',
        mapLink: 'https://maps.app.goo.gl/AFPSExKG7YnscJeq5'
    })
});

const DEFAULT_OUTLET_KEY = 'bangsar';

function normalizeOutletKey(outletKey) {
    return String(outletKey || '').trim().toLowerCase();
}

function getOutletByKey(outletKey) {
    return OUTLETS[normalizeOutletKey(outletKey)] || null;
}

function getDefaultOutlet() {
    return OUTLETS[DEFAULT_OUTLET_KEY];
}

function resolveOutletContext(payload = {}) {
    const selectedOutlet = getOutletByKey(
        payload.selectedOutletKey
        || payload.outletKey
        || payload.outlet
    ) || getDefaultOutlet();

    const outletName = payload.outletName
        || payload.outlet?.name
        || selectedOutlet.name;
    const outletMapLink = payload.outletMapLink
        || payload.outlet?.mapLink
        || selectedOutlet.mapLink;

    return {
        key: selectedOutlet.key,
        name: outletName,
        mapLink: outletMapLink
    };
}

module.exports = {
    OUTLETS,
    DEFAULT_OUTLET_KEY,
    getOutletByKey,
    getDefaultOutlet,
    resolveOutletContext
};