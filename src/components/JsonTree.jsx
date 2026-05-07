import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import TreeRow from './TreeRow.jsx';
import { flattenTree } from '../utils/flatten.js';

const ROW_HEIGHT = 22;

export default function JsonTree({
  data,
  expanded,
  setExpanded,
  query,
  caseSensitive,
  matchSet,
  activePath,
  jumpTarget,
  flashPath,
  flashTick,
  onCopyValue,
  onCopyPath
}) {
  const flat = useMemo(() => flattenTree(data, expanded), [data, expanded]);
  const listRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const pathToIndex = useMemo(() => {
    const m = new Map();
    for (let i = 0; i < flat.length; i++) m.set(flat[i].path, i);
    return m;
  }, [flat]);

  useEffect(() => {
    if (activePath == null || !listRef.current) return;
    const idx = pathToIndex.get(activePath);
    if (idx != null) listRef.current.scrollToItem(idx, 'smart');
  }, [activePath, pathToIndex]);

  useEffect(() => {
    if (!jumpTarget || !listRef.current) return;
    const idx = pathToIndex.get(jumpTarget.path);
    if (idx != null) listRef.current.scrollToItem(idx, 'center');
  }, [jumpTarget, pathToIndex]);

  const onToggle = useCallback((path) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, [setExpanded]);

  const Row = useCallback(({ index, style }) => {
    const node = flat[index];
    return (
      <TreeRow
        node={node}
        style={style}
        query={query}
        caseSensitive={caseSensitive}
        activePath={activePath}
        matchSet={matchSet}
        flashPath={flashPath}
        flashTick={flashTick}
        onToggle={onToggle}
        onCopyValue={onCopyValue}
        onCopyPath={onCopyPath}
      />
    );
  }, [flat, query, caseSensitive, activePath, matchSet, flashPath, flashTick, onToggle, onCopyValue, onCopyPath]);

  return (
    <div className="tree" ref={containerRef}>
      {size.h > 0 && (
        <List
          ref={listRef}
          height={size.h}
          width={size.w}
          itemCount={flat.length}
          itemSize={ROW_HEIGHT}
          overscanCount={10}
        >
          {Row}
        </List>
      )}
    </div>
  );
}
