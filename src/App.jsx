import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import JsonTree from './components/JsonTree.jsx';
import SearchBar from './components/SearchBar.jsx';
import DevTools from './components/DevTools.jsx';
import RawView from './components/RawView.jsx';
import { searchTree, expandAncestors } from './utils/search.js';
import { parseUserPath } from './utils/parsePath.js';
import {
  ancestorsOf, getValueAtPath, isContainer, getType, joinPath, pathToJsonPath
} from './utils/types.js';

function collectAllContainerPaths(root) {
  const out = new Set();
  function walk(v, path) {
    const t = getType(v);
    if (!isContainer(t)) return;
    out.add(path);
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) walk(v[i], joinPath(path, i));
    } else {
      const keys = Object.keys(v);
      for (let i = 0; i < keys.length; i++) walk(v[keys[i]], joinPath(path, keys[i]));
    }
  }
  walk(root, '');
  return out;
}

const THEMES = ['zebra-dark', 'zebra-light'];

function readTheme() {
  try {
    const t = localStorage.getItem('zebra-theme');
    return THEMES.includes(t) ? t : 'zebra-dark';
  } catch { return 'zebra-dark'; }
}

export default function App() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    document.documentElement.className = theme;
    try { localStorage.setItem('zebra-theme', theme); } catch {}
  }, [theme]);

  const [data, setData] = useState(null);
  const [rawText, setRawText] = useState('');
  const [rawSize, setRawSize] = useState(0);
  const [parseMs, setParseMs] = useState(0);
  const [tab, setTab] = useState('tree');
  const [error, setError] = useState(null);

  const [expanded, setExpanded] = useState(() => new Set(['']));
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [mode, setMode] = useState('all');
  const [matches, setMatches] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [jumpTarget, setJumpTarget] = useState(null);
  const [flashPath, setFlashPath] = useState(null);
  const [flashTick, setFlashTick] = useState(0);
  const [toast, setToast] = useState(null);

  // Debounce query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  const parseTextRef = useRef(null);
  // Global paste handler — pasting anywhere outside an input/textarea
  // routes JSON straight into parseText (great for the EmptyState/Tree).
  useEffect(() => {
    const handler = (e) => {
      const el = document.activeElement;
      const tag = (el?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || el?.isContentEditable) return;
      const text = e.clipboardData?.getData('text');
      if (!text || !text.trim()) return;
      e.preventDefault();
      parseTextRef.current?.(text);
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, []);

  // Reset matches when data changes
  useEffect(() => {
    setMatches([]);
    setActiveIdx(0);
  }, [data]);

  // Run search when query changes
  useEffect(() => {
    if (!data || !debouncedQuery) {
      setMatches([]);
      setActiveIdx(0);
      return;
    }
    setSearching(true);
    const id = setTimeout(() => {
      try {
        const m = searchTree(data, debouncedQuery, { caseSensitive, mode });
        setMatches(m);
        setActiveIdx(0);
        if (m.length > 0) {
          setExpanded(prev => expandAncestors(m, prev));
          setSelectedPath(m[0]);
        }
      } finally {
        setSearching(false);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [debouncedQuery, caseSensitive, mode, data]);

  const matchSet = useMemo(() => new Set(matches), [matches]);
  const activePath = matches.length > 0 ? matches[activeIdx] : null;

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }, []);

  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const parseText = useCallback((text) => {
    setRawText(text);
    if (!text.trim()) {
      setData(null);
      setRawSize(0);
      setParseMs(0);
      setError(null);
      return;
    }
    const t0 = performance.now();
    try {
      const obj = JSON.parse(text);
      const t1 = performance.now();
      setData(obj);
      setRawSize(new Blob([text]).size);
      setParseMs(t1 - t0);
      setExpanded(collectAllContainerPaths(obj));
      setError(null);
      setTab('tree');
      showSuccess(`Parsed in ${(t1 - t0).toFixed(1)} ms`);
    } catch (e) {
      const m = e.message || 'Invalid JSON';
      const posMatch = m.match(/position (\d+)/);
      let location = '';
      if (posMatch) {
        const pos = Number(posMatch[1]);
        const upTo = text.slice(0, pos);
        const line = upTo.split('\n').length;
        const col = pos - upTo.lastIndexOf('\n');
        location = ` (line ${line}, col ${col})`;
      }
      showError(m + location);
    }
  }, [showError, showSuccess]);
  parseTextRef.current = parseText;

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        showError('Clipboard is empty');
        return;
      }
      parseText(text);
    } catch (e) {
      showError('Clipboard read denied: ' + (e.message || 'permission'));
    }
  }, [parseText, showError]);

  const loadFile = useCallback(async (file) => {
    try {
      const text = await file.text();
      parseText(text);
    } catch (e) {
      showError('Failed to read file: ' + e.message);
    }
  }, [parseText, showError]);

  const formatJson = useCallback(() => {
    if (data == null) return;
    const text = JSON.stringify(data, null, 2);
    setRawText(text);
    setRawSize(new Blob([text]).size);
    setTab('raw');
    showSuccess('Formatted (2-space indent)');
  }, [data, showSuccess]);

  const minifyJson = useCallback(() => {
    if (data == null) return;
    const text = JSON.stringify(data);
    setRawText(text);
    setRawSize(new Blob([text]).size);
    setTab('raw');
    showSuccess('Minified');
  }, [data, showSuccess]);

  const copyAllJson = useCallback(async (pretty = false) => {
    if (data == null) return;
    const text = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied ${pretty ? 'pretty' : 'minified'} · ${text.length.toLocaleString()} chars`);
    } catch (e) {
      showError('Clipboard write denied');
    }
  }, [data, showError, showToast]);

  const downloadJson = useCallback(() => {
    if (data == null) return;
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded data.json');
  }, [data, showToast]);

  const clearAll = useCallback(() => {
    setData(null);
    setRawText('');
    setRawSize(0);
    setParseMs(0);
    setError(null);
    setQuery('');
    setExpanded(new Set(['']));
    setSelectedPath(null);
    setTab('tree');
  }, []);

  const expandAll = useCallback(() => {
    if (data == null) return;
    setExpanded(collectAllContainerPaths(data));
    showToast('Expanded all');
  }, [data, showToast]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set(['']));
    showToast('Collapsed all');
  }, [showToast]);

  const onCopyValue = useCallback((path) => {
    const v = getValueAtPath(data, path);
    const s = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
    navigator.clipboard?.writeText(s);
    setSelectedPath(path);
    showToast('Copied value');
  }, [data, showToast]);

  const onCopyPath = useCallback((path) => {
    const s = pathToJsonPath(path);
    navigator.clipboard?.writeText(s);
    setSelectedPath(path);
    showToast('Copied · ' + s);
  }, [showToast]);

  const jumpToPath = useCallback((input) => {
    if (data == null) return;
    try {
      const internal = parseUserPath(input, data);
      setExpanded(prev => {
        const next = new Set(prev);
        next.add('');
        for (const a of ancestorsOf(internal)) next.add(a);
        const v = getValueAtPath(data, internal);
        if (isContainer(getType(v))) next.add(internal);
        return next;
      });
      setSelectedPath(internal);
      setJumpTarget({ path: internal, tick: Date.now() });
      setFlashPath(internal);
      setFlashTick(t => t + 1);
      setTab('tree');
      showToast('Jumped · ' + (pathToJsonPath(internal) || '$'));
    } catch (e) {
      showError('Invalid path: ' + e.message);
    }
  }, [data, showError, showToast]);

  const onPrev = useCallback(() => {
    if (matches.length === 0) return;
    setActiveIdx(i => (i - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const onNext = useCallback(() => {
    if (matches.length === 0) return;
    setActiveIdx(i => (i + 1) % matches.length);
  }, [matches.length]);

  useEffect(() => {
    if (activePath != null) setSelectedPath(activePath);
  }, [activePath]);

  useEffect(() => {
    if (flashPath == null) return;
    const id = setTimeout(() => setFlashPath(null), 2600);
    return () => clearTimeout(id);
  }, [flashPath, flashTick]);

  const rootSummary = data == null
    ? null
    : Array.isArray(data)
      ? `array · ${data.length.toLocaleString()} items`
      : typeof data === 'object'
        ? `object · ${Object.keys(data).length} keys`
        : typeof data;

  return (
    <div className="app">
      <div className="body">
        <div className="left">
          {tab === 'tree' && data != null ? (
            <SearchBar
              query={query}
              setQuery={setQuery}
              matchCount={matches.length}
              activeIndex={activeIdx}
              onPrev={onPrev}
              onNext={onNext}
              caseSensitive={caseSensitive}
              setCaseSensitive={setCaseSensitive}
              mode={mode}
              setMode={setMode}
              searching={searching}
            />
          ) : (
            <div className="left-header">
              <span className="label-tag">
                {tab === 'raw' ? <><span className="accent">//</span> raw editor</> : 'tree'}
              </span>
              <span style={{ flex: 1 }} />
              <span className="meta">
                {tab === 'raw' ? 'paste · ⌘↵ to parse' : data == null ? 'awaiting input' : 'idle'}
              </span>
            </div>
          )}
          {error && tab === 'tree' && (
            <div className="banner error">
              <span className="label">Err</span>
              <span>{error}</span>
            </div>
          )}
          {tab === 'tree' && (
            data == null ? (
              <EmptyState onSwitch={() => setTab('raw')} />
            ) : (
              <JsonTree
                data={data}
                expanded={expanded}
                setExpanded={setExpanded}
                query={debouncedQuery}
                caseSensitive={caseSensitive}
                matchSet={matchSet}
                activePath={activePath}
                jumpTarget={jumpTarget}
                flashPath={flashPath}
                flashTick={flashTick}
                onCopyValue={onCopyValue}
                onCopyPath={onCopyPath}
              />
            )
          )}
          {tab === 'raw' && (
            <RawView initialText={rawText} onParse={parseText} error={error} />
          )}
        </div>
        <DevTools
          data={data}
          rawSize={rawSize}
          parseMs={parseMs}
          selectedPath={selectedPath}
          tab={tab}
          setTab={setTab}
          theme={theme}
          setTheme={setTheme}
          rootSummary={rootSummary}
          onJumpToPath={jumpToPath}
          onLoadFile={loadFile}
          onPaste={pasteFromClipboard}
          onFormat={formatJson}
          onMinify={minifyJson}
          onCopy={copyAllJson}
          onClear={clearAll}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          onDownload={downloadJson}
        />
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function EmptyState({ onSwitch }) {
  return (
    <div className="empty-state">
      <div className="frame diagnostic">
        <h2>Awaiting Signal</h2>
        <div className="diag-grid">
          <span className="diag-key">in</span>
          <span className="diag-sep">·</span>
          <span className="diag-val">paste / drop / load</span>

          <span className="diag-key">out</span>
          <span className="diag-sep">·</span>
          <span className="diag-val">tree · search</span>

          <span className="diag-key">stat</span>
          <span className="diag-sep">·</span>
          <span className="diag-val">
            idle <span className="cursor-blink" />
          </span>
        </div>
        <div className="prompt">
          <span className="kbd">⌘V</span> to capture · <a onClick={onSwitch} style={{ color: 'var(--c-amber)', cursor: 'pointer', textDecoration: 'underline' }}>open raw</a>
        </div>
      </div>
    </div>
  );
}
