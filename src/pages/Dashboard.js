import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import {
  Flame, Star, TrendingUp, Clock, ChevronRight,
  FlaskConical, Trophy, BookMarked, Lightbulb,
  GraduationCap, Award, FileText, Brain,
  Map, Users, Zap, CreditCard, Calendar
} from 'lucide-react';

const muted = '#8A7055';

const QUICK_ACTIONS = [
  { icon: FileText,  label: 'Analyze Syllabus', desc: 'Upload & get AI notes',   path: '/syllabus',  color: '#BA7517', bg: 'rgba(186,117,23,0.08)' },
  { icon: Brain,     label: 'AI Tutor',          desc: 'Learn any topic now',     path: '/tutor',     color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  { icon: FlaskConical, label: 'Take MCQ Test',  desc: 'Test your knowledge',     path: '/mcq',       color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  { icon: Zap,       label: 'Quiz Battle',        desc: 'Challenge friends',       path: '/battle',    color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  { icon: Map,       label: 'Mind Map',           desc: 'Visualize topics',        path: '/mindmap',   color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  { icon: CreditCard,label: 'Flashcards',         desc: 'Quick revision',          path: '/flashcards',color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
];

const LEARNING_PATH = [
  { icon: BookMarked,    label: 'Upload Syllabus',   path: '/syllabus' },
  { icon: Lightbulb,     label: 'Learn a Topic',     path: '/topic' },
  { icon: GraduationCap, label: 'Practice Papers',   path: '/paper' },
  { icon: Award,         label: 'Take MCQ Test',     path: '/mcq' },
  { icon: Calendar,      label: 'Study Planner',     path: '/planner' },
  { icon: Users,         label: 'Join Study Group',  path: '/groups' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [streak, setStreak] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [testHistory, setTestHistory] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.allSettled([
      API.get('/streak/get'),
      API.get('/leaderboard'),
      API.get('/test/history'),
    ]).then(([s, l, t]) => {
      if (s.status === 'fulfilled') setStreak(s.value.data);
      if (l.status === 'fulfilled') setLeaderboard(l.value.data.leaderboard || []);
      if (t.status === 'fulfilled') setTestHistory(t.value.data.results || []);
    });
  }, [user]);

  if (!user) return null;

  const avgScore = testHistory.length
    ? Math.round(testHistory.reduce((a, b) => a + b.score, 0) / testHistory.length)
    : 0;

  const greeting = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening';

  const STAT_CARDS = [
    { icon: Flame,       label: 'Day Streak',   value: streak?.current_streak || 0, suffix: ' days', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
    { icon: Star,        label: 'Total Points', value: user?.total_points || 0,     suffix: ' pts',  color: accent,    bg: accentPale },
    { icon: TrendingUp,  label: 'Avg Score',    value: avgScore,                    suffix: '%',     color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { icon: Clock,       label: 'Tests Taken',  value: testHistory.length,          suffix: '',      color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  ];

  return (
    <Layout
      title={`Good ${greeting}, ${user?.name?.split(' ')[0]}!`}
      subtitle="Ready to learn something new today?"
    >
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,150px), 1fr))', gap: '12px', marginBottom: '22px' }}>
        {STAT_CARDS.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            whileHover={{ y: -3 }}
            style={{ padding: 'clamp(14px,2.5vw,20px)', borderRadius: '16px', background: 'white', border: `1px solid ${cardBorder}`, boxShadow: '0 2px 10px rgba(186,117,23,0.05)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <s.icon size={17} color={s.color} />
            </div>
            <div style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 900, color: '#1C1409', letterSpacing: '-1px' }}>
              {s.value}{s.suffix}
            </div>
            <div style={{ fontSize: '12px', color: muted, marginTop: '3px', fontWeight: 500 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '22px' }}>
        <h2 style={{ fontSize: 'clamp(14px,2vw,16px)', fontWeight: 800, color: '#1C1409', letterSpacing: '-0.4px', marginBottom: '12px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,150px), 1fr))', gap: '10px' }}>
          {QUICK_ACTIONS.map((a, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.06 }}
              whileHover={{ y: -4, boxShadow: '0 8px 20px rgba(186,117,23,0.1)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.path)}
              style={{ padding: 'clamp(14px,2.5vw,20px)', borderRadius: '14px', background: 'white', border: `1px solid ${cardBorder}`, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <a.icon size={19} color={a.color} />
              </div>
              <div style={{ fontSize: 'clamp(12px,1.8vw,14px)', fontWeight: 700, color: '#1C1409', marginBottom: '3px' }}>{a.label}</div>
              <div style={{ fontSize: '11px', color: muted }}>{a.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px), 1fr))', gap: '14px' }}>

        {/* Recent Tests */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ padding: '18px', borderRadius: '16px', background: 'white', border: `1px solid ${cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>Recent Tests</h3>
            <span onClick={() => navigate('/analytics')}
              style={{ fontSize: '12px', color: accent, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              View all <ChevronRight size={12} />
            </span>
          </div>
          {testHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <FlaskConical size={30} color="rgba(186,117,23,0.25)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px', color: muted }}>No tests yet</p>
              <button onClick={() => navigate('/mcq')}
                style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                Take your first test
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {testHistory.slice(0, 4).map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 11px', borderRadius: '9px', background: '#FEF9F0' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1C1409' }}>{t.topic}</div>
                    <div style={{ fontSize: '10px', color: muted }}>{t.correct}/{t.total} correct</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: t.score >= 70 ? '#059669' : t.score >= 50 ? accent : '#DC2626' }}>
                    {Math.round(t.score)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
          style={{ padding: '18px', borderRadius: '16px', background: 'white', border: `1px solid ${cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>Leaderboard</h3>
            <span onClick={() => navigate('/leaderboard')}
              style={{ fontSize: '12px', color: accent, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              Full board <ChevronRight size={12} />
            </span>
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Trophy size={30} color="rgba(186,117,23,0.25)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px', color: muted }}>No rankings yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {leaderboard.slice(0, 5).map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 11px', borderRadius: '9px', background: l.username === user.name ? accentPale : '#FEF9F0', border: l.username === user.name ? `1px solid ${cardBorder}` : '1px solid transparent' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7C2F' : accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? '12px' : '10px', fontWeight: 800, color: i < 3 ? 'white' : accent, flexShrink: 0 }}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                  </div>
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: l.username === user.name ? 700 : 500, color: '#1C1409', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.username}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: accent, flexShrink: 0 }}>{l.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Learning Path */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          style={{ padding: '18px', borderRadius: '16px', background: `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.04))`, border: `1px solid ${cardBorder}` }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', marginBottom: '5px' }}>Start Learning</h3>
          <p style={{ fontSize: '11px', color: muted, marginBottom: '12px' }}>Pick a path to begin</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {LEARNING_PATH.map((item, i) => (
              <motion.div key={i} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderRadius: '10px', background: 'white', border: `1px solid ${cardBorder}`, cursor: 'pointer' }}>
                <item.icon size={14} color={accent} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1C1409', flex: 1 }}>{item.label}</span>
                <ChevronRight size={13} color={muted} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}