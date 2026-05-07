import React, { useState, useEffect } from 'react';

export default function RawView({ initialText, onParse, error }) {
  const [text, setText] = useState(initialText || '');

  useEffect(() => {
    if (initialText !== undefined && initialText !== text) setText(initialText);
  }, [initialText]);

  return (
    <div className="editor">
      {error && (
        <div className="banner error">
          <span className="label">Err</span>
          <span>{error}</span>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            onParse(text);
          }
        }}
        placeholder='// paste JSON here&#10;{ "hello": "world" }'
        spellCheck={false}
      />
      <div className="editor-foot">
        <button className="btn primary md" onClick={() => onParse(text)} disabled={!text.trim()}>
          ▸ Parse
        </button>
        <span style={{ color: 'var(--c-fg-muted)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {text.length.toLocaleString()} chars
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ color: 'var(--c-fg-dim)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ⌘↵ to parse
        </span>
      </div>
    </div>
  );
}
