const KEY = 'zebra-json-history';
const MAX_ENTRIES = 10;
const MAX_TEXT_PER_ENTRY = 1024 * 1024; // 1MB

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(arr) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    // quota — drop oldest until it fits
    let trimmed = arr.slice();
    while (trimmed.length > 1) {
      trimmed = trimmed.slice(0, -1);
      try {
        localStorage.setItem(KEY, JSON.stringify(trimmed));
        return;
      } catch {}
    }
    try { localStorage.removeItem(KEY); } catch {}
  }
}

export function listHistory() {
  return read();
}

export function pushHistory({ text, size }) {
  const list = read();
  const ts = Date.now();
  const id = ts.toString(36) + Math.random().toString(36).slice(2, 6);
  const preview = text.slice(0, 80).replace(/\s+/g, ' ').trim();
  const storeText = text.length <= MAX_TEXT_PER_ENTRY ? text : null;
  // Dedupe consecutive identical text
  if (list[0] && list[0].text === text) {
    list[0].ts = ts;
    write(list);
    return list[0];
  }
  const entry = { id, ts, size, preview, text: storeText };
  list.unshift(entry);
  const trimmed = list.slice(0, MAX_ENTRIES);
  write(trimmed);
  return entry;
}

export function removeHistory(id) {
  const list = read().filter(e => e.id !== id);
  write(list);
  return list;
}

export function clearHistory() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function getHistoryEntry(id) {
  return read().find(e => e.id === id) || null;
}
