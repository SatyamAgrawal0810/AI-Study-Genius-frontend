import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { Brain, Send, ChevronRight, CheckCircle2, XCircle, Sparkles, History, Eye, Trash2 } from 'lucide-react';

const muted = '#8A7055';

// Bold renderer
function Bold({ text }) {
  if (!text) return null;
  const clean = text.replace(/^\s*[\*\-]\s+/, '').replace(/^\d+\.\s*/, '').trim();
  const parts = clean.split(/(\*{1,2}[^*]+\*{1,2})/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*{1,2}[^*]+\*{1,2}$/.test(p)) {
          return <strong key={i} style={{ fontWeight: 700, color: '#1C1409' }}>{p.replace(/\*{1,2}/g, '')}</strong>;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// Render markdown-style text properly
function RichText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height: '6px' }} />;
        if (t.startsWith('#')) return null;
        const isBullet = t.match(/^[\*\-]\s+/);
        if (isBullet) return (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '7px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, flexShrink: 0, marginTop: '9px' }} />
            <p style={{ fontSize: '14px', color: '#4A3728', lineHeight: 1.75, margin: 0 }}><Bold text={t} /></p>
          </div>
        );
        return <p key={i} style={{ fontSize: '14px', color: '#4A3728', lineHeight: 1.8, marginBottom: '6px' }}><Bold text={t} /></p>;
      })}
    </div>
  );
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function TutorPage() {
  const [topic, setTopic]       = useState('');
  const [level, setLevel]       = useState('Beginner');
  const [language, setLanguage] = useState('English');
  const [lesson, setLesson]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [phase, setPhase]       = useState('input');
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer]     = useState('');
  const [feedback, setFeedback] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [history, setHistory]   = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('tutor_history') || '[]'));
  }, []);

  const startLesson = async () => {
    if (!topic.trim()) return;
    setLoading(true); setLesson(null); setFeedback(null);
    setCurrentTopic(topic);
    try {
      const res = await API.post('/tutor/explain', { topic, level, language });
      const l = res.data.result;
      setLesson(l);
      setPhase('lesson');
      setCurrentQ(0);
      // save history
      const entry = { id: Date.now(), topic, level, date: new Date().toLocaleDateString('en-IN'), lesson: l };
      const updated = [entry, ...JSON.parse(localStorage.getItem('tutor_history') || '[]')].slice(0, 20);
      localStorage.setItem('tutor_history', JSON.stringify(updated));
      setHistory(updated);
    } catch { alert('Error! Please try again.'); }
    finally { setLoading(false); }
  };

  const loadHistory = (entry) => {
    setCurrentTopic(entry.topic);
    setTopic(entry.topic);
    setLevel(entry.level);
    setLesson(entry.lesson);
    setCurrentQ(0); setAnswer(''); setFeedback(null);
    setPhase('lesson');
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !lesson?.test_questions) return;
    setEvalLoading(true); setFeedback(null);
    try {
      const q = lesson.test_questions[currentQ];
      const res = await API.post('/tutor/evaluate', { question: q.question, student_answer: answer, correct_answer: q.answer, language });
      setFeedback(res.data.result);
    } catch { alert('Error evaluating!'); }
    finally { setEvalLoading(false); }
  };

  const nextQ = () => {
    if (currentQ < (lesson?.test_questions?.length || 0) - 1) {
      setCurrentQ(p => p + 1); setAnswer(''); setFeedback(null);
    } else { setPhase('input'); setTopic(''); setLesson(null); }
  };

  return (
    <Layout title="AI Tutor" subtitle="Learn any topic interactively with your personal AI teacher">
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* INPUT */}
        {phase === 'input' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(20px,3vw,32px)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={24} color="#7C3AED" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1C1409' }}>What do you want to learn?</h2>
                <p style={{ fontSize: '12px', color: muted }}>AI explains with examples and tests your understanding</p>
              </div>
              {history.length > 0 && (
                <button onClick={() => setPhase('history')}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                  <History size={13} /> History ({history.length})
                </button>
              )}
            </div>

            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && startLesson()}
              placeholder="e.g. Recursion, Neural Networks, Inheritance..."
              style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '15px', color: '#1C1409', outline: 'none', fontFamily: 'inherit', marginBottom: '14px' }}
              onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />

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

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startLesson}
              disabled={loading || !topic.trim()}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800, background: loading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 16px rgba(186,117,23,0.35)`, fontFamily: 'inherit' }}>
              {loading
                ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />Preparing lesson...</>
                : <><Sparkles size={16} />Start Learning</>}
            </motion.button>

            {/* Recent History */}
            {history.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Topics</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {history.slice(0, 3).map(h => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: accentPale, flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{h.topic}</div>
                        <div style={{ fontSize: '11px', color: muted }}>{h.date} · {h.level}</div>
                      </div>
                      <button onClick={() => loadHistory(h)}
                        style={{ padding: '5px 11px', borderRadius: '7px', background: 'white', border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={11} /> Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* HISTORY */}
        {phase === 'history' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Learning History</h2>
              <button onClick={() => setPhase('input')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>← Back</button>
            </div>
            {history.map((h, i) => (
              <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.topic}</div>
                  <div style={{ fontSize: '11px', color: muted }}>{h.date} · {h.level}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => loadHistory(h)}
                    style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} /> View
                  </button>
                  <button onClick={() => { const u = history.filter(x => x.id !== h.id); setHistory(u); localStorage.setItem('tutor_history', JSON.stringify(u)); }}
                    style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* LESSON */}
        {phase === 'lesson' && lesson && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(18px,3vw,28px)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1C1409', letterSpacing: '-0.5px' }}>{currentTopic}</h2>
                <span style={{ padding: '4px 12px', borderRadius: '100px', background: accentPale, fontSize: '12px', fontWeight: 700, color: accent }}>{level}</span>
              </div>

              {lesson.analogy && (
                <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ANALOGY</p>
                  <p style={{ fontSize: '14px', color: '#4A3728', lineHeight: 1.7 }}>{lesson.analogy}</p>
                </div>
              )}

              {lesson.explanation && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EXPLANATION</p>
                  <RichText text={typeof lesson.explanation === 'string' ? lesson.explanation : JSON.stringify(lesson.explanation)} />
                </div>
              )}

              {lesson.key_points && lesson.key_points.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KEY POINTS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {lesson.key_points.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.14)' }}>
                        <CheckCircle2 size={15} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '14px', color: '#1C1409', lineHeight: 1.65, margin: 0 }}><Bold text={typeof p === 'string' ? p : JSON.stringify(p)} /></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lesson.example && (
                <div style={{ padding: '14px 16px', borderRadius: '12px', background: '#F8F5F0', border: `1px solid ${cardBorder}` }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EXAMPLE</p>
                  <pre style={{ fontSize: '13px', color: '#1C1409', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{lesson.example}</pre>
                </div>
              )}
            </div>

            {lesson.next_topics && lesson.next_topics.length > 0 && (
              <div style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '16px 20px', marginBottom: '14px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STUDY NEXT</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {lesson.next_topics.map((t, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.04 }} onClick={() => { setTopic(t); startLesson(); }}
                      style={{ padding: '6px 14px', borderRadius: '100px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '12px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {t} <ChevronRight size={12} />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {lesson.test_questions && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPhase('quiz')}
                  style={{ flex: 2, padding: '14px', borderRadius: '12px', fontWeight: 800, background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 16px rgba(186,117,23,0.35)`, fontFamily: 'inherit' }}>
                  Test Understanding ({lesson.test_questions.length} Qs) <ChevronRight size={16} />
                </motion.button>
              )}
              <button onClick={() => setPhase('input')}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: 'white', color: '#1C1409', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit' }}>
                New Topic
              </button>
            </div>
          </motion.div>
        )}

        {/* QUIZ */}
        {phase === 'quiz' && lesson?.test_questions && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(18px,3vw,28px)' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                {lesson.test_questions.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= currentQ ? `linear-gradient(135deg, ${accent}, ${accentLight})` : accentPale }} />
                ))}
              </div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px' }}>Q {currentQ + 1} OF {lesson.test_questions.length}</p>
              <h3 style={{ fontSize: 'clamp(15px,2.5vw,17px)', fontWeight: 700, color: '#1C1409', marginBottom: '18px', lineHeight: 1.55 }}>
                {lesson.test_questions[currentQ].question}
              </h3>
              <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                style={{ width: '100%', height: '100px', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {feedback.score >= 7 ? <CheckCircle2 size={16} color="#059669" /> : <XCircle size={16} color={accent} />}
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#1C1409' }}>Score: {feedback.score}/10</span>
                      </div>
                      <span style={{ fontSize: '12px', color: muted }}>{feedback.grade}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#1C1409', lineHeight: 1.6 }}>{feedback.feedback || feedback.detailed_feedback}</p>
                    {feedback.encouragement && <p style={{ fontSize: '12px', color: muted, marginTop: '6px', fontStyle: 'italic' }}>{feedback.encouragement}</p>}
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={nextQ}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700, background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit' }}>
                    {currentQ < lesson.test_questions.length - 1 ? 'Next Question' : 'Finish'} <ChevronRight size={15} />
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}