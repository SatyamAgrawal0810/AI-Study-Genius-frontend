import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { Calendar, Clock, CheckCircle2, Sparkles, History, Eye, Trash2 } from 'lucide-react';

const muted = '#8A7055';

function s(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val).replace(/\*\*/g, '').trim();
}

// Get today in YYYY-MM-DD format
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Format date nicely: "Mon, 20 Mar 2026"
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// Add N days to a date string
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// Inject correct sequential dates into plan from today
function injectDates(plan) {
  if (!plan || !plan.length) return plan;
  const start = getToday();
  return plan.map((day, i) => ({
    ...day,
    date: formatDate(addDays(start, i)),
    _rawDate: addDays(start, i),
  }));
}

export default function PlannerPage() {
  const today = getToday();

  const [syllabus, setSyllabus]     = useState('');
  const [examDate, setExamDate]     = useState('');
  const [dailyHours, setDailyHours] = useState(4);
  const [language, setLanguage]     = useState('English');
  const [plan, setPlan]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [phase, setPhase]           = useState('input');
  const [history, setHistory]       = useState([]);
  const [currentLabel, setCurrentLabel] = useState('');
  const [daysLeft, setDaysLeft]     = useState(null);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('planner_history') || '[]'));
  }, []);

  // Calculate days left when exam date changes
  useEffect(() => {
    if (examDate) {
      const diff = Math.ceil((new Date(examDate) - new Date(today)) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff > 0 ? diff : null);
    }
  }, [examDate]);

  const generate = async () => {
    if (!syllabus.trim() || !examDate) return;
    const label = syllabus.trim().split('\n')[0].slice(0, 50);
    setCurrentLabel(label);
    setLoading(true);
    try {
      const res = await API.post('/generate-plan', {
        syllabus,
        exam_date: examDate,
        start_date: today,       // always send today as start
        daily_hours: dailyHours,
        language,
      });
      // Inject correct dates from today regardless of what AI returns
      const rawPlan = res.data.plan || [];
      // Calculate actual days between today and exam date
      const actualDays = Math.max(1, Math.ceil((new Date(examDate) - new Date(today)) / (1000 * 60 * 60 * 24)));
      // Trim plan to only actual days, then inject correct dates
      const trimmedPlan = rawPlan.slice(0, actualDays);
      const fixedPlan = injectDates(trimmedPlan);
      setPlan(fixedPlan);
      setPhase('result');

      const entry = {
        id: Date.now(), label, examDate, dailyHours,
        startDate: today,
        date: new Date().toLocaleDateString('en-IN'),
        plan: fixedPlan,
      };
      const updated = [entry, ...JSON.parse(localStorage.getItem('planner_history') || '[]')].slice(0, 15);
      localStorage.setItem('planner_history', JSON.stringify(updated));
      setHistory(updated);
    } catch { alert('Error! Please try again.'); }
    finally { setLoading(false); }
  };

  const loadHistory = (entry) => {
    setCurrentLabel(entry.label);
    setPlan(entry.plan);
    setPhase('result');
  };

  const typeColor = (t) => {
    const type = s(t).toLowerCase();
    if (type.includes('study'))  return accent;
    if (type.includes('revis')) return '#7C3AED';
    if (type.includes('mock') || type.includes('test')) return '#DC2626';
    return '#059669';
  };
  const typeBg = (t) => {
    const type = s(t).toLowerCase();
    if (type.includes('study'))  return accentPale;
    if (type.includes('revis')) return 'rgba(124,58,237,0.08)';
    if (type.includes('mock') || type.includes('test')) return 'rgba(220,38,38,0.08)';
    return 'rgba(5,150,105,0.08)';
  };

  return (
    <Layout title="Study Planner" subtitle="Get a personalized day-by-day study schedule">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* INPUT */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(18px,3vw,28px)', marginBottom: '16px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1C1409' }}>Plan Your Study</h2>
              <p style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>Starting from today: {formatDate(today)}</p>
            </div>
            {history.length > 0 && (
              <button onClick={() => setPhase('history')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                <History size={13} /> History ({history.length})
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Syllabus Topics *</label>
              <textarea value={syllabus} onChange={e => setSyllabus(e.target.value)}
                placeholder="e.g. Python, OOP, Data Structures, Algorithms"
                style={{ width: '100%', height: '80px', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>
                Exam Date * {daysLeft && <span style={{ color: daysLeft <= 7 ? '#DC2626' : accent, fontWeight: 700 }}>({daysLeft} days left)</span>}
              </label>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
                min={addDays(today, 1)}  // min is tomorrow
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Daily Hours: {dailyHours}h</label>
              <input type="range" min="1" max="8" value={dailyHours} onChange={e => setDailyHours(+e.target.value)}
                style={{ width: '100%', accentColor: accent, marginTop: '8px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: muted, marginTop: '3px' }}>
                <span>1h</span><span>8h</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#4A3728', marginBottom: '6px' }}>Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', fontSize: '13px', color: '#1C1409', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                <option>English</option><option>Hindi</option>
              </select>
            </div>
          </div>

          {/* Start/End info */}
          {examDate && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#059669', marginBottom: '2px' }}>START DATE</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>{formatDate(today)} (Today)</div>
              </div>
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626', marginBottom: '2px' }}>EXAM DATE</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>{formatDate(examDate)}</div>
              </div>
              {daysLeft && (
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: accentPale, border: `1px solid ${cardBorder}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: accent, marginBottom: '2px' }}>DAYS TO PREPARE</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>{daysLeft} days</div>
                </div>
              )}
            </div>
          )}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generate}
            disabled={loading || !syllabus.trim() || !examDate}
            style={{ width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 800, background: (loading || !syllabus.trim() || !examDate) ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: (loading || !syllabus.trim() || !examDate) ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit', boxShadow: `0 4px 16px rgba(186,117,23,0.3)` }}>
            {loading
              ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />Generating Plan...</>
              : <><Sparkles size={15} />Generate Study Plan</>}
          </motion.button>
        </motion.div>

        {/* HISTORY */}
        {phase === 'history' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Planner History</h2>
              <button onClick={() => setPhase(plan ? 'result' : 'input')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>← Back</button>
            </div>
            {history.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, color: muted }}>No history yet</div>
              : history.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.label}</div>
                    <div style={{ fontSize: '11px', color: muted }}>{h.date} · Exam: {h.examDate} · {h.dailyHours}h/day · {h.plan?.length || 0} days</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => loadHistory(h)}
                      style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> View
                    </button>
                    <button onClick={() => { const u = history.filter(x => x.id !== h.id); setHistory(u); localStorage.setItem('planner_history', JSON.stringify(u)); }}
                      style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))
            }
          </motion.div>
        )}

        {/* PLAN RESULT */}
        {phase === 'result' && plan && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1409' }}>{currentLabel}</h3>
                <p style={{ fontSize: '12px', color: muted }}>
                  {formatDate(today)} → {examDate ? formatDate(examDate) : ''} · {daysLeft || plan.length} days
                </p>
              </div>
              <button onClick={() => setPhase('input')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                New Plan
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plan.map((day, i) => {
                const dayLabel  = s(day.day   || day.Day   || `Day ${i + 1}`);
                const dateLabel = day.date     || s(day.Date) || formatDate(addDays(today, i));
                const typeLabel = s(day.type  || day.Type  || 'Study');
                const hoursVal  = day.hours   || day.Hours || day.daily_hours || dailyHours;
                const topics    = Array.isArray(day.topics) ? day.topics : Array.isArray(day.Topics) ? day.Topics : [];
                const tasks     = Array.isArray(day.tasks)  ? day.tasks  : Array.isArray(day.Tasks)  ? day.Tasks  : [];

                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px', display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: typeBg(typeLabel), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: typeColor(typeLabel) }}>{dayLabel}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>{dateLabel}</span>
                        <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                          <span style={{ padding: '2px 9px', borderRadius: '100px', background: typeBg(typeLabel), fontSize: '11px', fontWeight: 700, color: typeColor(typeLabel) }}>{typeLabel}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: muted }}>
                            <Clock size={11} />{s(hoursVal)}h
                          </span>
                        </div>
                      </div>

                      {topics.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
                          {topics.map((t, j) => (
                            <span key={j} style={{ padding: '2px 9px', borderRadius: '100px', background: accentPale, fontSize: '11px', fontWeight: 600, color: accent }}>{s(t)}</span>
                          ))}
                        </div>
                      )}

                      {tasks.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {tasks.map((t, j) => (
                            <span key={j} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: muted }}>
                              <CheckCircle2 size={11} color={typeColor(typeLabel)} />{s(t)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty */}
        {phase === 'input' && !loading && (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity }}>
              <Calendar size={52} color="rgba(186,117,23,0.25)" style={{ margin: '0 auto 14px' }} />
            </motion.div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#4A3728' }}>Set your exam date and syllabus</p>
            <p style={{ fontSize: '13px', color: muted, marginTop: '6px' }}>Plan starts from <strong>today</strong> — AI creates your complete schedule</p>
          </div>
        )}
      </div>
    </Layout>
  );
}