import { getType, isContainer, joinPath, ancestorsOf } from './types.js';

// Walks the tree directly each search - avoids holding a fat index in memory.
// O(N) per search; for 50K sample (~700K nodes) this is well under 200ms.
export function searchTree(root, query, opts = {}) {
  const { caseSensitive = false, mode = 'all', limit = 100000 } = opts;
  const out = [];
  if (!query) return out;
  const q = caseSensitive ? query : query.toLowerCase();
  const checkKeys = mode !== 'values';
  const checkVals = mode !== 'keys';
  function valueText(v, t) {
    if (t === 'string') return v;
    if (t === 'number' || t === 'boolean') return String(v);
    if (t === 'null') return 'null';
    return '';
  }
  function strHas(s) {
    if (!s) return false;
    return (caseSensitive ? s : s.toLowerCase()).includes(q);
  }
  function walk(value, path, key) {
    if (out.length >= limit) return;
    const t = getType(value);
    let hit = false;
    if (key != null && checkKeys && strHas(String(key))) hit = true;
    if (!hit && checkVals && !isContainer(t) && strHas(valueText(value, t))) hit = true;
    if (hit) out.push(path);
    if (isContainer(t)) {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) walk(value[i], joinPath(path, i), i);
      } else {
        const keys = Object.keys(value);
        for (let i = 0; i < keys.length; i++) {
          walk(value[keys[i]], joinPath(path, keys[i]), keys[i]);
        }
      }
    }
  }
  walk(root, '', null);
  return out;
}

export function expandAncestors(matches, expanded) {
  const next = new Set(expanded);
  next.add('');
  for (const m of matches) {
    for (const a of ancestorsOf(m)) next.add(a);
  }
  return next;
}

// keepSet for filter mode: matches + all ancestors (root included).
// Tree renders only paths in this set; ancestors stay as breadcrumbs.
export function buildKeepSet(matches) {
  const set = new Set(['']);
  for (const m of matches) {
    set.add(m);
    for (const a of ancestorsOf(m)) set.add(a);
  }
  return set;
}

export function highlightText(text, query, isActive, caseSensitive = false) {
  if (!query || !text) return [{ text, mark: false }];
  const t = caseSensitive ? text : text.toLowerCase();
  const q = caseSensitive ? query : query.toLowerCase();
  const out = [];
  let i = 0;
  while (i < text.length) {
    const idx = t.indexOf(q, i);
    if (idx === -1) {
      out.push({ text: text.slice(i), mark: false });
      break;
    }
    if (idx > i) out.push({ text: text.slice(i, idx), mark: false });
    out.push({ text: text.slice(idx, idx + q.length), mark: true, active: isActive });
    i = idx + q.length;
  }
  return out;
}
