import { getType, isContainer } from './types.js';

export function computeStats(root) {
  const counts = { object: 0, array: 0, string: 0, number: 0, boolean: 0, null: 0 };
  let nodes = 0;
  let maxDepth = 0;
  let totalKeys = 0;
  function walk(v, depth) {
    nodes++;
    if (depth > maxDepth) maxDepth = depth;
    const t = getType(v);
    counts[t]++;
    if (isContainer(t)) {
      if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) walk(v[i], depth + 1);
      } else {
        const keys = Object.keys(v);
        totalKeys += keys.length;
        for (let i = 0; i < keys.length; i++) walk(v[keys[i]], depth + 1);
      }
    }
  }
  walk(root, 0);
  return { counts, nodes, maxDepth, totalKeys };
}

export function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}
