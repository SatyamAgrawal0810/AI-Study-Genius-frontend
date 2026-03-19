import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { Mic, Send, ChevronRight, CheckCircle2, XCircle, Sparkles, RotateCcw, History, Eye, Trash2 } from 'lucide-react';

const muted = '#8A7055';

function stripBold(t) { return (t || '').replace(/\*\*/g, '').trim(); }
function Bold({ text }) {
  if (!text) return null;
  const clean = stripBold(text.replace(/^\s*[\*\-]\s+/, '').replace(/^\d+\.\s*/, ''));
  const parts = (text || '').split(/(\*{1,2}[^*]+\*{1,2})/g);
  return <>{parts.map((p, i) => {
    if (/^\*{1,2}[^*]+\*{1,2}$/.test(p)) return <strong key={i} style={{ fontWeight: 700, color: '#1C1409' }}>{p.replace(/\*{1,2}/g, '')}</strong>;
    return <span key={i}>{p}</span>;
  })}</>;
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const gradeColor = (g) => ({ A: '#059669', B: '#2563EB', C: '#BA7517', D: '#D97706', F: '#DC2626' })[g] || muted;

export default function InterviewPage() {
  const [topic, setTopic]     = useState('');
  const [level, setLevel]     = useState('Intermediate');
  const [numQ, setNumQ]       = useState(5);
  const [language, setLanguage] = useState('English');
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer]   = useState('');
  const [feedback, setFeedback] = useState(null);
  const [allFeedback, setAllFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [phase, setPhase]     = useState('setup');
  const [history, setHistory] = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('interview_history') || '[]'));
  }, []);

  const startInterview = async () => {
    if (!topic.trim()) return;
    setLoading(true); setCurrentTopic(topic);
    try {
      const res = await API.post('/interview/generate', { topic, level, num_questions: numQ, language });
      const qs = res.data.result?.questions || [];
      setQuestions(qs);
      setCurrent(0); setAnswer(''); setFeedback(null); setAllFeedback([]);
      setPhase('interview');
    } catch { alert('Error!'); }
    finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setEvalLoading(true); setFeedback(null);
    try {
      const q = questions[current];
      const res = await API.post('/interview/evaluate', { question: q.question, ideal_answer: q.ideal_answer, student_answer: answer, language });
      const fb = res.data.result;
      setFeedback(fb);
      setAllFeedback(p => [...p, { question: q.question, answer, feedback: fb }]);
    } catch { alert('Error!'); }
    finally { setEvalLoading(false); }
  };

  const nextQ = () => {
    if (current < questions.length - 1) { setCurrent(p => p + 1); setAnswer(''); setFeedback(null); }
    else {
      setPhase('result');
      // save history
      const entry = { id: Date.now(), topic: currentTopic, level, date: new Date().toLocaleDateString('en-IN'), allFeedback: [...allFeedback], total: questions.length };
      const updated = [entry, ...JSON.parse(localStorage.getItem('interview_history') || '[]')].slice(0, 15);
      localStorage.setItem('interview_history', JSON.stringify(updated));
      setHistory(updated);
    }
  };

  const avgScore = allFeedback.length
    ? Math.round(allFeedback.reduce((a, b) => a + (b.feedback?.score || 0), 0) / allFeedback.length) : 0;

  return (
    <Layout title="Mock Interview" subtitle="Practice interview questions with AI feedback">
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* SETUP */}
        {phase === 'setup' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(20px,3vw,32px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={24} color="#7C3AED" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1C1409' }}>Mock Interview</h2>
                <p style={{ fontSize: '12px', color: muted }}>AI asks questions and evaluates your answers</p>
              </div>
              {history.length > 0 && (
                <button onClick={() => setPhase('history')}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                  <History size={13} /> History ({history.length})
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Topic / Role *</label>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Python, React JS, System Design"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Questions: {numQ}</label>
                <input type="range" min="3" max="10" value={numQ} onChange={e => setNumQ(+e.target.value)} style={{ width: '100%', accentColor: accent, marginTop: '8px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {LEVELS.map(l => (
                <motion.button key={l} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setLevel(l)}
                  style={{ padding: '8px 18px', borderRadius: '100px', border: `1.5px solid ${level === l ? accent : cardBorder}`, background: level === l ? `linear-gradient(135deg, ${accent}, ${accentLight})` : 'white', color: level === l ? 'white' : muted, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                  {l}
                </motion.button>
              ))}
              <select value={language} onChange={e => setLanguage(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '100px', border: `1px solid ${cardBorder}`, background: 'white', fontSize: '13px', color: '#1C1409', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
                <option>English</option><option>Hindi</option>
              </select>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startInterview}
              disabled={loading || !topic.trim()}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800, background: loading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit', boxShadow: `0 4px 16px rgba(186,117,23,0.35)` }}>
              {loading ? 'Preparing...' : <><Sparkles size={16} />Start Mock Interview</>}
            </motion.button>

            {/* Recent History Preview */}
            {history.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Interviews</p>
                {history.slice(0, 2).map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: accentPale, marginBottom: '7px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{h.topic} · {h.level}</div>
                      <div style={{ fontSize: '11px', color: muted }}>{h.date} · {h.total} questions</div>
                    </div>
                    <button onClick={() => { setPhase('history'); }}
                      style={{ padding: '5px 11px', borderRadius: '7px', background: 'white', border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit' }}>
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* HISTORY */}
        {phase === 'history' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Interview History</h2>
              <button onClick={() => setPhase('setup')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>← Back</button>
            </div>
            {history.map((h, i) => (
              <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '16px 20px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.topic} — {h.level}</div>
                    <div style={{ fontSize: '11px', color: muted }}>{h.date} · {h.total} questions</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: accent }}>
                      {h.allFeedback?.length ? Math.round(h.allFeedback.reduce((a, b) => a + (b.feedback?.score || 0), 0) / h.allFeedback.length) : 0}/10
                    </div>
                    <button onClick={() => { const u = history.filter(x => x.id !== h.id); setHistory(u); localStorage.setItem('interview_history', JSON.stringify(u)); }}
                      style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {h.allFeedback?.map((fb, j) => (
                  <div key={j} style={{ padding: '10px 12px', borderRadius: '9px', background: '#FEF9F0', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>Q{j+1}: <Bold text={fb.question} /></p>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: `${gradeColor(fb.feedback?.grade)}15`, fontSize: '11px', fontWeight: 800, color: gradeColor(fb.feedback?.grade), flexShrink: 0 }}>
                        {fb.feedback?.score}/10
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: muted }}>{stripBold(fb.feedback?.feedback || fb.feedback?.detailed_feedback || '')}</p>
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* INTERVIEW */}
        {phase === 'interview' && questions.length > 0 && (
          <div>
            <div style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '12px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>Q{current + 1}/{questions.length}</span>
              <div style={{ flex: 1, height: '5px', background: accentPale, borderRadius: '3px', minWidth: '80px' }}>
                <motion.div animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  style={{ height: '100%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, borderRadius: '3px' }} />
              </div>
              <span style={{ padding: '3px 10px', borderRadius: '100px', background: 'rgba(124,58,237,0.08)', fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>{level}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(18px,3vw,28px)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {questions[current]?.type && <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(124,58,237,0.08)', fontSize: '11px', fontWeight: 800, color: '#7C3AED' }}>{stripBold(questions[current].type)}</span>}
                  {questions[current]?.difficulty && <span style={{ padding: '3px 10px', borderRadius: '6px', background: accentPale, fontSize: '11px', fontWeight: 700, color: accent }}>{stripBold(questions[current].difficulty)}</span>}
                </div>
                <p style={{ fontSize: 'clamp(14px,2vw,17px)', fontWeight: 700, color: '#1C1409', lineHeight: 1.6, marginBottom: '16px' }}>
                  <Bold text={questions[current]?.question} />
                </p>
                {questions[current]?.hints && (
                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: accentPale, marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: accent, marginBottom: '4px' }}>HINTS</p>
                    <p style={{ fontSize: '12px', color: '#4A3728' }}>Think about: {stripBold(Array.isArray(questions[current].hints) ? questions[current].hints.join(', ') : questions[current].hints)}</p>
                  </div>
                )}
                <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer here... Be detailed and use examples!"
                  style={{ width: '100%', height: '120px', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: '#FEF9F0', fontSize: '14px', color: '#1C1409', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
                {!feedback ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submitAnswer}
                    disabled={evalLoading || !answer.trim()}
                    style={{ width: '100%', marginTop: '12px', padding: '13px', borderRadius: '12px', fontWeight: 700, background: evalLoading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: evalLoading ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
                    {evalLoading ? 'Evaluating...' : <><Send size={15} />Submit Answer</>}
                  </motion.button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '14px' }}>
                    <div style={{ padding: '14px 16px', borderRadius: '12px', background: feedback.score >= 7 ? 'rgba(5,150,105,0.06)' : accentPale, border: `1px solid ${feedback.score >= 7 ? 'rgba(5,150,105,0.2)' : cardBorder}`, marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {feedback.score >= 7 ? <CheckCircle2 size={16} color="#059669" /> : <XCircle size={16} color={accent} />}
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1C1409' }}>Score: {feedback.score}/10</span>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: '100px', background: `${gradeColor(feedback.grade)}15`, fontSize: '12px', fontWeight: 800, color: gradeColor(feedback.grade) }}>Grade {feedback.grade}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#1C1409', lineHeight: 1.6, marginBottom: '6px' }}>{stripBold(feedback.detailed_feedback || feedback.feedback)}</p>
                      {feedback.encouragement && <p style={{ fontSize: '12px', color: muted, fontStyle: 'italic' }}>{stripBold(feedback.encouragement)}</p>}
                    </div>
                    {feedback.ideal_answer_summary && (
                      <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', marginBottom: '12px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', marginBottom: '4px' }}>IDEAL ANSWER POINTS</p>
                        <p style={{ fontSize: '13px', color: '#1C1409', lineHeight: 1.6 }}>{stripBold(feedback.ideal_answer_summary)}</p>
                      </div>
                    )}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={nextQ}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700, background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
                      {current < questions.length - 1 ? 'Next Question' : 'View Results'} <ChevronRight size={15} />
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '32px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: avgScore >= 7 ? 'rgba(5,150,105,0.1)' : accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Mic size={32} color={avgScore >= 7 ? '#059669' : accent} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1C1409', letterSpacing: '-1px' }}>{avgScore}/10</h2>
              <p style={{ fontSize: '16px', color: avgScore >= 7 ? '#059669' : accent, fontWeight: 700, marginTop: '4px' }}>
                {avgScore >= 8 ? 'Excellent!' : avgScore >= 6 ? 'Good Job!' : 'Keep Practicing!'}
              </p>
              <p style={{ fontSize: '13px', color: muted, marginTop: '8px' }}>{allFeedback.length} questions · {currentTopic}</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setPhase('setup')}
                  style={{ padding: '10px 22px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                  <RotateCcw size={14} /> New Interview
                </motion.button>
                <button onClick={() => setPhase('history')}
                  style={{ padding: '10px 22px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', color: '#1C1409', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <History size={14} /> History
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allFeedback.map((item, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409', flex: 1 }}>Q{i+1}: <Bold text={item.question} /></p>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: gradeColor(item.feedback.grade) }}>{item.feedback.score}/10</span>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: `${gradeColor(item.feedback.grade)}15`, fontSize: '11px', fontWeight: 800, color: gradeColor(item.feedback.grade) }}>Grade {item.feedback.grade}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: muted, lineHeight: 1.5 }}>{stripBold(item.feedback.feedback || item.feedback.detailed_feedback)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}