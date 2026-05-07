import React from 'react';
import { highlightText } from '../utils/search.js';

const PATH_SEP = '\x01';
const CLOSE_SUFFIX = '\x01__close';

function pathInRange(path, root) {
  if (root === '') return true;
  if (path === root) return true;
  if (path === root + CLOSE_SUFFIX) return true;
  return path.startsWith(root + PATH_SEP);
}

function HighlightedText({ text, query, isActive, caseSensitive }) {
  if (!query) return text;
  const parts = highlightText(text, query, isActive, caseSensitive);
  return parts.map((p, i) =>
    p.mark ? <mark key={i} className={p.active ? 'active' : ''}>{p.text}</mark> : <span key={i}>{p.text}</span>
  );
}

function ValueRender({ type, value, query, isActive, caseSensitive }) {
  if (type === 'string') {
    return (
      <span className="v-string">
        <span className="qq">"</span>
        <HighlightedText text={value} query={query} isActive={isActive} caseSensitive={caseSensitive} />
        <span className="qq">"</span>
      </span>
    );
  }
  if (type === 'number') {
    return <span className="v-number"><HighlightedText text={String(value)} query={query} isActive={isActive} caseSensitive={caseSensitive} /></span>;
  }
  if (type === 'boolean') {
    return <span className="v-boolean">{String(value)}</span>;
  }
  if (type === 'null') {
    return <span className="v-null">null</span>;
  }
  return null;
}

const TreeRow = React.memo(function TreeRow({
  node,
  style,
  query,
  caseSensitive,
  activePath,
  matchSet,
  flashPath,
  flashTick,
  onToggle,
  onCopyValue,
  onCopyPath
}) {
  const indent = node.depth * 16 + 14;
  const isMatch = matchSet && matchSet.has(node.path);
  const isActiveMatch = activePath === node.path;
  const isFlashing = flashPath != null && pathInRange(node.path, flashPath);
  let flashRole = '';
  if (isFlashing) {
    if (flashPath === node.path) flashRole = node.isExpanded ? 'flash-top' : 'flash-single';
    else if (node.isClose && node.path.slice(0, -CLOSE_SUFFIX.length) === flashPath) flashRole = 'flash-bottom';
    else flashRole = 'flash-mid';
  }
  const flashClasses = isFlashing ? ` flash ${flashRole}` : '';

  if (node.isClose) {
    return (
      <div className={`tree-row close-row${flashClasses}`} style={{ ...style, paddingLeft: indent }}>
        <span className="toggle empty">·</span>
        <span className="punct">{node.closeChar}</span>
        {!node.isLastInParent && node.depth > 0 && <span className="punct comma">,</span>}
      </div>
    );
  }

  const className = `tree-row${isMatch ? ' match' : ''}${isActiveMatch ? ' match-active' : ''}${flashClasses}`;

  return (
    <div className={className} style={{ ...style, paddingLeft: indent }}>
      <span
        className={`toggle ${node.hasChildren ? '' : 'empty'}`}
        onClick={node.hasChildren ? () => onToggle(node.path) : undefined}
      >
        {node.hasChildren ? (node.isExpanded ? '▾' : '▸') : '·'}
      </span>
      {node.key !== null && (
        node.isArrayItem ? (
          <span className="index">
            {node.key}<span className="colon">:</span>
          </span>
        ) : (
          <span className="key">
            <span className="qq">"</span>
            <HighlightedText text={String(node.key)} query={query} isActive={isActiveMatch} caseSensitive={caseSensitive} />
            <span className="qq">":</span>
          </span>
        )
      )}
      {node.type === 'array' || node.type === 'object' ? (
        <>
          <span className="punct">{node.type === 'array' ? '[' : '{'}</span>
          {!node.isExpanded && <span className="preview">{node.preview}</span>}
          {!node.isExpanded && <span className="punct">{node.type === 'array' ? ']' : '}'}</span>}
          {!node.isExpanded && !node.isLastInParent && node.depth > 0 && <span className="punct comma">,</span>}
        </>
      ) : (
        <>
          <ValueRender
            type={node.type}
            value={node.value}
            query={query}
            isActive={isActiveMatch}
            caseSensitive={caseSensitive}
          />
          {!node.isLastInParent && node.depth > 0 && <span className="punct comma">,</span>}
        </>
      )}
      <span className="actions">
        <button onClick={() => onCopyPath(node.path)} title="Copy path">path</button>
        <button onClick={() => onCopyValue(node.path)} title="Copy value">value</button>
      </span>
    </div>
  );
});

export default TreeRow;
