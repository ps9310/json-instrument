import React, { useState, useMemo } from 'react';
import { computeStats, formatBytes } from '../utils/stats.js';
import { getValueAtPath, pathToJsonPath } from '../utils/types.js';

const TYPE_COLORS = {
  object: 'var(--c-fg)',
  array: 'var(--c-fg)',
  string: 'var(--c-phosphor)',
  number: 'var(--c-cyan)',
  boolean: 'var(--c-violet)',
  null: 'var(--c-coral)'
};

export default function DevTools({
  data,
  rawSize,
  parseMs,
  selectedPath,
  tab,
  setTab,
  theme,
  setTheme,
  rootSummary,
  onJumpToPath,
  onLoadFile,
  onPaste,
  onFormat,
  onMinify,
  onCopy,
  onCopyShareLink,
  onClear,
  onExpandAll,
  onCollapseAll,
  onDownload,
  history,
  onLoadHistory,
  onRemoveHistory,
  onClearHistory
}) {
  const stats = useMemo(() => (data == null ? null : computeStats(data)), [data]);
  const [pathInput, setPathInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const selectedValue = selectedPath != null ? getValueAtPath(data, selectedPath) : undefined;

  return (
    <div className="right">
      <div className="panel-section brand-section">
        <div className="brand-mark">
          <span className="glyph">⌁</span>
          <span>JSON</span>
          <span className="sub">/INSTRUMENT</span>
        </div>
        <div className="theme-toggle" role="group" aria-label="Theme">
          <button
            className={theme === 'zebra-dark' ? 'active' : ''}
            onClick={() => setTheme('zebra-dark')}
            title="Zebra Black"
          >Dark</button>
          <button
            className={theme === 'zebra-light' ? 'active' : ''}
            onClick={() => setTheme('zebra-light')}
            title="Zebra White"
          >Light</button>
        </div>
      </div>

      <div className="panel-section">
        <div className="head">
          <h3>· View</h3>
          <span className="num">00</span>
        </div>
        <div className="tabbar" role="tablist" style={{ width: '100%' }}>
          <button
            className={`tab${tab === 'tree' ? ' active' : ''}`}
            onClick={() => setTab('tree')}
            disabled={data == null}
            style={{ flex: 1 }}
          >
            <span className={`dot ${data ? 'amber' : ''}`} />
            Tree
          </button>
          <button
            className={`tab${tab === 'raw' ? ' active' : ''}`}
            onClick={() => setTab('raw')}
            style={{ flex: 1 }}
          >
            Raw
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="head">
          <h3>· Source</h3>
          <span className="num">01</span>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={onPaste} title="Paste & parse from clipboard">
            ▌ Paste
          </button>
          <button className="btn" onClick={() => document.getElementById('file-input').click()}>
            ↥ File
          </button>
          <input
            id="file-input"
            type="file"
            accept=".json,application/json,text/plain"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onLoadFile(f);
              e.target.value = '';
            }}
          />
          <button className="btn danger" onClick={onClear}>Clear</button>
        </div>
        <div style={{ marginTop: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--c-fg-dim)', letterSpacing: '0.06em' }}>
          tip · ⌘V anywhere to parse
        </div>
      </div>

      <div className="panel-section">
        <div className="head">
          <h3>· Format</h3>
          <span className="num">02</span>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={onFormat} disabled={data == null}>Pretty</button>
          <button className="btn" onClick={onMinify} disabled={data == null}>Minify</button>
          <button className="btn" onClick={() => onCopy(false)} disabled={data == null} title="Copy minified JSON to clipboard">⎘ Copy Min</button>
          <button className="btn" onClick={() => onCopy(true)} disabled={data == null} title="Copy pretty JSON to clipboard">⎘ Copy</button>
          <button className="btn phosphor" onClick={onDownload} disabled={data == null}>↓ Download</button>
          <button className="btn" onClick={onCopyShareLink} disabled={data == null} title="Copy URL with embedded JSON (small payloads only)">⇪ Share Link</button>
        </div>
      </div>

      <div className="panel-section">
        <div className="head">
          <h3>· Tree</h3>
          <span className="num">03</span>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={onExpandAll} disabled={data == null}>Expand All</button>
          <button className="btn" onClick={onCollapseAll} disabled={data == null}>Collapse</button>
        </div>
      </div>

      {stats && (
        <div className="panel-section">
          <div className="head">
            <h3>· Telemetry</h3>
            <span className="num">04</span>
          </div>
          <div className="stat-grid">
            {rootSummary && (
              <div className="stat-cell phosphor" style={{ gridColumn: 'span 2' }}>
                <span className="label">Root</span>
                <span className="value" style={{ fontSize: 12 }}>{rootSummary}</span>
              </div>
            )}
            <div className="stat-cell">
              <span className="label">Size</span>
              <span className="value">{formatBytes(rawSize)}</span>
            </div>
            <div className="stat-cell accent">
              <span className="label">Parse</span>
              <span className="value">{parseMs.toFixed(1)}<span style={{ fontSize: 10, color: 'var(--c-fg-dim)', marginLeft: 4 }}>ms</span></span>
            </div>
            <div className="stat-cell">
              <span className="label">Nodes</span>
              <span className="value">{stats.nodes.toLocaleString()}</span>
            </div>
            <div className="stat-cell">
              <span className="label">Depth</span>
              <span className="value">{stats.maxDepth}</span>
            </div>
            <div className="stat-cell" style={{ gridColumn: 'span 2' }}>
              <span className="label">Total Keys</span>
              <span className="value">{stats.totalKeys.toLocaleString()}</span>
            </div>
          </div>

          <div className="type-counts">
            {['object', 'array', 'string', 'number', 'boolean', 'null'].map((t) => (
              <div key={t} className="type-row">
                <span className="swatch" style={{ color: TYPE_COLORS[t], background: TYPE_COLORS[t] }} />
                <span className="name">{t}</span>
                <span className="v">{stats.counts[t].toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel-section">
        <div className="head">
          <h3>· Jump To Path</h3>
          <span className="num">05</span>
        </div>
        <input
          placeholder="$.users[3].email"
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onJumpToPath(pathInput); }}
          style={{ width: '100%', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
          spellCheck={false}
        />
        <div style={{ marginTop: 8 }}>
          <button
            className="btn primary"
            onClick={() => onJumpToPath(pathInput)}
            disabled={!pathInput || data == null}
          >Jump ▸</button>
        </div>
      </div>

      {selectedPath != null && (
        <div className="panel-section">
          <div className="head">
            <h3>· Selection</h3>
            <span className="num">06</span>
          </div>
          <div className="path-display">{pathToJsonPath(selectedPath) || '$'}</div>
          {selectedValue !== undefined && (
            <div className="value-preview">{safeStringify(selectedValue, 2, 2000)}</div>
          )}
        </div>
      )}

      {history && history.length > 0 && (
        <div className={`panel-section collapsible${historyOpen ? ' open' : ''}`}>
          <button
            className="head head-toggle"
            onClick={() => setHistoryOpen(v => !v)}
            aria-expanded={historyOpen}
          >
            <h3>
              <span className="caret">{historyOpen ? '▾' : '▸'}</span>
              · History
            </h3>
            <span className="num">{String(history.length).padStart(2, '0')}</span>
          </button>
          {historyOpen && (
            <>
              <div className="history-list">
                {history.map((h) => (
                  <div key={h.id} className="history-row">
                    <button
                      className="history-load"
                      onClick={() => onLoadHistory(h.id)}
                      disabled={!h.text}
                      title={h.text ? 'Load this payload' : 'Stored as metadata only — text was too large'}
                    >
                      <span className="history-meta">
                        <span className="ts">{relTime(h.ts)}</span>
                        <span className="size">{formatBytes(h.size)}</span>
                        {!h.text && <span className="meta-tag">meta</span>}
                      </span>
                      <span className="preview">{h.preview || '—'}</span>
                    </button>
                    <button
                      className="btn xs danger history-remove"
                      onClick={() => onRemoveHistory(h.id)}
                      title="Remove"
                    >✕</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, textAlign: 'right' }}>
                <button className="btn xs danger" onClick={onClearHistory}>Clear all</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="foot-help">
        <span className="kbd">⌘F</span> search
        <span className="kbd">↵</span> next
        <span className="kbd">⇧↵</span> prev
        <span className="kbd">Esc</span> clear
      </div>
    </div>
  );
}

function relTime(ts) {
  const ms = Date.now() - ts;
  const s = Math.floor(ms / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'd';
}

function safeStringify(v, indent, maxLen) {
  try {
    const s = JSON.stringify(v, null, indent);
    if (s == null) return String(v);
    return s.length > maxLen ? s.slice(0, maxLen) + '\n… (truncated)' : s;
  } catch {
    return String(v);
  }
}
