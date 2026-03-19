import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import {
  CreditCard, RotateCcw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Sparkles, History, Eye, Trash2
} from 'lucide-react';

const muted = '#8A7055';

export default function FlashcardsPage() {
  const [topic, setTopic]     = useState('');
  const [numCards, setNumCards] = useState(10);
  const [language, setLanguage] = useState('English');
  const [cards, setCards]     = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown]     = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase]     = useState('setup'); // setup | study | result | history
  const [history, setHistory] = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('flashcards_history') || '[]');
    setHistory(saved);
  }, []);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setCurrentTopic(topic);
    try {
      const res = await API.post('/generate-flashcards', { topic, num_cards: numCards, language });
      const newCards = res.data.flashcards || [];
      setCards(newCards);
      setCurrent(0); setFlipped(false); setKnown([]); setUnknown([]);
      setPhase('study');
      // save to history
      const entry = {
        id: Date.now(),
        topic,
        date: new Date().toLocaleDateString('en-IN'),
        cards: newCards,
        total: newCards.length,
      };
      const updated = [entry, ...JSON.parse(localStorage.getItem('flashcards_history') || '[]')].slice(0, 20);
      localStorage.setItem('flashcards_history', JSON.stringify(updated));
      setHistory(updated);
    } catch { alert('Error! Please try again.'); }
    finally { setLoading(false); }
  };

  const loadHistory = (entry) => {
    setCurrentTopic(entry.topic);
    setTopic(entry.topic);
    setCards(entry.cards || []);
    setCurrent(0); setFlipped(false); setKnown([]); setUnknown([]);
    setPhase('study');
  };

  const markKnown = () => { setKnown(p => [...p, current]); next(); };
  const markUnknown = () => { setUnknown(p => [...p, current]); next(); };
  const next = () => {
    if (current < cards.length - 1) { setCurrent(p => p + 1); setFlipped(false); }
    else setPhase('result');
  };
  const prev = () => { if (current > 0) { setCurrent(p => p - 1); setFlipped(false); } };

  const diffColor = (d) => d === 'Easy' ? '#059669' : d === 'Medium' ? '#D97706' : '#DC2626';
  const diffBg = (d) => d === 'Easy' ? 'rgba(5,150,105,0.08)' : d === 'Medium' ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)';

  return (
    <Layout title="Flashcards" subtitle="AI-generated flashcards for quick revision">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(20px,3vw,32px)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={22} color={accent} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Generate Flashcards</h2>
                <p style={{ fontSize: '12px', color: muted }}>Flip through AI-generated revision cards</p>
              </div>
              {history.length > 0 && (
                <button onClick={() => setPhase('history')}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                  <History size={13} /> History ({history.length})
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Topic *</label>
                <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()}
                  placeholder="e.g. Python OOP, Machine Learning Basics..."
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Number of Cards: {numCards}</label>
                <input type="range" min="5" max="20" value={numCards} onChange={e => setNumCards(+e.target.value)} style={{ width: '100%', accentColor: accent }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: muted, marginTop: '3px' }}>
                  <span>5</span><span>20</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option>English</option><option>Hindi</option>
                </select>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generate}
              disabled={loading || !topic.trim()}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800, background: loading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit', boxShadow: `0 4px 16px rgba(186,117,23,0.35)` }}>
              {loading
                ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />Generating...</>
                : <><Sparkles size={16} />Generate {numCards} Flashcards</>}
            </motion.button>

            {/* Recent History Preview */}
            {history.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Sets</p>
                  <button onClick={() => setPhase('history')}
                    style={{ fontSize: '12px', color: accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    View All <ChevronRight size={12} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {history.slice(0, 3).map(h => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: accentPale, flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{h.topic}</div>
                        <div style={{ fontSize: '11px', color: muted }}>{h.date} · {h.total} cards</div>
                      </div>
                      <button onClick={() => loadHistory(h)}
                        style={{ padding: '5px 11px', borderRadius: '7px', background: 'white', border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={11} /> Study Again
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── HISTORY ── */}
        {phase === 'history' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Flashcard History</h2>
              <button onClick={() => setPhase('setup')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>← Back</button>
            </div>
            {history.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, color: muted }}>No history yet</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {history.map((h, i) => (
                    <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.topic}</div>
                        <div style={{ fontSize: '11px', color: muted, marginTop: '3px' }}>{h.date} · {h.total} cards</div>
                        {/* Mini card preview dots */}
                        <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                          {Array.from({ length: Math.min(h.total, 10) }).map((_, j) => (
                            <div key={j} style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentPale, border: `1px solid ${cardBorder}` }} />
                          ))}
                          {h.total > 10 && <span style={{ fontSize: '10px', color: muted }}>+{h.total - 10}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => loadHistory(h)}
                          style={{ padding: '8px 16px', borderRadius: '9px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CreditCard size={13} /> Study
                        </motion.button>
                        <button onClick={() => {
                          const u = history.filter(x => x.id !== h.id);
                          setHistory(u);
                          localStorage.setItem('flashcards_history', JSON.stringify(u));
                        }}
                          style={{ padding: '8px 10px', borderRadius: '9px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
            }
          </motion.div>
        )}

        {/* ── STUDY ── */}
        {phase === 'study' && cards.length > 0 && (
          <div>
            {/* Progress bar */}
            <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
              {cards.map((_, i) => (
                <div key={i} style={{ flex: 1, height: '5px', borderRadius: '3px', background: known.includes(i) ? '#059669' : unknown.includes(i) ? '#DC2626' : i === current ? accent : accentPale, transition: 'background 0.3s' }} />
              ))}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>{current + 1}/{cards.length}</span>
                <span style={{ fontSize: '12px', color: muted }}>{currentTopic}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> {known.length} Known
                </span>
                <span style={{ color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={13} /> {unknown.length} To Review
                </span>
              </div>
            </div>

            {/* Card */}
            <div style={{ marginBottom: '14px', cursor: 'pointer' }} onClick={() => setFlipped(p => !p)}>
              <AnimatePresence mode="wait">
                <motion.div key={`${current}-${flipped}`}
                  initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ background: flipped ? `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.06))` : 'white', borderRadius: '20px', border: `1.5px solid ${flipped ? accent : cardBorder}`, padding: 'clamp(28px,5vw,44px) clamp(20px,4vw,36px)', minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 8px 32px rgba(186,117,23,0.09)', userSelect: 'none' }}>

                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: muted, marginBottom: '16px', textTransform: 'uppercase' }}>
                    {flipped ? '✦ ANSWER' : '? QUESTION'}
                  </div>

                  <p style={{ fontSize: 'clamp(15px,2.5vw,18px)', fontWeight: flipped ? 500 : 700, color: '#1C1409', lineHeight: 1.65, maxWidth: '480px' }}>
                    {flipped ? cards[current]?.back : cards[current]?.front}
                  </p>

                  {!flipped && (
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', color: muted }}>
                      <RotateCcw size={13} />
                      <span style={{ fontSize: '12px' }}>Tap to flip</span>
                    </div>
                  )}

                  {flipped && cards[current]?.memory_tip && (
                    <div style={{ marginTop: '16px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(186,117,23,0.08)', border: `1px solid ${cardBorder}` }}>
                      <p style={{ fontSize: '12px', color: accent, fontWeight: 600 }}>💡 {cards[current].memory_tip}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Difficulty + Flip hint */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              {cards[current]?.difficulty && (
                <span style={{ padding: '4px 12px', borderRadius: '100px', background: diffBg(cards[current].difficulty), fontSize: '12px', fontWeight: 700, color: diffColor(cards[current].difficulty) }}>
                  {cards[current].difficulty}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {flipped ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={markUnknown}
                  style={{ padding: '13px', borderRadius: '12px', background: 'rgba(220,38,38,0.07)', border: '1.5px solid rgba(220,38,38,0.2)', color: '#DC2626', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit' }}>
                  <XCircle size={16} /> Study Again
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={markKnown}
                  style={{ padding: '13px', borderRadius: '12px', background: 'rgba(5,150,105,0.07)', border: '1.5px solid rgba(5,150,105,0.2)', color: '#059669', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit' }}>
                  <CheckCircle2 size={16} /> Got it!
                </motion.button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                <button onClick={prev} disabled={current === 0}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', color: current === 0 ? '#C8B49A' : '#1C1409', cursor: current === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ChevronLeft size={14} /> Prev
                </button>
                <button onClick={() => setFlipped(true)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '13px' }}>
                  Flip Card ↩
                </button>
                <button onClick={next}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', color: '#1C1409', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  Skip <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '36px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CreditCard size={32} color={accent} />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#1C1409', letterSpacing: '-1px', marginBottom: '6px' }}>Session Complete!</h2>
            <p style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>{currentTopic}</p>

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#059669' }}>{known.length}</div>
                <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>Known ✓</div>
              </div>
              <div style={{ width: '1px', background: cardBorder }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#DC2626' }}>{unknown.length}</div>
                <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>To Review ✗</div>
              </div>
              <div style={{ width: '1px', background: cardBorder }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: accent }}>
                  {cards.length ? Math.round((known.length / cards.length) * 100) : 0}%
                </div>
                <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>Score</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setCurrent(0); setFlipped(false); setKnown([]); setUnknown([]); setPhase('study'); }}
                style={{ padding: '11px 22px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
                Study Again
              </motion.button>
              <button onClick={() => setPhase('setup')}
                style={{ padding: '11px 22px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', color: '#1C1409', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                New Topic
              </button>
              <button onClick={() => setPhase('history')}
                style={{ padding: '11px 22px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <History size={13} /> History
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}