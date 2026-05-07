import { getType, isContainer, joinPath } from './types.js';

const CLOSE_SUFFIX = '\x01__close';

export function flattenTree(root, expanded, keepSet = null) {
  const out = [];
  const stack = [{ kind: 'visit', value: root, path: '', key: null, depth: 0, isArrayItem: false }];
  while (stack.length) {
    const task = stack.pop();
    if (task.kind === 'close') {
      out.push({
        path: task.path + CLOSE_SUFFIX,
        key: null,
        value: null,
        type: task.type,
        depth: task.depth,
        hasChildren: false,
        childCount: 0,
        isExpanded: false,
        isArrayItem: false,
        isClose: true,
        closeChar: task.type === 'array' ? ']' : '}',
        isLastInParent: task.isLastInParent === true
      });
      continue;
    }
    const { value, path, key, depth, isArrayItem, isLastInParent } = task;
    if (keepSet && !keepSet.has(path)) continue;
    const type = getType(value);
    const container = isContainer(type);
    const childCount = container
      ? Array.isArray(value) ? value.length : Object.keys(value).length
      : 0;
    const isExpanded = container && expanded.has(path);
    out.push({
      path,
      key,
      value: container ? null : value,
      type,
      depth,
      hasChildren: childCount > 0,
      childCount,
      isExpanded,
      isArrayItem,
      isLastInParent: isLastInParent === true,
      preview: container ? buildPreview(value, type, childCount) : null
    });
    if (container && isExpanded && childCount > 0) {
      stack.push({ kind: 'close', path, type, depth, isLastInParent: isLastInParent === true });
      const children = [];
      if (Array.isArray(value)) {
        const last = value.length - 1;
        for (let i = 0; i < value.length; i++) {
          children.push({
            kind: 'visit',
            value: value[i],
            path: joinPath(path, i),
            key: i,
            depth: depth + 1,
            isArrayItem: true,
            isLastInParent: i === last
          });
        }
      } else {
        const keys = Object.keys(value);
        const last = keys.length - 1;
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          children.push({
            kind: 'visit',
            value: value[k],
            path: joinPath(path, k),
            key: k,
            depth: depth + 1,
            isArrayItem: false,
            isLastInParent: i === last
          });
        }
      }
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
    }
  }
  return out;
}

function buildPreview(value, type, childCount) {
  if (childCount === 0) return type === 'array' ? '[]' : '{}';
  if (type === 'array') return `Array(${childCount})`;
  return `{${childCount}}`;
}
