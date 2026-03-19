import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import {
  Search, BookOpen, Map, Youtube, HelpCircle, Lightbulb,
  Clock, CheckCircle2, Star, Play, ChevronRight, ChevronDown,
  History, Eye, Trash2, Download, Brain, X
} from 'lucide-react';

const muted = '#8A7055';
const POPULAR_TOPICS = ['Machine Learning','Python OOP','Data Structures','Agentic AI','React JS','Deep Learning','System Design','SQL Basics'];

// ─── BOLD RENDERER ────────────────────────────────────────────────────────────
function Bold({ text }) {
  if (!text) return null;
  const clean = String(text).replace(/^\s*[\*\-]\s+/, '').replace(/^\d+\.\s*/, '').trim();
  const parts = clean.split(/(\*{1,2}[^*]+\*{1,2})/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*{1,2}[^*]+\*{1,2}$/.test(p))
          return <strong key={i} style={{ fontWeight: 700, color: '#1C1409' }}>{p.replace(/\*{1,2}/g, '')}</strong>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// ─── NOTES RENDERER ───────────────────────────────────────────────────────────
function NotesContent({ text }) {
  if (!text) return <p style={{ color: muted, fontSize: '14px' }}>No notes available.</p>;
  return (
    <div>
      {text.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t || t.startsWith('#') || t.match(/^[=\-]{3,}/)) return null;
        const isBullet = t.match(/^[\*\-]\s+/);
        return isBullet ? (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '7px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, flexShrink: 0, marginTop: '9px' }} />
            <p style={{ fontSize: '14px', color: '#4A3728', lineHeight: 1.75, margin: 0 }}><Bold text={t} /></p>
          </div>
        ) : (
          <p key={i} style={{ fontSize: '14px', color: '#4A3728', lineHeight: 1.8, marginBottom: '6px' }}><Bold text={t} /></p>
        );
      })}
    </div>
  );
}

