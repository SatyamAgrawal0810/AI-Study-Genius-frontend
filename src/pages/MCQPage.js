import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import {
  FlaskConical, Trophy, Clock, CheckCircle2, XCircle,
  ChevronRight, RotateCcw, Eye, ChevronLeft, History
} from 'lucide-react';

const muted = '#8A7055';

export default function MCQPage() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQ, setNumQ] = useState(10);
  const [language, setLanguage] = useState('English');

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState({});   // { qIndex: 'A' }
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('setup');    // setup | test | result | review | history

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // saved results list
  const [history, setHistory] = useState([]);
  // currently reviewing a past test
  const [reviewData, setReviewData] = useState(null); // { topic, questions, selected }

  // load history from localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('mcq_history') || '[]');
    setHistory(saved);
  }, []);

  const saveToHistory = (topicName, qs, sel) => {
    const entry = {
      id: Date.now(),
      topic: topicName,
      date: new Date().toLocaleDateString('en-IN'),
      questions: qs,
      selected: sel,
      score: qs.filter((q, i) => sel[i] === q.correct_answer).length,
      total: qs.length,
    };
    const updated = [entry, ...JSON.parse(localStorage.getItem('mcq_history') || '[]')].slice(0, 20);
    localStorage.setItem('mcq_history', JSON.stringify(updated));
    setHistory(updated);
    return entry;
  };

  // ── Start Test ────────────────────────────────────────────────────────────
  const startTest = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await API.post('/generate-mcq', { topic, num_questions: numQ, difficulty, language });
      const qs = res.data.questions || [];
      setQuestions(qs);
      setSelected({});
      setCurrent(0);
      setPhase('test');
      startTimer(numQ * 60);
    } catch { alert('Error generating questions!'); }
    finally { setLoading(false); }
  };

  const startTimer = (secs) => {
    clearInterval(timerRef.current);
    setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current); submitTest(); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  // ── Select Answer ─────────────────────────────────────────────────────────
  const selectAnswer = (qIdx, opt) => {
    if (phase !== 'test') return;
    setSelected(p => ({ ...p, [qIdx]: opt }));
  };

  // ── Submit (only called once, saves result) ───────────────────────────────
  const submitTest = () => {
    clearInterval(timerRef.current);
    const score = questions.filter((q, i) => selected[i] === q.correct_answer).length;
    // save to backend (1 time only)
    API.post('/test/save-result', {
      topic,
      score: (score / questions.length) * 100,
      total_questions: questions.length,
      correct_answers: score,
      time_taken: numQ * 60 - timeLeft,
    }).catch(() => {});
    API.post('/streak/update').catch(() => {});
    // save to local history
    saveToHistory(topic, questions, selected);
    setPhase('result');
  };

  // ── Review current test (no save!) ────────────────────────────────────────
  const startReview = () => {
    setReviewData({ topic, questions, selected });
    setCurrent(0);
    setPhase('review');
  };

  // ── Review past test from history ────────────────────────────────────────
  const reviewHistory = (entry) => {
    setReviewData({ topic: entry.topic, questions: entry.questions, selected: entry.selected });
    setCurrent(0);
    setPhase('review');
  };

  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const score = questions.filter((q, i) => selected[i] === q.correct_answer).length;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const optBorder = (q, i, opt, sel, isReview) => {
    if (!isReview) return sel === opt ? accent : cardBorder;
    if (opt === q.correct_answer) return '#059669';
    if (sel === opt && opt !== q.correct_answer) return '#DC2626';
    return cardBorder;
  };
  const optBg = (q, i, opt, sel, isReview) => {
    if (!isReview) return sel === opt ? accentPale : 'white';
    if (opt === q.correct_answer) return 'rgba(5,150,105,0.07)';
    if (sel === opt && opt !== q.correct_answer) return 'rgba(220,38,38,0.06)';
    return 'white';
  };

  // active questions/selected for review
  const rQ = reviewData?.questions || [];
  const rS = reviewData?.selected || {};

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Layout title="MCQ Test" subtitle="Test your knowledge with AI-generated questions">
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(20px,3vw,32px)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlaskConical size={22} color={accent} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1C1409' }}>Configure Your Test</h2>
                <p style={{ fontSize: '12px', color: muted }}>Set topic and preferences</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Topic *</label>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Python OOP, Machine Learning"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Questions: {numQ}</label>
                <input type="range" min="5" max="20" step="1" value={numQ} onChange={e => setNumQ(+e.target.value)} style={{ width: '100%', accentColor: accent, marginTop: '8px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: muted, marginTop: '4px' }}>
                  <span>5</span><span>20</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option>English</option><option>Hindi</option>
                </select>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startTest}
              disabled={loading || !topic.trim()}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800, background: loading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 16px rgba(186,117,23,0.35)`, fontFamily: 'inherit' }}>
              {loading ? 'Generating Questions...' : `Start Test — ${numQ} Questions`}
            </motion.button>

            {/* Previous Tests */}
            {history.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={15} color={accent} /> Previous Tests
                  </h3>
                  <button onClick={() => setPhase('history')}
                    style={{ fontSize: '12px', color: accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View All <ChevronRight size={12} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {history.slice(0, 3).map((h, i) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: accentPale, flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{h.topic}</div>
                        <div style={{ fontSize: '11px', color: muted }}>{h.date} • {h.score}/{h.total} correct</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 900, color: h.score / h.total >= 0.7 ? '#059669' : h.score / h.total >= 0.5 ? accent : '#DC2626' }}>
                          {h.score} pts
                        </span>
                        <button onClick={() => reviewHistory(h)}
                          style={{ padding: '5px 11px', borderRadius: '7px', background: 'white', border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={11} /> Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TEST ── */}
        {phase === 'test' && questions.length > 0 && (
          <div>
            {/* Header */}
            <div style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '12px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>{current + 1}/{questions.length}</span>
              <div style={{ flex: 1, height: '6px', background: accentPale, borderRadius: '3px', minWidth: '80px' }}>
                <motion.div animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  style={{ height: '100%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, borderRadius: '3px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: timeLeft < 60 ? '#DC2626' : muted }}>
                <Clock size={14} /><span style={{ fontSize: '13px', fontWeight: 700 }}>{fmt(timeLeft)}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: muted }}>{Object.keys(selected).length} answered</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: accent }}>
                {questions.filter((q, i) => selected[i] === q.correct_answer).length} pts
              </span>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(18px,3vw,28px)', marginBottom: '12px' }}>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: accent, flexShrink: 0 }}>
                    {current + 1}
                  </div>
                  <p style={{ fontSize: 'clamp(14px,2vw,16px)', fontWeight: 600, color: '#1C1409', lineHeight: 1.6 }}>
                    {questions[current]?.question}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {Object.entries(questions[current]?.options || {}).map(([key, val]) => (
                    <motion.div key={key} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => selectAnswer(current, key)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: `1.5px solid ${selected[current] === key ? accent : cardBorder}`, background: selected[current] === key ? accentPale : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: selected[current] === key ? accent : accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: selected[current] === key ? 'white' : muted, flexShrink: 0 }}>
                        {key}
                      </div>
                      <span style={{ fontSize: '14px', color: '#1C1409' }}>{val}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0}
                style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', color: current === 0 ? '#C8B49A' : '#1C1409', cursor: current === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                {current < questions.length - 1 ? (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setCurrent(p => p + 1)}
                    style={{ padding: '10px 20px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit' }}>
                    Next <ChevronRight size={14} />
                  </motion.button>
                ) : (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={submitTest}
                    style={{ padding: '10px 24px', borderRadius: '10px', background: '#059669', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
                    Submit Test ✓
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '32px', textAlign: 'center', marginBottom: '16px' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                style={{ width: '80px', height: '80px', borderRadius: '50%', background: pct >= 70 ? 'rgba(5,150,105,0.1)' : pct >= 50 ? accentPale : 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trophy size={36} color={pct >= 70 ? '#059669' : pct >= 50 ? accent : '#DC2626'} />
              </motion.div>

              {/* Score = number of correct answers */}
              <div style={{ fontSize: '52px', fontWeight: 900, color: '#1C1409', letterSpacing: '-2px', lineHeight: 1 }}>
                {score}
              </div>
              <div style={{ fontSize: '16px', color: muted, marginTop: '4px' }}>points earned</div>
              <div style={{ fontSize: '14px', color: pct >= 70 ? '#059669' : pct >= 50 ? accent : '#DC2626', fontWeight: 700, marginTop: '8px' }}>
                {score}/{questions.length} correct · {pct}%
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: pct >= 70 ? '#059669' : pct >= 50 ? accent : '#DC2626', marginTop: '4px' }}>
                {pct >= 70 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setPhase('setup'); setQuestions([]); }}
                  style={{ padding: '10px 20px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                  <RotateCcw size={14} /> New Test
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startReview}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', color: '#1C1409', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                  <Eye size={14} /> Review Answers
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── REVIEW MODE (read-only, no save) ── */}
        {phase === 'review' && rQ.length > 0 && (
          <div>
            {/* Header */}
            <div style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '12px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>
                Review: {reviewData?.topic}
              </span>
              <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '100px', background: 'rgba(37,99,235,0.08)', fontSize: '12px', fontWeight: 700, color: '#2563EB' }}>
                Read-only mode
              </span>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
              {rQ.map((q, i) => {
                const correct = rS[i] === q.correct_answer;
                const answered = rS[i] !== undefined;
                return (
                  <div key={i} onClick={() => setCurrent(i)}
                    style={{ flex: 1, height: '7px', borderRadius: '4px', cursor: 'pointer', background: i === current ? '#2563EB' : !answered ? '#E5E7EB' : correct ? '#059669' : '#DC2626', transition: 'all 0.2s' }} />
                );
              })}
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(18px,3vw,28px)', marginBottom: '12px' }}>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: rS[current] === rQ[current]?.correct_answer ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: rS[current] === rQ[current]?.correct_answer ? '#059669' : '#DC2626', flexShrink: 0 }}>
                    {current + 1}
                  </div>
                  <p style={{ fontSize: 'clamp(14px,2vw,16px)', fontWeight: 600, color: '#1C1409', lineHeight: 1.6 }}>
                    {rQ[current]?.question}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {Object.entries(rQ[current]?.options || {}).map(([key, val]) => (
                    <div key={key}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: `1.5px solid ${optBorder(rQ[current], current, key, rS[current], true)}`, background: optBg(rQ[current], current, key, rS[current], true) }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: key === rQ[current]?.correct_answer ? '#059669' : rS[current] === key && key !== rQ[current]?.correct_answer ? '#DC2626' : accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: key === rQ[current]?.correct_answer || (rS[current] === key && key !== rQ[current]?.correct_answer) ? 'white' : muted, flexShrink: 0 }}>
                        {key}
                      </div>
                      <span style={{ fontSize: '14px', color: '#1C1409', flex: 1 }}>{val}</span>
                      {key === rQ[current]?.correct_answer && <CheckCircle2 size={16} color="#059669" />}
                      {rS[current] === key && key !== rQ[current]?.correct_answer && <XCircle size={16} color="#DC2626" />}
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                {rQ[current]?.explanation && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '14px', padding: '12px 15px', borderRadius: '10px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.18)' }}>
                    <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>💡 {rQ[current].explanation}</p>
                  </motion.div>
                )}

                {/* Your answer status */}
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: rS[current] === rQ[current]?.correct_answer ? 'rgba(5,150,105,0.05)' : 'rgba(220,38,38,0.04)', border: `1px solid ${rS[current] === rQ[current]?.correct_answer ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.12)'}` }}>
                  <p style={{ fontSize: '12px', color: rS[current] === rQ[current]?.correct_answer ? '#059669' : '#DC2626', fontWeight: 600 }}>
                    {rS[current] === rQ[current]?.correct_answer
                      ? `✓ Correct! You answered ${rS[current]}`
                      : rS[current]
                        ? `✗ You answered ${rS[current]}, correct was ${rQ[current]?.correct_answer}`
                        : `✗ Not answered, correct was ${rQ[current]?.correct_answer}`}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0}
                style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', color: current === 0 ? '#C8B49A' : '#1C1409', cursor: current === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setPhase('setup'); setReviewData(null); }}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', color: '#1C1409', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                  Exit Review
                </button>
                {current < rQ.length - 1 && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setCurrent(p => p + 1)}
                    style={{ padding: '10px 20px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit' }}>
                    Next <ChevronRight size={14} />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {phase === 'history' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1C1409' }}>All Previous Tests</h2>
              <button onClick={() => setPhase('setup')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                ← Back
              </button>
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}` }}>
                <FlaskConical size={40} color="rgba(186,117,23,0.25)" style={{ margin: '0 auto 14px' }} />
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#4A3728' }}>No tests yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map((h, i) => (
                  <motion.div key={h.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.topic}</div>
                      <div style={{ fontSize: '12px', color: muted, marginTop: '3px' }}>
                        {h.date} · {h.score}/{h.total} correct
                      </div>
                      {/* Score bar */}
                      <div style={{ height: '5px', width: '140px', background: accentPale, borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(h.score / h.total) * 100}%`, background: h.score / h.total >= 0.7 ? '#059669' : h.score / h.total >= 0.5 ? accent : '#DC2626', borderRadius: '3px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: h.score / h.total >= 0.7 ? '#059669' : h.score / h.total >= 0.5 ? accent : '#DC2626' }}>
                          {h.score} pts
                        </div>
                        <div style={{ fontSize: '11px', color: muted }}>{Math.round((h.score / h.total) * 100)}%</div>
                      </div>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => reviewHistory(h)}
                        style={{ padding: '8px 16px', borderRadius: '9px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Eye size={13} /> Review
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </Layout>
  );
}