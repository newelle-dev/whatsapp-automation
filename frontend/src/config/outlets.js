export const OUTLETS = Object.freeze({
  bangsar: Object.freeze({
    key: 'bangsar',
    name: '176 Avenue @ Bangsar',
    mapLink: 'https://maps.app.goo.gl/9jSejq5iw6cToF8P8'
  }),
  klgcc: Object.freeze({
    key: 'klgcc',
    name: '176 Avenue @ KLGCC',
    mapLink: 'https://maps.app.goo.gl/6kvicGb14wAEXWMa9'
  }),
  ss2: Object.freeze({
    key: 'ss2',
    name: '176 Avenue @ SS2',
    mapLink: 'https://maps.app.goo.gl/o6HbVGRWYXVaLXny9'
  })
});

export const OUTLET_OPTIONS = Object.freeze(Object.values(OUTLETS));
export const DEFAULT_OUTLET_KEY = 'bangsar';

export function normalizeOutletKey(outletKey) {
  return String(outletKey ?? '').trim().toLowerCase();
}

export function getOutletByKey(outletKey) {
  return OUTLETS[normalizeOutletKey(outletKey)] || null;
}

export function getDefaultOutlet() {
  return OUTLETS[DEFAULT_OUTLET_KEY];
}

export function isValidHttpUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  try {
    const parsedUrl = new URL(value.trim());
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}