// ─── EXPANDABLE Q&A ITEM ─────────────────────────────────────────────────────
function QAItem({ question, index, language }) {
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const loadAnswer = async () => {
    if (answer !== null) { setExpanded(p => !p); return; }
    setExpanded(true); setLoading(true);
    try {
      const res = await API.post('/tutor/explain', { topic: question.replace(/^\d+\.\s*/, '').slice(0, 120), level: 'Intermediate', language });
      const d = res.data.result;
      // Combine explanation + key_points into a readable answer
      let ans = d.explanation || '';
      if (d.key_points?.length) ans += '\n\nKey Points:\n' + d.key_points.map(p => `• ${typeof p === 'string' ? p : JSON.stringify(p)}`).join('\n');
      setAnswer(ans || 'No answer available.');
    } catch { setAnswer('Could not load answer. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ borderRadius: '12px', border: `1px solid ${expanded ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.12)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      {/* Question row */}
      <motion.div whileHover={{ backgroundColor: 'rgba(37,99,235,0.05)' }}
        onClick={loadAnswer}
        style={{ display: 'flex', gap: '12px', padding: '13px 16px', background: expanded ? 'rgba(37,99,235,0.04)' : 'white', cursor: 'pointer', alignItems: 'flex-start' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#2563EB', flexShrink: 0 }}>
          Q{index + 1}
        </div>
        <p style={{ fontSize: '14px', color: '#1C1409', lineHeight: 1.6, margin: 0, flex: 1 }}><Bold text={question} /></p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: 600 }}>{expanded ? 'Hide' : 'Answer'}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} color="#2563EB" />
          </motion.div>
        </div>
      </motion.div>

      {/* Answer */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(37,99,235,0.12)', background: 'rgba(37,99,235,0.02)' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '18px', height: '18px', border: `2px solid rgba(37,99,235,0.2)`, borderTopColor: '#2563EB', borderRadius: '50%', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: muted }}>Loading answer...</span>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <CheckCircle2 size={14} color="#059669" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Answer</span>
                  </div>
                  <NotesContent text={answer} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── EXPANDABLE ROADMAP STEP ─────────────────────────────────────────────────
function RoadmapStep({ step, index, language }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail]     = useState(null);
  const [loading, setLoading]   = useState(false);

  const loadDetail = async () => {
    if (detail !== null) { setExpanded(p => !p); return; }
    setExpanded(true); setLoading(true);
    try {
      const res = await API.post('/tutor/explain', { topic: step.title, level: 'Beginner', language });
      setDetail(res.data.result);
    } catch { setDetail({ explanation: 'Could not load details.' }); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ borderRadius: '14px', border: `1px solid ${expanded ? cardBorder : 'rgba(186,117,23,0.12)'}`, overflow: 'hidden', background: 'white' }}>
      {/* Step header */}
      <motion.div whileHover={{ backgroundColor: accentPale }} onClick={loadDetail}
        style={{ display: 'flex', gap: '14px', padding: '16px', cursor: 'pointer', alignItems: 'flex-start', background: expanded ? accentPale : 'white', transition: 'background 0.2s' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', flexWrap: 'wrap', gap: '6px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1C1409' }}>{step.title}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {step.duration && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 9px', borderRadius: '100px', background: accentPale, fontSize: '11px', fontWeight: 700, color: accent }}>
                  <Clock size={10} />{step.duration}
                </span>
              )}
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} color={accent} />
              </motion.div>
            </div>
          </div>
          {step.steps?.filter(s => s).map((s, j) => (
            <div key={j} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
              <ChevronRight size={12} color={muted} style={{ flexShrink: 0, marginTop: '3px' }} />
              <span style={{ fontSize: '12px', color: muted, lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderTop: `1px solid ${cardBorder}`, background: '#FEF9F0' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '18px', height: '18px', border: `2px solid ${accentPale}`, borderTopColor: accent, borderRadius: '50%' }} />
                  <span style={{ fontSize: '13px', color: muted }}>Loading detailed guide...</span>
                </div>
              ) : detail ? (
                <div>
                  {detail.analogy && (
                    <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', marginBottom: '12px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', marginBottom: '4px' }}>ANALOGY</p>
                      <p style={{ fontSize: '13px', color: '#4A3728', lineHeight: 1.65, margin: 0 }}>{detail.analogy}</p>
                    </div>
                  )}
                  {detail.explanation && <NotesContent text={typeof detail.explanation === 'string' ? detail.explanation : ''} />}
                  {detail.key_points?.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {detail.key_points.slice(0, 4).map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', padding: '8px 12px', borderRadius: '9px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.14)' }}>
                          <CheckCircle2 size={13} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <p style={{ fontSize: '13px', color: '#1C1409', lineHeight: 1.6, margin: 0 }}>{typeof p === 'string' ? p.replace(/\*\*/g, '') : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {detail.example && (
                    <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '10px', background: '#F0EDE8', border: `1px solid ${cardBorder}` }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: muted, marginBottom: '6px' }}>EXAMPLE</p>
                      <pre style={{ fontSize: '12px', color: '#1C1409', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{detail.example}</pre>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PARSER ──────────────────────────────────────────────────────────────────
function parseTopicResult(raw) {
  if (!raw) return null;
  const get = (p) => { const m = raw.match(p); return m ? m[1].trim() : ''; };
  const result = {
    title: '', notes: '', roadmap: [], videos: [],
    keypoints: [], realworld: [], questions: [], time_needed: '',
  };
  const tm = raw.match(/^\*\*(.+?)\*\*|^#+ (.+)/m);
  if (tm) result.title = (tm[1] || tm[2] || '').replace(/[:\*#]/g, '').trim();
  result.notes     = get(/### 📚 DETAILED NOTES([\s\S]*?)(?=###|$)/i);
  const roadRaw    = get(/### 🗺️ ROADMAP([\s\S]*?)(?=###|$)/i);
  const vidRaw     = get(/### 🎥 VIDEO TOPICS([\s\S]*?)(?=###|$)/i);
  const keyRaw     = get(/### 📖 KEY CONCEPTS([\s\S]*?)(?=###|$)/i);
  const realRaw    = get(/### 💡 REAL WORLD USE([\s\S]*?)(?=###|$)/i);
  const questRaw   = get(/### ❓ PRACTICE QUESTIONS([\s\S]*?)(?=###|$)/i);
  const timeRaw    = get(/### ⏱️ TIME NEEDED([\s\S]*?)(?=###|$)/i);

  // Roadmap
  roadRaw.split(/\n(?=\d+\.)/).filter(b => b.trim()).forEach(block => {
    const m = block.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?\s*(?:\((.+?)\))?([\s\S]*)/);
    if (m) {
      const steps = (m[3] || '').split('\n').map(l => l.replace(/^\s*[\*\-•]\s*/, '').replace(/\*\*/g, '').trim()).filter(l => l && !l.startsWith('#'));
      result.roadmap.push({ title: m[1].replace(/\*\*/g, '').trim(), duration: m[2] || '', steps });
    }
  });

  // Videos
  vidRaw.split('\n').filter(l => l.trim()).forEach(line => {
    const m = line.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?[:\-]\s*(.*)/);
    if (m) result.videos.push({ title: m[1].replace(/\*\*/g, '').trim(), desc: m[2].trim() });
    else { const m2 = line.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?$/); if (m2) result.videos.push({ title: m2[1].replace(/\*\*/g, '').trim(), desc: '' }); }
  });

  result.keypoints = keyRaw.split('\n').map(l => l.replace(/^\s*[\*\-•]\s*/, '').replace(/\*\*/g, '').trim()).filter(l => l && !l.startsWith('#'));
  result.realworld = realRaw.split('\n').map(l => l.replace(/^\s*[\*\-•]\s*/, '').replace(/\*\*/g, '').trim()).filter(l => l && !l.startsWith('#'));
  result.questions = questRaw.split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(l => l && !l.startsWith('#'));
  result.time_needed = timeRaw.split('\n').find(l => l.trim() && !l.startsWith('*') && !l.startsWith('#')) || '';
  return result;
}

const TABS = [
  { id: 'notes',     label: 'Notes',        icon: BookOpen },
  { id: 'roadmap',   label: 'Roadmap',      icon: Map },
  { id: 'questions', label: 'Practice Q',   icon: HelpCircle },
  { id: 'videos',    label: 'Videos',       icon: Youtube },
  { id: 'keypoints', label: 'Key Concepts', icon: Lightbulb },
  { id: 'realworld', label: 'Real World',   icon: Star },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TopicPage() {
  const [topic, setTopic]         = useState('');
  const [language, setLanguage]   = useState('English');
  const [parsed, setParsed]       = useState(null);
  const [rawResult, setRawResult] = useState('');
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const [phase, setPhase]         = useState('input');
  const [history, setHistory]     = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('topic_history') || '[]'));
  }, []);

  const search = async (t) => {
    const q = (t || topic).trim();
    if (!q) return;
    setCurrentTopic(q); setTopic(q);
    setLoading(true); setParsed(null); setRawResult('');
    try {
      const res = await API.post('/analyze-topic', { topic: q, language });
      const raw = res.data.result || '';
      setRawResult(raw);
      const p = parseTopicResult(raw);
      setParsed(p); setActiveTab('notes'); setPhase('result');
      const entry = { id: Date.now(), topic: q, date: new Date().toLocaleDateString('en-IN'), raw, parsed: p };
      const updated = [entry, ...JSON.parse(localStorage.getItem('topic_history') || '[]')].slice(0, 20);
      localStorage.setItem('topic_history', JSON.stringify(updated));
      setHistory(updated);
    } catch { alert('Error!'); }
    finally { setLoading(false); }
  };

  const loadHistory = (entry) => {
    setCurrentTopic(entry.topic); setTopic(entry.topic);
    setRawResult(entry.raw || '');
    setParsed(entry.parsed || parseTopicResult(entry.raw || ''));
    setActiveTab('notes'); setPhase('result');
  };

  return (
    <Layout title="Topic Learner" subtitle="Search any topic → Clickable notes, Q&A, roadmap details">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(16px,3vw,22px)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
              <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: muted, pointerEvents: 'none' }} />
              <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="e.g. Agentic AI, Machine Learning, Python..."
                style={{ width: '100%', padding: '12px 14px 12px 44px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: '#FEF9F0', fontSize: '15px', color: '#1C1409', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                style={{ padding: '12px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '13px', color: '#1C1409', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <option>English</option><option>Hindi</option>
              </select>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => search()} disabled={loading || !topic.trim()}
                style={{ padding: '12px 22px', borderRadius: '12px', fontWeight: 700, background: loading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: `0 4px 14px rgba(186,117,23,0.35)` }}>
                {loading ? '...' : 'Search'}
              </motion.button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Popular Topics</p>
            {history.length > 0 && (
              <button onClick={() => setPhase(phase === 'history' ? (parsed ? 'result' : 'input') : 'history')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '7px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit' }}>
                <History size={11} /> History ({history.length})
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {POPULAR_TOPICS.map((t, i) => (
              <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => search(t)}
                style={{ padding: '6px 13px', borderRadius: '100px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '12px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ width: '44px', height: '44px', border: `3px solid ${accentPale}`, borderTopColor: accent, borderRadius: '50%', margin: '0 auto 14px' }} />
            <p style={{ fontSize: '14px', color: muted }}>Generating notes for "<strong>{currentTopic}</strong>"...</p>
          </div>
        )}

        {/* History */}
        {phase === 'history' && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Search History</h2>
              <button onClick={() => setPhase(parsed ? 'result' : 'input')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>← Back</button>
            </div>
            {history.map((h, i) => (
              <motion.div key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.topic}</div>
                  <div style={{ fontSize: '11px', color: muted }}>{h.date}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => loadHistory(h)} style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} /> View
                  </button>
                  <button onClick={() => { const u = history.filter(x => x.id !== h.id); setHistory(u); localStorage.setItem('topic_history', JSON.stringify(u)); }}
                    style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Result */}
        {phase === 'result' && parsed && !loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.04))`, borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '14px 20px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: 'clamp(15px,2.5vw,19px)', fontWeight: 900, color: '#1C1409', letterSpacing: '-0.5px' }}>{parsed.title || currentTopic}</h2>
                {parsed.time_needed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                    <Clock size={12} color={muted} />
                    <span style={{ fontSize: '12px', color: muted }}>{parsed.time_needed.replace(/\*\*/g, '')}</span>
                  </div>
                )}
              </div>
              <button onClick={() => { const b = new Blob([rawResult], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${currentTopic}-notes.txt`; a.click(); }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '9px', border: `1px solid ${cardBorder}`, background: 'white', color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                <Download size={13} /> Save Notes
              </button>
            </div>

            {/* Tabs */}
            <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, marginBottom: '14px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${cardBorder}`, overflowX: 'auto' }}>
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '12px 15px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? accent : muted, borderBottom: `2px solid ${activeTab === tab.id ? accent : 'transparent'}`, whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.2s', flexShrink: 0 }}>
                    <tab.icon size={13} />{tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }} style={{ padding: '18px 20px' }}>

                  {/* NOTES */}
                  {activeTab === 'notes' && <NotesContent text={parsed.notes} />}

                  {/* ROADMAP — expandable steps */}
                  {activeTab === 'roadmap' && (
                    parsed.roadmap?.length === 0
                      ? <p style={{ color: muted, fontSize: '14px' }}>No roadmap available.</p>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <p style={{ fontSize: '11px', color: muted, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ChevronRight size={11} /> Click any step to see detailed guide
                          </p>
                          {parsed.roadmap.map((step, i) => (
                            <RoadmapStep key={i} step={step} index={i} language={language} />
                          ))}
                        </div>
                  )}

                  {/* PRACTICE Q — expandable answers */}
                  {activeTab === 'questions' && (
                    parsed.questions?.length === 0
                      ? <p style={{ color: muted, fontSize: '14px' }}>No questions available.</p>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p style={{ fontSize: '11px', color: muted, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ChevronRight size={11} /> Click any question to reveal the answer
                          </p>
                          {parsed.questions.map((q, i) => (
                            <QAItem key={i} question={q} index={i} language={language} />
                          ))}
                        </div>
                  )}

                  {/* VIDEOS */}
                  {activeTab === 'videos' && (
                    parsed.videos?.length === 0
                      ? <p style={{ color: muted, fontSize: '14px' }}>No videos available.</p>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {parsed.videos.map((v, i) => (
                            <motion.a key={i} whileHover={{ x: 4 }}
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.title)}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ display: 'flex', gap: '12px', padding: '13px 16px', borderRadius: '12px', background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)', textDecoration: 'none' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Play size={16} color="#DC2626" fill="#DC2626" />
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', marginBottom: '3px' }}>{v.title}</div>
                                {v.desc && <div style={{ fontSize: '12px', color: muted }}>{v.desc}</div>}
                                <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, marginTop: '3px' }}>→ Search on YouTube</div>
                              </div>
                            </motion.a>
                          ))}
                        </div>
                  )}

                  {/* KEY CONCEPTS */}
                  {activeTab === 'keypoints' && (
                    parsed.keypoints?.length === 0
                      ? <p style={{ color: muted, fontSize: '14px' }}>No concepts.</p>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {parsed.keypoints.map((kp, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '11px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.14)' }}>
                              <CheckCircle2 size={15} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <p style={{ fontSize: '14px', color: '#1C1409', lineHeight: 1.65, margin: 0 }}><Bold text={kp} /></p>
                            </div>
                          ))}
                        </div>
                  )}

                  {/* REAL WORLD */}
                  {activeTab === 'realworld' && (
                    parsed.realworld?.length === 0
                      ? <p style={{ color: muted, fontSize: '14px' }}>No examples.</p>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {parsed.realworld.map((rw, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '11px', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.13)' }}>
                              <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#7C3AED', flexShrink: 0 }}>{i+1}</div>
                              <p style={{ fontSize: '14px', color: '#1C1409', lineHeight: 1.65, margin: 0 }}><Bold text={rw} /></p>
                            </div>
                          ))}
                        </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Related */}
            <div style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Related</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {POPULAR_TOPICS.filter(t => t.toLowerCase() !== currentTopic.toLowerCase()).slice(0, 6).map((t, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => search(t)}
                    style={{ padding: '6px 13px', borderRadius: '100px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '12px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty */}
        {phase === 'input' && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity }}>
              <BookOpen size={52} color="rgba(186,117,23,0.25)" style={{ margin: '0 auto 14px' }} />
            </motion.div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#4A3728' }}>Search any topic to get started</p>
            <p style={{ fontSize: '13px', color: muted, marginTop: '6px', maxWidth: '360px', margin: '6px auto 0' }}>
              Click questions for answers • Click roadmap steps for guides • Save notes anytime
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}