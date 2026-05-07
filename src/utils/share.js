// URL-safe base64 (no padding) <-> string
const SHARE_LIMIT = 6 * 1024; // ~6KB encoded → URL stays under typical limits

function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  const b64 = btoa(s);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64ToBytes(b64) {
  const norm = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 === 0 ? '' : '='.repeat(4 - (norm.length % 4));
  const bin = atob(norm + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShare(text) {
  const bytes = new TextEncoder().encode(text);
  const enc = bytesToB64(bytes);
  if (enc.length > SHARE_LIMIT) {
    const err = new Error(`Payload too large for URL share (${enc.length} chars, max ${SHARE_LIMIT}). Try minifying or copy text instead.`);
    err.code = 'TOO_LARGE';
    throw err;
  }
  return enc;
}

export function decodeShare(b64) {
  try {
    const bytes = b64ToBytes(b64);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function readShareFromUrl() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const m = hash.match(/^#j=([A-Za-z0-9_\-]+)$/);
  if (!m) return null;
  return decodeShare(m[1]);
}

export function buildShareUrl(text) {
  const enc = encodeShare(text);
  const url = new URL(window.location.href);
  url.hash = 'j=' + enc;
  return url.toString();
}

export function clearShareUrl() {
  if (typeof window === 'undefined') return;
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}
