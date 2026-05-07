import { PATH_SEP } from './types.js';

// Parse "$.users[3].email" or "users.0.name" into internal path.
export function parseUserPath(input, root) {
  if (!input) return '';
  let s = input.trim();
  if (s.startsWith('$')) s = s.slice(1);
  const parts = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '.') { i++; continue; }
    if (c === '[') {
      const end = s.indexOf(']', i);
      if (end === -1) throw new Error('Unclosed bracket');
      let inner = s.slice(i + 1, end).trim();
      if ((inner.startsWith('"') && inner.endsWith('"')) || (inner.startsWith("'") && inner.endsWith("'"))) {
        inner = inner.slice(1, -1);
      }
      parts.push(inner);
      i = end + 1;
      continue;
    }
    let j = i;
    while (j < s.length && s[j] !== '.' && s[j] !== '[') j++;
    parts.push(s.slice(i, j));
    i = j;
  }
  // validate against root
  let cur = root;
  for (const p of parts) {
    if (cur == null) throw new Error(`Invalid path at "${p}"`);
    cur = Array.isArray(cur) ? cur[Number(p)] : cur[p];
  }
  return parts.join(PATH_SEP);
}
