import React from 'react';

export default function SearchBar({
  query,
  setQuery,
  matchCount,
  activeIndex,
  onPrev,
  onNext,
  caseSensitive,
  setCaseSensitive,
  mode,
  setMode,
  filterMode,
  setFilterMode,
  searching
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        ref.current?.focus();
        ref.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) onPrev(); else onNext();
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  return (
    <div className="left-header">
      <div className="search-input">
        <span className="leading">/</span>
        <input
          ref={ref}
          placeholder="search keys & values …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          spellCheck={false}
        />
      </div>
      <select value={mode} onChange={(e) => setMode(e.target.value)} title="Match scope">
        <option value="all">all</option>
        <option value="keys">keys</option>
        <option value="values">values</option>
      </select>
      <button
        className={`btn ${caseSensitive ? 'primary' : 'ghost'}`}
        onClick={() => setCaseSensitive(v => !v)}
        title="Case sensitive"
        style={{ height: 28 }}
      >Aa</button>
      <button
        className={`btn ${filterMode ? 'primary' : 'ghost'}`}
        onClick={() => setFilterMode(v => !v)}
        title="Filter — collapse tree to matches only"
        style={{ height: 28 }}
      >▽ Filter</button>
      <button className="btn ghost" onClick={onPrev} disabled={!matchCount} title="Previous (Shift+Enter)" style={{ height: 28 }}>↑</button>
      <button className="btn ghost" onClick={onNext} disabled={!matchCount} title="Next (Enter)" style={{ height: 28 }}>↓</button>
      <span className={`count${searching ? ' searching' : ''}`}>
        {searching ? '· searching ·' : matchCount > 0 ? `${(activeIndex + 1).toString().padStart(String(matchCount).length, '0')} / ${matchCount}` : query ? '0 matches' : ''}
      </span>
    </div>
  );
}
