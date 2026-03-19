// src/utils/formatters.js
// Shared formatting utilities

export function stripMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')  // remove **bold** markers
      .replace(/^\s*[\*\-]\s+/gm, '')              // remove bullet markers
      .replace(/^\d+\.\s+/gm, '')                  // remove numbered list
      .replace(/^#+\s+/gm, '')                     // remove headers
      .trim();
  }
  
  export function Bold({ text }) {
    if (!text) return null;
    const clean = text
      .replace(/^\s*[\*\-]\s+/, '')
      .replace(/^\d+\.\s*/, '')
      .trim();
    const parts = clean.split(/(\*{1,2}[^*]+\*{1,2})/g);
    return (
      <>
        {parts.map((p, i) => {
          if (/^\*{1,2}[^*]+\*{1,2}$/.test(p)) {
            const inner = p.replace(/^\*{1,2}/, '').replace(/\*{1,2}$/, '');
            return <strong key={i} style={{ fontWeight: 700, color: '#1C1409' }}>{inner}</strong>;
          }
          return <span key={i}>{p}</span>;
        })}
      </>
    );
  }
  
  export function FormattedContent({ text, bg = '#FEF9F0', border = 'rgba(186,117,23,0.15)', indexColor = '#BA7517' }) {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith('#') || trimmed.match(/^[=\-]{3,}$/)) return null;
  
          const isNumbered = trimmed.match(/^(\d+)\.\s+/);
          const isBullet   = trimmed.match(/^[\*\-]\s+/);
  
          return (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '12px 15px', borderRadius: '11px', background: bg, border: `1px solid ${border}`, alignItems: 'flex-start' }}>
              {(isNumbered || isBullet) && (
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: `${indexColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: indexColor, flexShrink: 0 }}>
                  {isNumbered ? isNumbered[1] : '•'}
                </div>
              )}
              <p style={{ fontSize: '14px', color: '#1C1409', lineHeight: 1.75, margin: 0 }}>
                <Bold text={trimmed} />
              </p>
            </div>
          );
        })}
      </div>
    );
  }
  
  export function saveToLocalHistory(key, entry, limit = 20) {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [entry, ...existing].slice(0, limit);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }
  
  export function loadLocalHistory(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }