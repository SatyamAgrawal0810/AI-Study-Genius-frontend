import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import {
  FileText, Upload, Download, BookOpen, HelpCircle,
  Lightbulb, BarChart2, Languages, History, Eye,
  Trash2, X, Brain, ChevronRight, CheckCircle2, Loader
} from 'lucide-react';

const muted = '#8A7055';

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

// ─── DETAIL DRAWER (slides in from right) ─────────────────────────────────────
function DetailDrawer({ item, type, language, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item) return;
    setLoading(true); setData(null);
    // Extract the core topic from the item text
    const topicText = String(item).replace(/\*\*/g, '').replace(/^\d+\.\s*/, '').trim().slice(0, 120);
    API.post('/tutor/explain', { topic: topicText, level: 'Intermediate', language })
      .then(res => setData(res.data.result))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [item]);

  const typeLabel = { notes: '📚 Detailed Notes', questions: '❓ Answer', keypoints: '🎯 Explanation', difficulty: '📊 Topic Guide' }[type] || '📖 Detail';

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 95vw)', background: '#FFFBF5', borderLeft: `1px solid ${cardBorder}`, zIndex: 400, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(186,117,23,0.12)' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${cardBorder}`, background: `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.04))`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>{typeLabel}</div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', lineHeight: 1.5 }}>
              <Bold text={String(item).slice(0, 120)} />
            </p>
          </div>
          <button onClick={onClose}
            style={{ width: '30px', height: '30px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={14} color={muted} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: '36px', height: '36px', border: `3px solid ${accentPale}`, borderTopColor: accent, borderRadius: '50%', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: muted }}>Loading detailed explanation...</p>
          </div>
        ) : data ? (
          <div>
            {/* Analogy */}
            {data.analogy && (
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ANALOGY</p>
                <p style={{ fontSize: '13px', color: '#4A3728', lineHeight: 1.7, margin: 0 }}>{data.analogy}</p>
              </div>
            )}

            {/* Explanation */}
            {data.explanation && (
              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EXPLANATION</p>
                <div style={{ fontSize: '14px', color: '#4A3728', lineHeight: 1.8 }}>
                  {String(data.explanation).split('\n').map((line, i) => {
                    const t = line.trim();
                    if (!t) return <div key={i} style={{ height: '6px' }} />;
                    if (t.match(/^[\*\-]\s/)) return (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: accent, flexShrink: 0, marginTop: '9px' }} />
                        <p style={{ margin: 0 }}><Bold text={t} /></p>
                      </div>
                    );
                    return <p key={i} style={{ margin: '0 0 6px' }}><Bold text={t} /></p>;
                  })}
                </div>
              </div>
            )}

            {/* Key Points */}
            {data.key_points?.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KEY POINTS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {data.key_points.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', padding: '9px 12px', borderRadius: '9px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.14)' }}>
                      <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '13px', color: '#1C1409', lineHeight: 1.6, margin: 0 }}><Bold text={typeof p === 'string' ? p : JSON.stringify(p)} /></p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Example */}
            {data.example && (
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#F8F5F0', border: `1px solid ${cardBorder}` }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: muted, marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EXAMPLE</p>
                <pre style={{ fontSize: '13px', color: '#1C1409', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{data.example}</pre>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: muted, fontSize: '13px' }}>Could not load details. Try again.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${cardBorder}`, flexShrink: 0 }}>
        <p style={{ fontSize: '11px', color: muted, textAlign: 'center' }}>Tap any other item to explore it</p>
      </div>
    </motion.div>
  );
}

// ─── PARSER ──────────────────────────────────────────────────────────────────
function parseResult(raw) {
  if (!raw) return { units: [] };
  const units = [];
  const blocks = raw.split(/(?=\*\*UNIT [IVX]+)/gi).filter(b => b.trim());
  for (const block of blocks) {
    const titleMatch = block.match(/\*\*UNIT ([IVX]+)[:\s]+(.+?)\*\*/i);
    const unit = {
      title: titleMatch ? `Unit ${titleMatch[1]}: ${titleMatch[2].trim()}` : 'Unit',
      notes: [], questions: [], keypoints: [], difficulty: [],
    };
    const getSection = (pattern) => { const m = block.match(pattern); return m ? m[1].trim() : ''; };
    const notesRaw   = getSection(/### 📚 NOTES([\s\S]*?)(?=###|$)/i);
    const questRaw   = getSection(/### ❓ QUESTIONS([\s\S]*?)(?=###|$)/i);
    const keyRaw     = getSection(/### 🎯 KEY POINTS([\s\S]*?)(?=###|$)/i);
    const diffRaw    = getSection(/### 📊 DIFFICULTY([\s\S]*?)(?=###|---|$)/i);

    unit.notes     = notesRaw.split('\n').filter(l => l.trim() && l.match(/^\d+\./)).map(l => l.trim());
    unit.questions = questRaw.split('\n').filter(l => l.trim() && l.match(/^\d+\./)).map(l => l.trim());
    unit.keypoints = keyRaw.split('\n').map(l => l.replace(/^\s*[\*\-•]\s*/, '').trim()).filter(l => l && !l.startsWith('#'));
    unit.difficulty = diffRaw.split('\n').map(l => {
      const m = l.match(/^\*?\s*(.+?):\s*(Easy|Medium|Hard)/i);
      return m ? { topic: m[1].trim().replace(/\*\*/g, ''), level: m[2] } : null;
    }).filter(Boolean);
    units.push(unit);
  }
  return { units };
}

function diffColor(d) { return d === 'Easy' ? '#059669' : d === 'Medium' ? '#D97706' : '#DC2626'; }
function diffBg(d)    { return d === 'Easy' ? 'rgba(5,150,105,0.08)' : d === 'Medium' ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)'; }

const TABS = [
  { id: 'notes',      label: 'Notes',      icon: BookOpen },
  { id: 'questions',  label: 'Questions',  icon: HelpCircle },
  { id: 'keypoints',  label: 'Key Points', icon: Lightbulb },
  { id: 'difficulty', label: 'Difficulty', icon: BarChart2 },
];

// ─── CLICKABLE ITEM ───────────────────────────────────────────────────────────
function ClickableItem({ text, index, icon: Icon, bg, border, iconColor, badge, onDetailClick }) {
  return (
    <motion.div whileHover={{ x: 3, scale: 1.005 }} whileTap={{ scale: 0.99 }}
      onClick={() => onDetailClick(text)}
      style={{ display: 'flex', gap: '10px', padding: '13px 15px', borderRadius: '12px', background: bg, border: `1px solid ${border}`, cursor: 'pointer', alignItems: 'flex-start', position: 'relative', transition: 'all 0.15s' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: iconColor, flexShrink: 0 }}>
        {badge || (index + 1)}
      </div>
      <p style={{ fontSize: '14px', color: '#1C1409', lineHeight: 1.7, margin: 0, flex: 1 }}>
        <Bold text={text} />
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, marginTop: '2px' }}>
        <span style={{ fontSize: '10px', color: iconColor, fontWeight: 600, opacity: 0.7 }}>Detail</span>
        <ChevronRight size={12} color={iconColor} />
      </div>
    </motion.div>
  );
}

// ─── UNIT CARD ────────────────────────────────────────────────────────────────
function UnitCard({ unit, index, language, onDetailClick }) {
  const [activeTab, setActiveTab] = useState('notes');
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, overflow: 'hidden', marginBottom: '14px' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', background: `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.04))`, borderBottom: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'white', flexShrink: 0 }}>{index + 1}</div>
        <h3 style={{ fontSize: 'clamp(13px,2vw,15px)', fontWeight: 800, color: '#1C1409' }}>{unit.title}</h3>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${cardBorder}`, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '11px 15px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? accent : muted, borderBottom: `2px solid ${activeTab === tab.id ? accent : 'transparent'}`, whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.2s', flexShrink: 0 }}>
            <tab.icon size={13} />{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }} style={{ padding: '16px 18px' }}>

          {/* NOTES — clickable */}
          {activeTab === 'notes' && (
            <div>
              {unit.notes.length === 0 ? (
                <p style={{ color: muted, fontSize: '13px' }}>No notes available.</p>
              ) : (
                <>
                  <p style={{ fontSize: '11px', color: muted, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ChevronRight size={11} /> Click any note for detailed explanation
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {unit.notes.map((note, i) => (
                      <ClickableItem key={i} text={note} index={i}
                        bg="#FEF9F0" border={cardBorder} iconColor={accent}
                        onDetailClick={onDetailClick} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* QUESTIONS — clickable (shows answer) */}
          {activeTab === 'questions' && (
            <div>
              {unit.questions.length === 0 ? (
                <p style={{ color: muted, fontSize: '13px' }}>No questions available.</p>
              ) : (
                <>
                  <p style={{ fontSize: '11px', color: muted, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ChevronRight size={11} /> Click any question to see detailed answer
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {unit.questions.map((q, i) => (
                      <ClickableItem key={i} text={q} index={i} badge={`Q${i + 1}`}
                        bg="rgba(37,99,235,0.04)" border="rgba(37,99,235,0.14)" iconColor="#2563EB"
                        onDetailClick={onDetailClick} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* KEY POINTS — clickable */}
          {activeTab === 'keypoints' && (
            <div>
              {unit.keypoints.length === 0 ? (
                <p style={{ color: muted, fontSize: '13px' }}>No key points.</p>
              ) : (
                <>
                  <p style={{ fontSize: '11px', color: muted, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ChevronRight size={11} /> Click any concept for detailed explanation
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {unit.keypoints.map((kp, i) => (
                      <ClickableItem key={i} text={kp} index={i}
                        bg="rgba(5,150,105,0.05)" border="rgba(5,150,105,0.15)" iconColor="#059669"
                        onDetailClick={onDetailClick} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* DIFFICULTY */}
          {activeTab === 'difficulty' && (
            <div>
              {unit.difficulty.length === 0 ? (
                <p style={{ color: muted, fontSize: '13px' }}>No difficulty info.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {unit.difficulty.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: '#FEF9F0', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{d.topic}</span>
                      <span style={{ padding: '3px 12px', borderRadius: '100px', background: diffBg(d.level), fontSize: '12px', fontWeight: 800, color: diffColor(d.level) }}>{d.level}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {['Easy', 'Medium', 'Hard'].map(lvl => {
                      const count = unit.difficulty.filter(d => d.level === lvl).length;
                      if (!count) return null;
                      return <span key={lvl} style={{ padding: '3px 12px', borderRadius: '100px', background: diffBg(lvl), fontSize: '11px', fontWeight: 700, color: diffColor(lvl) }}>{lvl}: {count}</span>;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SyllabusPage() {
  const [syllabus, setSyllabus]   = useState('');
  const [language, setLanguage]   = useState('English');
  const [parsed, setParsed]       = useState(null);
  const [rawResult, setRawResult] = useState('');
  const [loading, setLoading]     = useState(false);
  const [phase, setPhase]         = useState('input');
  const [history, setHistory]     = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [detailItem, setDetailItem] = useState(null);
  const [detailType, setDetailType] = useState('notes');

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('syllabus_history') || '[]'));
  }, []);

  const analyze = async () => {
    if (!syllabus.trim()) return;
    const label = syllabus.trim().split('\n')[0].slice(0, 60);
    setCurrentTopic(label);
    setLoading(true); setParsed(null); setRawResult(''); setDetailItem(null);
    try {
      const res = await API.post('/analyze-syllabus', { syllabus, language });
      const raw = res.data.result || '';
      setRawResult(raw);
      const p = parseResult(raw);
      setParsed(p); setPhase('result');
      const entry = { id: Date.now(), topic: label, date: new Date().toLocaleDateString('en-IN'), raw, parsed: p };
      const updated = [entry, ...JSON.parse(localStorage.getItem('syllabus_history') || '[]')].slice(0, 15);
      localStorage.setItem('syllabus_history', JSON.stringify(updated));
      setHistory(updated);
    } catch { alert('Error! Please try again.'); }
    finally { setLoading(false); }
  };

  const loadHistory = (entry) => {
    setCurrentTopic(entry.topic); setRawResult(entry.raw || '');
    setParsed(entry.parsed || parseResult(entry.raw || ''));
    setPhase('result'); setDetailItem(null);
  };

  const handleDetailClick = (text) => {
    setDetailItem(text);
  };

  return (
    <Layout title="Syllabus Analyzer" subtitle="Upload syllabus → Get unit-wise notes, questions & key points">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Detail Drawer Overlay */}
        <AnimatePresence>
          {detailItem && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDetailItem(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 399 }} />
              <DetailDrawer item={detailItem} type={detailType} language={language} onClose={() => setDetailItem(null)} />
            </>
          )}
        </AnimatePresence>

        {/* Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(18px,3vw,26px)', marginBottom: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color={accent} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1C1409' }}>Enter Your Syllabus</h2>
              <p style={{ fontSize: '12px', color: muted }}>Paste topics, chapters or full syllabus text</p>
            </div>
            {history.length > 0 && (
              <button onClick={() => setPhase(phase === 'history' ? (parsed ? 'result' : 'input') : 'history')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                <History size={13} /> History ({history.length})
              </button>
            )}
          </div>

          <textarea value={syllabus} onChange={e => setSyllabus(e.target.value)}
            placeholder={"e.g.\nUNIT I: Python Basics - Variables, Loops, Functions\nUNIT II: OOP - Classes, Inheritance\nUNIT III: Data Structures..."}
            style={{ width: '100%', height: '140px', padding: '13px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: '#FEF9F0', fontSize: '14px', color: '#1C1409', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.65 }}
            onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Languages size={15} color={muted} />
              <select value={language} onChange={e => setLanguage(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '9px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '13px', color: '#1C1409', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <option>English</option><option>Hindi</option>
              </select>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={analyze}
              disabled={loading || !syllabus.trim()}
              style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 700, background: loading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 14px rgba(186,117,23,0.35)`, fontFamily: 'inherit' }}>
              {loading
                ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />Analyzing...</>
                : <><Upload size={15} />Analyze Syllabus</>}
            </motion.button>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ width: '44px', height: '44px', border: `3px solid ${accentPale}`, borderTopColor: accent, borderRadius: '50%', margin: '0 auto 14px' }} />
            <p style={{ fontSize: '14px', color: muted }}>Generating unit-wise notes...</p>
          </div>
        )}

        {/* History */}
        {phase === 'history' && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Saved Syllabuses</h2>
              <button onClick={() => setPhase(parsed ? 'result' : 'input')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>← Back</button>
            </div>
            {history.map((h, i) => (
              <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.topic}</div>
                  <div style={{ fontSize: '11px', color: muted }}>{h.date} · {h.parsed?.units?.length || 0} units</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => loadHistory(h)}
                    style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} /> View
                  </button>
                  <button onClick={() => { const u = history.filter(x => x.id !== h.id); setHistory(u); localStorage.setItem('syllabus_history', JSON.stringify(u)); }}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1C1409' }}>{currentTopic}</h2>
                <p style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>
                  {parsed.units?.length || 0} units · Click any item for detailed explanation
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { const b = new Blob([rawResult], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'syllabus-notes.txt'; a.click(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '9px', border: `1px solid ${cardBorder}`, background: accentPale, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                  <Download size={13} /> Save
                </button>
                <button onClick={() => { setParsed(null); setPhase('input'); setSyllabus(''); setDetailItem(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '9px', border: `1px solid ${cardBorder}`, background: 'white', color: '#1C1409', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                  New
                </button>
              </div>
            </div>

            {parsed.units?.length > 0
              ? parsed.units.map((unit, i) => (
                <UnitCard key={i} unit={unit} index={i} language={language} onDetailClick={handleDetailClick} />
              ))
              : <div style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '24px' }}>
                  <pre style={{ fontSize: '13px', color: '#1C1409', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{rawResult}</pre>
                </div>
            }
          </motion.div>
        )}

        {/* Empty */}
        {phase === 'input' && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity }}>
              <FileText size={52} color="rgba(186,117,23,0.25)" style={{ margin: '0 auto 14px' }} />
            </motion.div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#4A3728' }}>Enter your syllabus above</p>
            <p style={{ fontSize: '13px', color: muted, marginTop: '6px', maxWidth: '380px', margin: '6px auto 0' }}>
              AI generates unit-wise notes • Click any note, question or key point for detailed explanation
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}