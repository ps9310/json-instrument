export const PATH_SEP = '';

export function getType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

export function isContainer(t) {
  return t === 'object' || t === 'array';
}

export function joinPath(parent, key) {
  return parent === '' ? String(key) : parent + PATH_SEP + key;
}

export function ancestorsOf(path) {
  if (!path) return [];
  const parts = path.split(PATH_SEP);
  const out = [];
  let acc = '';
  for (let i = 0; i < parts.length - 1; i++) {
    acc = i === 0 ? parts[0] : acc + PATH_SEP + parts[i];
    out.push(acc);
  }
  return out;
}

export function pathToJsonPath(path) {
  if (!path) return '$';
  const parts = path.split(PATH_SEP);
  let out = '$';
  for (const p of parts) {
    if (/^\d+$/.test(p)) out += `[${p}]`;
    else if (/^[A-Za-z_$][\w$]*$/.test(p)) out += `.${p}`;
    else out += `["${p.replace(/"/g, '\\"')}"]`;
  }
  return out;
}

export function getValueAtPath(root, path) {
  if (!path) return root;
  const parts = path.split(PATH_SEP);
  let cur = root;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = Array.isArray(cur) ? cur[Number(p)] : cur[p];
  }
  return cur;
}
