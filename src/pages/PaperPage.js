import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import {
  PenTool, Upload, Download, Star, AlertTriangle,
  BookOpen, Lightbulb, HelpCircle, CheckCircle2,
  History, Eye, Trash2, Languages, Target
} from 'lucide-react';

const muted = '#8A7055';

// ─── BOLD RENDERER ────────────────────────────────────────────────────────────
function Bold({ text }) {
  if (!text) return null;
  const clean = text
    .replace(/^\s*[\*\-]\s+/, '')   // strip leading bullet * or -
    .replace(/^\d+\.\s*/, '')        // strip leading number
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

// ─── FORMATTED BLOCK RENDERER ─────────────────────────────────────────────────
function FormattedContent({ text, bg = '#FEF9F0', border = cardBorder, indexColor = accent }) {
  if (!text) return <p style={{ color: muted, fontSize: '14px' }}>No content available.</p>;
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('#') || trimmed.match(/^[=\-]{3,}$/)) return null;

        const isBullet = trimmed.match(/^\*\s+/) || trimmed.match(/^-\s+/);
        const isNumbered = trimmed.match(/^\d+\.\s+/);

        return (
          <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: bg, border: `1px solid ${border}`, alignItems: 'flex-start' }}>
            {isBullet || isNumbered ? (
              <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: `${indexColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: indexColor, flexShrink: 0, marginTop: '1px' }}>
                {isNumbered ? trimmed.match(/^(\d+)\./)[1] : '•'}
              </div>
            ) : null}
            <p style={{ fontSize: '14px', color: '#1C1409', lineHeight: 1.75, margin: 0 }}>
              <Bold text={trimmed} />
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── PARSER ───────────────────────────────────────────────────────────────────
function parsePaperResult(raw) {
  if (!raw) return null;

  const get = (pattern) => {
    const m = raw.match(pattern);
    return m ? m[1].trim() : '';
  };

  return {
    important:  get(/(?:###\s*[⭐★🌟]\s*IMPORTANT|IMPORTANT QUESTIONS?)([\s\S]*?)(?=###|$)/i)
             || get(/(?:###\s*❓\s*)([\s\S]*?)(?=###|$)/i)
             || extractSection(raw, ['IMPORTANT', 'QUESTIONS']),
    notes:      get(/(?:###\s*📚\s*(?:TOPIC\s*)?NOTES?)([\s\S]*?)(?=###|$)/i)
             || extractSection(raw, ['NOTES', 'TOPICS']),
    tips:       get(/(?:###\s*💡\s*EXAM\s*TIPS?)([\s\S]*?)(?=###|$)/i)
             || extractSection(raw, ['TIPS', 'TRICKS']),
    priority:   get(/(?:###\s*🎯\s*PRIORITY)([\s\S]*?)(?=###|$)/i)
             || extractSection(raw, ['PRIORITY', 'FOCUS']),
    raw,
  };
}

function extractSection(text, keywords) {
  for (const kw of keywords) {
    const re = new RegExp(`(?:###[^\\n]*${kw}[^\\n]*\\n)([\\s\\S]*?)(?=###|$)`, 'i');
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  return '';
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'important', label: 'Important Qs',  icon: Star },
  { id: 'notes',     label: 'Topic Notes',   icon: BookOpen },
  { id: 'tips',      label: 'Exam Tips',     icon: Lightbulb },
  { id: 'priority',  label: 'Priority List', icon: Target },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PaperPage() {
  const [paper, setPaper]       = useState('');
  const [language, setLanguage] = useState('English');
  const [parsed, setParsed]     = useState(null);
  const [rawResult, setRawResult] = useState('');
  const [loading, setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState('important');
  const [phase, setPhase]       = useState('input');
  const [history, setHistory]   = useState([]);
  const [currentLabel, setCurrentLabel] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('paper_history') || '[]');
    setHistory(saved);
  }, []);

  const analyze = async () => {
    if (!paper.trim()) return;
    const label = paper.trim().split('\n')[0].slice(0, 60);
    setCurrentLabel(label);
    setLoading(true); setParsed(null); setRawResult('');
    try {
      const res = await API.post('/analyze-paper', { paper, language });
      const raw = res.data.result || '';
      setRawResult(raw);
      const p = parsePaperResult(raw);
      setParsed(p);
      setActiveTab('important');
      setPhase('result');
      const entry = { id: Date.now(), label, date: new Date().toLocaleDateString('en-IN'), raw, parsed: p };
      const updated = [entry, ...JSON.parse(localStorage.getItem('paper_history') || '[]')].slice(0, 15);
      localStorage.setItem('paper_history', JSON.stringify(updated));
      setHistory(updated);
    } catch { alert('Error! Please try again.'); }
    finally { setLoading(false); }
  };

  const loadHistory = (entry) => {
    setCurrentLabel(entry.label);
    setRawResult(entry.raw || '');
    setParsed(entry.parsed || parsePaperResult(entry.raw || ''));
    setActiveTab('important');
    setPhase('result');
  };

  const downloadTxt = () => {
    const b = new Blob([rawResult], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `paper-analysis-${Date.now()}.txt`;
    a.click();
  };

  // tab config
  const tabContent = {
    important: { bg: 'rgba(186,117,23,0.05)', border: `rgba(186,117,23,0.18)`, color: accent },
    notes:     { bg: 'rgba(37,99,235,0.04)',  border: 'rgba(37,99,235,0.14)',   color: '#2563EB' },
    tips:      { bg: 'rgba(5,150,105,0.05)',  border: 'rgba(5,150,105,0.16)',   color: '#059669' },
    priority:  { bg: 'rgba(220,38,38,0.04)',  border: 'rgba(220,38,38,0.14)',   color: '#DC2626' },
  };

  return (
    <Layout title="Previous Paper Analyzer" subtitle="Paste previous year paper → Get important questions, notes & tips">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* ── INPUT CARD ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(18px,3vw,26px)', marginBottom: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PenTool size={20} color={accent} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1C1409' }}>Paste Previous Year Paper</h2>
              <p style={{ fontSize: '12px', color: muted }}>Paste questions from exam papers</p>
            </div>
            {history.length > 0 && (
              <button onClick={() => setPhase(phase === 'history' ? (parsed ? 'result' : 'input') : 'history')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                <History size={13} /> History ({history.length})
              </button>
            )}
          </div>

          <textarea value={paper} onChange={e => setPaper(e.target.value)}
            placeholder={"e.g.\nQ1. What is OOP? Explain with example.\nQ2. Explain inheritance and polymorphism.\nQ3. Write a program to implement stack.\nQ4. What is recursion? Give example.\n..."}
            style={{ width: '100%', height: '180px', padding: '14px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: '#FEF9F0', fontSize: '14px', color: '#1C1409', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
            onFocus={e => e.target.style.borderColor = accent}
            onBlur={e => e.target.style.borderColor = cardBorder} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Languages size={15} color={muted} />
              <select value={language} onChange={e => setLanguage(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '9px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '13px', color: '#1C1409', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <option>English</option><option>Hindi</option>
              </select>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={analyze}
              disabled={loading || !paper.trim()}
              style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 700, background: loading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 14px rgba(186,117,23,0.3)`, fontFamily: 'inherit' }}>
              {loading
                ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Analyzing...</>
                : <><Upload size={15} /> Analyze Paper</>}
            </motion.button>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ width: '44px', height: '44px', border: `3px solid ${accentPale}`, borderTopColor: accent, borderRadius: '50%', margin: '0 auto 14px' }} />
            <p style={{ fontSize: '14px', color: muted }}>Analyzing your paper...</p>
          </div>
        )}

        {/* ── HISTORY ── */}
        {phase === 'history' && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Paper History</h2>
              <button onClick={() => setPhase(parsed ? 'result' : 'input')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>← Back</button>
            </div>
            {history.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', color: muted, background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}` }}>No history yet</div>
              : history.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.label}</div>
                    <div style={{ fontSize: '11px', color: muted, marginTop: '3px' }}>{h.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => loadHistory(h)}
                      style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> View
                    </button>
                    <button onClick={() => { const u = history.filter(x => x.id !== h.id); setHistory(u); localStorage.setItem('paper_history', JSON.stringify(u)); }}
                      style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))
            }
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && parsed && !loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

            {/* Result Header */}
            <div style={{ background: `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.04))`, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '16px 20px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: 'clamp(14px,2.5vw,18px)', fontWeight: 800, color: '#1C1409' }}>
                  Analysis Results
                </h2>
                <p style={{ fontSize: '12px', color: muted, marginTop: '3px' }}>{currentLabel.slice(0, 60)}</p>
              </div>
              <button onClick={downloadTxt}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '9px', border: `1px solid ${cardBorder}`, background: 'white', color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                <Download size={13} /> Save Notes
              </button>
            </div>

            {/* Tabs + Content */}
            <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, overflow: 'hidden' }}>

              {/* Tab Bar */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${cardBorder}`, overflowX: 'auto' }}>
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '13px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? accent : muted, borderBottom: `2px solid ${activeTab === tab.id ? accent : 'transparent'}`, whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.2s', flexShrink: 0 }}>
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }} style={{ padding: '20px 22px' }}>

                  {activeTab === 'important' && (
                    parsed.important
                      ? <FormattedContent
                          text={parsed.important}
                          bg={tabContent.important.bg}
                          border={tabContent.important.border}
                          indexColor={tabContent.important.color} />
                      : <FallbackRaw raw={parsed.raw} keyword="IMPORTANT" color={accent} />
                  )}

                  {activeTab === 'notes' && (
                    parsed.notes
                      ? <FormattedContent
                          text={parsed.notes}
                          bg={tabContent.notes.bg}
                          border={tabContent.notes.border}
                          indexColor={tabContent.notes.color} />
                      : <FallbackRaw raw={parsed.raw} keyword="NOTES" color="#2563EB" />
                  )}

                  {activeTab === 'tips' && (
                    parsed.tips
                      ? <FormattedContent
                          text={parsed.tips}
                          bg={tabContent.tips.bg}
                          border={tabContent.tips.border}
                          indexColor={tabContent.tips.color} />
                      : <FallbackRaw raw={parsed.raw} keyword="TIPS" color="#059669" />
                  )}

                  {activeTab === 'priority' && (
                    parsed.priority
                      ? <FormattedContent
                          text={parsed.priority}
                          bg={tabContent.priority.bg}
                          border={tabContent.priority.border}
                          indexColor={tabContent.priority.color} />
                      : <FallbackRaw raw={parsed.raw} keyword="PRIORITY" color="#DC2626" />
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {phase === 'input' && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity }}>
              <PenTool size={52} color="rgba(186,117,23,0.25)" style={{ margin: '0 auto 14px' }} />
            </motion.div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#4A3728' }}>Paste your previous year paper above</p>
            <p style={{ fontSize: '13px', color: muted, marginTop: '6px', maxWidth: '360px', margin: '6px auto 0' }}>
              AI will find important questions, topic notes, exam tips & priority list
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Fallback if section not parsed — show raw filtered lines
function FallbackRaw({ raw, keyword, color }) {
  const lines = raw.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.match(/^[=\-]{3,}/));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', padding: '11px 14px', borderRadius: '10px', background: `${color}08`, border: `1px solid ${color}20` }}>
          <p style={{ fontSize: '14px', color: '#1C1409', lineHeight: 1.7, margin: 0 }}>
            <Bold text={line} />
          </p>
        </div>
      ))}
    </div>
  );
}