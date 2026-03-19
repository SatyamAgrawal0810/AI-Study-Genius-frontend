import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, FlaskConical, BookOpen, Target, Flame, Star, Award, BarChart2, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const muted = '#8A7055';

// Mini bar chart component
function BarChart({ data, valueKey, labelKey, colorFn, height = 140 }) {
  if (!data?.length) return <p style={{ color: muted, fontSize: '13px', textAlign: 'center', padding: '24px' }}>No data yet</p>;
  const max = Math.max(...data.map(d => d[valueKey] || 0)) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px`, paddingBottom: '24px', position: 'relative' }}>
      {/* Y-axis lines */}
      {[0, 25, 50, 75, 100].map(pct => (
        <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: `${24 + (pct / 100) * (height - 24)}px`, borderTop: '1px dashed rgba(186,117,23,0.12)', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: muted, marginTop: '-6px', width: '24px', flexShrink: 0 }}>{Math.round(max * pct / 100)}</span>
        </div>
      ))}
      {data.map((d, i) => {
        const pct = (d[valueKey] || 0) / max;
        const color = colorFn ? colorFn(d[valueKey]) : accent;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', paddingLeft: '24px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color, marginBottom: '3px' }}>{d[valueKey]}{d.suffix || ''}</div>
            <motion.div
              initial={{ height: 0 }} animate={{ height: `${pct * (height - 44)}px` }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
              style={{ width: '100%', maxWidth: '36px', background: `linear-gradient(180deg, ${color}DD, ${color}88)`, borderRadius: '5px 5px 0 0', minHeight: '3px', position: 'relative' }} />
            <div style={{ fontSize: '9px', color: muted, marginTop: '4px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '48px' }}>
              {d[labelKey]?.toString().slice(0, 8)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Donut / ring chart
function DonutChart({ value, total, color, label }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const r = 44, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={accentPale} strokeWidth="10" />
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 50 50)"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1, ease: 'easeOut' }} />
        <text x="50" y="54" textAnchor="middle" style={{ fontSize: '18px', fontWeight: 900, fill: '#1C1409', fontFamily: 'inherit' }}>{pct}%</text>
      </svg>
      <p style={{ fontSize: '12px', color: muted, marginTop: '4px' }}>{label}</p>
    </div>
  );
}

// Sparkline (mini line chart)
function Sparkline({ data, color }) {
  if (data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const W = 120, H = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(' ');
  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * W} cy={H - ((data[data.length - 1] - min) / range) * H} r="4" fill={color} />
    </svg>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests]   = useState([]);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      API.get('/test/history'),
      API.get('/streak/get'),
    ]).then(([t, s]) => {
      if (t.status === 'fulfilled') setTests(t.value.data.results || []);
      if (s.status === 'fulfilled') setStreak(s.value.data);
    }).finally(() => setLoading(false));
  }, []);

  // Derived stats
  const total   = tests.length;
  const avg     = total ? Math.round(tests.reduce((a, b) => a + b.score, 0) / total) : 0;
  const best    = total ? Math.round(Math.max(...tests.map(t => t.score))) : 0;
  const passed  = tests.filter(t => t.score >= 50).length;
  const totalCorrect = tests.reduce((a, b) => a + (b.correct || 0), 0);
  const totalQs      = tests.reduce((a, b) => a + (b.total || 0), 0);

  // Topic map
  const topicMap = {};
  tests.forEach(t => {
    if (!topicMap[t.topic]) topicMap[t.topic] = { scores: [], count: 0 };
    topicMap[t.topic].scores.push(t.score);
    topicMap[t.topic].count++;
  });
  const topicData = Object.entries(topicMap).map(([topic, d]) => ({
    topic, score: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length), count: d.count,
  })).sort((a, b) => b.score - a.score);

  // Recent 7 scores for sparkline
  const recentScores = tests.slice(-7).map(t => Math.round(t.score));

  // Score buckets for histogram
  const buckets = [
    { label: '0-20', count: tests.filter(t => t.score < 20).length },
    { label: '20-40', count: tests.filter(t => t.score >= 20 && t.score < 40).length },
    { label: '40-60', count: tests.filter(t => t.score >= 40 && t.score < 60).length },
    { label: '60-80', count: tests.filter(t => t.score >= 60 && t.score < 80).length },
    { label: '80-100', count: tests.filter(t => t.score >= 80).length },
  ];

  const scoreColor = (s) => s >= 70 ? '#059669' : s >= 50 ? accent : '#DC2626';

  if (loading) return (
    <Layout title="Analytics" subtitle="Track your learning progress">
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: '44px', height: '44px', border: `3px solid ${accentPale}`, borderTopColor: accent, borderRadius: '50%', margin: '0 auto' }} />
      </div>
    </Layout>
  );

  return (
    <Layout title="Analytics Dashboard" subtitle="Your complete learning performance overview">
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {[
            { icon: FlaskConical, label: 'Tests Taken',   value: total,                  color: accent,    bg: accentPale },
            { icon: TrendingUp,   label: 'Avg Score',     value: `${avg}%`,               color: '#059669', bg: 'rgba(5,150,105,0.08)' },
            { icon: Target,       label: 'Best Score',    value: `${best}%`,              color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
            { icon: Award,        label: 'Passed (≥50%)', value: passed,                  color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
            { icon: Star,         label: 'Total Points',  value: user?.total_points || 0, color: accent,    bg: accentPale },
            { icon: Flame,        label: 'Streak',        value: `${streak?.current_streak || 0}d`, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '16px', textAlign: 'center' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <s.icon size={16} color={s.color} />
              </div>
              <div style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 900, color: '#1C1409', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: muted, marginTop: '3px', fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Accuracy + Trend Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,280px), 1fr))', gap: '14px', marginBottom: '16px' }}>

          {/* Accuracy Donuts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', marginBottom: '16px' }}>Accuracy Overview</h3>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
              <DonutChart value={totalCorrect} total={totalQs} color="#059669" label="Questions Correct" />
              <DonutChart value={passed} total={total} color={accent} label="Tests Passed" />
              <DonutChart value={streak?.current_streak || 0} total={streak?.longest_streak || 7} color="#7C3AED" label="Streak Progress" />
            </div>
          </motion.div>

          {/* Score Trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', marginBottom: '8px' }}>Score Trend</h3>
            <p style={{ fontSize: '11px', color: muted, marginBottom: '14px' }}>Last {recentScores.length} tests</p>
            {recentScores.length >= 2 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: muted }}>
                    {recentScores[0] < recentScores[recentScores.length - 1]
                      ? '📈 Improving!' : recentScores[0] > recentScores[recentScores.length - 1]
                      ? '📉 Needs work' : '➡️ Consistent'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: accent }}>{recentScores[recentScores.length - 1]}%</span>
                </div>
                {/* Line chart */}
                <div style={{ position: 'relative', height: '80px', paddingLeft: '28px' }}>
                  <svg width="100%" height="80" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    {[0,25,50,75,100].map(p => (
                      <line key={p} x1="0" y1={`${80 - p * 0.8}%`} x2="100%" y2={`${80 - p * 0.8}%`}
                        stroke="rgba(186,117,23,0.1)" strokeWidth="1" />
                    ))}
                    {recentScores.map((v, i) => {
                      const x = (i / (recentScores.length - 1)) * 100;
                      const y = 80 - (v / 100) * 72;
                      const nx = ((i + 1) / (recentScores.length - 1)) * 100;
                      const ny = i < recentScores.length - 1 ? 80 - (recentScores[i + 1] / 100) * 72 : y;
                      return (
                        <g key={i}>
                          {i < recentScores.length - 1 && (
                            <line x1={`${x}%`} y1={y} x2={`${nx}%`} y2={ny}
                              stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
                          )}
                          <circle cx={`${x}%`} cy={y} r="5" fill={scoreColor(v)} stroke="white" strokeWidth="2" />
                          <text x={`${x}%`} y={y - 10} textAnchor="middle" style={{ fontSize: '9px', fill: muted, fontFamily: 'inherit' }}>{v}%</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            ) : (
              <p style={{ color: muted, fontSize: '13px', textAlign: 'center', padding: '20px' }}>Take more tests to see trend</p>
            )}
          </motion.div>
        </div>

        {/* Topic Performance + Score Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,280px), 1fr))', gap: '14px', marginBottom: '16px' }}>

          {/* Topic bars */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', marginBottom: '14px' }}>Topic Performance</h3>
            {topicData.length === 0 ? (
              <p style={{ color: muted, fontSize: '13px', textAlign: 'center', padding: '20px' }}>No tests yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topicData.slice(0, 6).map((t, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{t.topic}</span>
                        <span style={{ fontSize: '10px', color: muted, marginLeft: '6px' }}>{t.count} test{t.count > 1 ? 's' : ''}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: scoreColor(t.score) }}>{t.score}%</span>
                    </div>
                    <div style={{ height: '7px', background: accentPale, borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${t.score}%` }} transition={{ duration: 0.7, delay: i * 0.08 }}
                        style={{ height: '100%', background: `linear-gradient(90deg, ${scoreColor(t.score)}, ${scoreColor(t.score)}BB)`, borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Score Distribution Histogram */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', marginBottom: '4px' }}>Score Distribution</h3>
            <p style={{ fontSize: '11px', color: muted, marginBottom: '12px' }}>How your scores are spread</p>
            <BarChart data={buckets} valueKey="count" labelKey="label"
              colorFn={(v) => v === 0 ? '#E5E7EB' : accent} height={130} />
          </motion.div>
        </div>

        {/* Recent Tests Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>All Tests</h3>
            <button onClick={() => navigate('/mcq')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
              New Test <ChevronRight size={12} />
            </button>
          </div>
          {tests.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '24px', color: muted, fontSize: '14px' }}>No tests yet. Take your first MCQ test!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['Topic', 'Score', 'Correct', 'Grade', 'Time Taken'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${cardBorder}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t, i) => {
                    const grade = t.score >= 80 ? 'A' : t.score >= 65 ? 'B' : t.score >= 50 ? 'C' : t.score >= 35 ? 'D' : 'F';
                    const gColor = { A: '#059669', B: '#2563EB', C: accent, D: '#D97706', F: '#DC2626' }[grade];
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${cardBorder}`, background: i % 2 === 0 ? '#FFFBF5' : 'white' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1C1409' }}>{t.topic}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '48px', height: '5px', background: accentPale, borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${t.score}%`, height: '100%', background: scoreColor(t.score), borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontWeight: 700, color: scoreColor(t.score) }}>{Math.round(t.score)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: muted }}>{t.correct}/{t.total}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', background: `${gColor}15`, fontSize: '12px', fontWeight: 800, color: gColor }}>{grade}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />{t.time_taken ? `${Math.round(t.time_taken / 60)}m` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Weak Topics Alert */}
        {topicData.filter(t => t.score < 50).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(220,38,38,0.04)', borderRadius: '14px', border: '1px solid rgba(220,38,38,0.2)', padding: '16px 20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626', marginBottom: '10px' }}>⚠️ Weak Topics — Need Attention</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {topicData.filter(t => t.score < 50).map((t, i) => (
                <button key={i} onClick={() => navigate('/tutor')}
                  style={{ padding: '6px 14px', borderRadius: '100px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#DC2626', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                  {t.topic} ({t.score}%) → Study Now
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}