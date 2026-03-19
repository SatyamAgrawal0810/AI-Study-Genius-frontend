import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { Shield, Users, FlaskConical, Globe, CheckCircle2 } from 'lucide-react';

const muted = '#8A7055';

const ENDPOINTS = [
  { method: 'POST', path: '/analyze-syllabus', desc: 'Analyze syllabus' },
  { method: 'POST', path: '/analyze-paper', desc: 'Analyze previous paper' },
  { method: 'POST', path: '/analyze-topic', desc: 'Topic notes + roadmap' },
  { method: 'POST', path: '/generate-mcq', desc: 'Generate MCQ questions' },
  { method: 'POST', path: '/tutor/explain', desc: 'AI Tutor explain' },
  { method: 'POST', path: '/tutor/evaluate', desc: 'Evaluate student answer' },
  { method: 'POST', path: '/generate-flashcards', desc: 'Generate flashcards' },
  { method: 'POST', path: '/generate-plan', desc: 'Study planner' },
  { method: 'POST', path: '/solve-doubt', desc: 'Solve doubt' },
  { method: 'POST', path: '/generate-mindmap', desc: 'Mind map' },
  { method: 'POST', path: '/interview/generate', desc: 'Mock interview questions' },
  { method: 'POST', path: '/interview/evaluate', desc: 'Evaluate interview answer' },
  { method: 'POST', path: '/predict-exam', desc: 'Exam predictor' },
  { method: 'POST', path: '/summarize-notes', desc: 'Notes summarizer' },
  { method: 'POST', path: '/detect-weak-topics', desc: 'Weak topic detector' },
  { method: 'POST', path: '/predict-grade', desc: 'Grade predictor' },
  { method: 'POST', path: '/connect-concepts', desc: 'Concept connector' },
  { method: 'POST', path: '/study-buddy', desc: 'AI Study Buddy chat' },
  { method: 'POST', path: '/auth/signup', desc: 'User signup' },
  { method: 'POST', path: '/auth/login', desc: 'User login' },
  { method: 'GET', path: '/auth/me', desc: 'Get current user' },
  { method: 'GET', path: '/leaderboard', desc: 'Get leaderboard' },
  { method: 'POST', path: '/test/save-result', desc: 'Save test result' },
  { method: 'GET', path: '/test/history', desc: 'Get test history' },
  { method: 'POST', path: '/progress/save', desc: 'Save progress' },
  { method: 'GET', path: '/progress/get', desc: 'Get progress' },
  { method: 'GET', path: '/streak/get', desc: 'Get streak' },
  { method: 'POST', path: '/streak/update', desc: 'Update streak' },
  { method: 'GET', path: '/badges/get', desc: 'Get badges' },
  { method: 'POST', path: '/battle/create', desc: 'Create quiz battle' },
  { method: 'GET', path: '/battle/join/{room_id}', desc: 'Join quiz battle' },
  { method: 'POST', path: '/group/create', desc: 'Create study group' },
  { method: 'GET', path: '/group/join/{group_id}', desc: 'Join study group' },
  { method: 'POST', path: '/export-pdf', desc: 'Export to PDF' },
  { method: 'GET', path: '/redis-test', desc: 'Redis health check' },
  { method: 'GET', path: '/celery-status', desc: 'Celery status' },
  { method: 'WS', path: '/ws/battle/{room_id}/{user_id}', desc: 'Quiz Battle WebSocket' },
  { method: 'WS', path: '/ws/group/{group_id}/{user_id}', desc: 'Study Group WebSocket' },
];

const SYSTEM_SERVICES = [
  { name: 'FastAPI Backend', status: 'Online' },
  { name: 'PostgreSQL Database', status: 'Online' },
  { name: 'Redis Cache', status: 'Online' },
  { name: 'Groq LLM API', status: 'Online' },
  { name: 'Celery Workers', status: 'Running' },
  { name: 'WebSocket Server', status: 'Online' },
];

const methodColor = (m) => m === 'POST' ? '#059669' : m === 'GET' ? '#2563EB' : m === 'WS' ? '#7C3AED' : '#DC2626';
const methodBg = (m) => m === 'POST' ? 'rgba(5,150,105,0.08)' : m === 'GET' ? 'rgba(37,99,235,0.08)' : m === 'WS' ? 'rgba(124,58,237,0.08)' : 'rgba(220,38,38,0.08)';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/leaderboard')
      .then(res => setUsers(res.data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPoints = users.reduce((a, b) => a + (b.points || 0), 0);
  const totalTopics = users.reduce((a, b) => a + (b.topics_completed || 0), 0);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
    { id: 'endpoints', label: `API (${ENDPOINTS.length})`, icon: Globe },
  ];

  return (
    <Layout title="Admin Panel" subtitle="Manage and monitor AI Study Genius platform">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'white', borderRadius: '12px', border: `1px solid ${cardBorder}`, padding: '5px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, padding: '9px 12px', borderRadius: '9px', border: 'none', background: activeTab === tab.id ? `linear-gradient(135deg, ${accent}, ${accentLight})` : 'transparent', color: activeTab === tab.id ? 'white' : muted, cursor: 'pointer', fontSize: 'clamp(11px,1.5vw,13px)', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <tab.icon size={13} />
              <span style={{ display: 'inline' }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Total Users', value: users.length, color: accent, icon: Users },
                { label: 'Active Users', value: users.filter(u => u.points > 0).length, color: '#059669', icon: CheckCircle2 },
                { label: 'Total Points', value: totalPoints, color: '#7C3AED', icon: FlaskConical },
                { label: 'Topics Done', value: totalTopics, color: '#2563EB', icon: Globe },
                { label: 'API Routes', value: ENDPOINTS.length, color: '#DC2626', icon: Globe },
                { label: 'Services', value: SYSTEM_SERVICES.length, color: '#059669', icon: Shield },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '16px', textAlign: 'center' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <s.icon size={16} color={s.color} />
                  </div>
                  <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: muted, marginTop: '3px', fontWeight: 500 }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* System Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1409', marginBottom: '14px' }}>System Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
                {SYSTEM_SERVICES.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: '10px', background: '#FEF9F0' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{s.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                        style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669' }} />
                      {s.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1409', marginBottom: '14px' }}>Registered Users</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: muted }}>Loading users...</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px', color: muted, fontSize: '14px' }}>No users registered yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {users.map((u, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: '#FEF9F0', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: '100px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>{u.username}</div>
                      <div style={{ fontSize: '11px', color: muted }}>{u.topics_completed || 0} topics • Rank #{i + 1}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ padding: '3px 10px', borderRadius: '100px', background: accentPale, fontSize: '12px', fontWeight: 700, color: accent }}>{u.points} pts</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1409', marginBottom: '14px' }}>
              All API Endpoints ({ENDPOINTS.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ENDPOINTS.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.015 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '9px', background: '#FEF9F0', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ padding: '3px 9px', borderRadius: '6px', background: methodBg(e.method), fontSize: '10px', fontWeight: 800, color: methodColor(e.method), flexShrink: 0, letterSpacing: '0.3px' }}>
                    {e.method}
                  </span>
                  <code style={{ fontSize: '12px', color: '#1C1409', fontFamily: "'JetBrains Mono', 'Courier New', monospace", flex: 1, minWidth: '140px' }}>
                    {e.path}
                  </code>
                  <span style={{ fontSize: '12px', color: muted, marginLeft: 'auto' }}>{e.desc}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}