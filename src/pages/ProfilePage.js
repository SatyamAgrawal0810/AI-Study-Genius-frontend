import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Star, Flame, Trophy, TrendingUp,
  Award, Shield, BookOpen, FlaskConical, Target,
  Edit2, CheckCircle2, Camera, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const muted = '#8A7055';

const BADGE_DEFS = {
  first_login:    { icon: '🎉', name: 'Welcome!',        desc: 'First login' },
  first_test:     { icon: '📝', name: 'Test Taker',      desc: 'First MCQ test' },
  perfect_score:  { icon: '💯', name: 'Perfect!',        desc: '100% score' },
  streak_3:       { icon: '🔥', name: '3 Day Streak',    desc: '3 days streak' },
  streak_7:       { icon: '⚡', name: 'Week Warrior',    desc: '7 days streak' },
  streak_30:      { icon: '👑', name: 'Monthly Master',  desc: '30 days streak' },
  topics_5:       { icon: '🗺️', name: 'Explorer',       desc: '5 topics studied' },
  topics_10:      { icon: '📚', name: 'Scholar',         desc: '10 topics studied' },
  points_100:     { icon: '💪', name: 'Century',         desc: '100 points earned' },
  points_500:     { icon: '🚀', name: 'High Achiever',   desc: '500 points earned' },
  points_1000:    { icon: '🌟', name: 'Legend',          desc: '1000 points earned' },
};

const ALL_BADGES = Object.entries(BADGE_DEFS).map(([id, b]) => ({ id, ...b }));

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [streak, setStreak] = useState(null);
  const [badges, setBadges] = useState([]);
  const [tests, setTests] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      const [s, b, t, p] = await Promise.allSettled([
        API.get('/streak/get'),
        API.get('/badges/get'),
        API.get('/test/history'),
        API.get('/progress/get'),
      ]);
      if (s.status === 'fulfilled') setStreak(s.value.data);
      if (b.status === 'fulfilled') setBadges(b.value.data.badges || []);
      if (t.status === 'fulfilled') setTests(t.value.data.results || []);
      if (p.status === 'fulfilled') setProgress(p.value.data.progress || []);
    } catch {}
    finally { setLoading(false); }
  };

  const earnedBadgeIds = badges.map(b => b.name);
  const avgScore = tests.length ? Math.round(tests.reduce((a, b) => a + b.score, 0) / tests.length) : 0;
  const levelProgress = () => {
    const pts = user?.total_points || 0;
    if (pts >= 1000) return { level: 'Expert', next: null, pct: 100, current: pts, needed: 1000 };
    if (pts >= 500) return { level: 'Advanced', next: 'Expert', pct: Math.round(((pts - 500) / 500) * 100), current: pts - 500, needed: 500 };
    if (pts >= 100) return { level: 'Intermediate', next: 'Advanced', pct: Math.round(((pts - 100) / 400) * 100), current: pts - 100, needed: 400 };
    return { level: 'Beginner', next: 'Intermediate', pct: Math.round((pts / 100) * 100), current: pts, needed: 100 };
  };
  const lvl = levelProgress();

  const STATS = [
    { icon: Flame,      label: 'Current Streak',  value: `${streak?.current_streak || 0} days`,  color: '#DC2626' },
    { icon: Star,       label: 'Total Points',    value: `${user?.total_points || 0}`,            color: accent },
    { icon: TrendingUp, label: 'Avg Score',        value: `${avgScore}%`,                          color: '#059669' },
    { icon: FlaskConical, label: 'Tests Taken',   value: tests.length,                            color: '#7C3AED' },
    { icon: BookOpen,   label: 'Topics Studied',  value: progress.length,                         color: '#2563EB' },
    { icon: Trophy,     label: 'Best Streak',     value: `${streak?.longest_streak || 0} days`,  color: '#D97706' },
  ];

  const TABS = ['overview', 'badges', 'history'];

  if (!user) return null;

  return (
    <Layout title="My Profile" subtitle="Your learning journey and achievements">
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Profile Header Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.06))`, borderRadius: '20px', border: `1px solid ${cardBorder}`, padding: 'clamp(20px,3vw,28px)', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>

          {/* Decorative circle */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', border: `1px solid rgba(186,117,23,0.15)`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: 'white', boxShadow: `0 6px 20px rgba(186,117,23,0.4)` }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white' }}>
                <Camera size={10} color="white" />
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              {editName ? (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    style={{ flex: 1, minWidth: '140px', padding: '7px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'white', fontSize: '15px', color: '#1C1409', outline: 'none', fontFamily: 'inherit', fontWeight: 700 }}
                    onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
                  <button onClick={() => setEditName(false)}
                    style={{ padding: '7px 14px', borderRadius: '8px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' }}>
                    Save
                  </button>
                  <button onClick={() => { setEditName(false); setNewName(user.name); }}
                    style={{ padding: '7px 14px', borderRadius: '8px', background: 'white', border: `1px solid ${cardBorder}`, color: muted, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 900, color: '#1C1409', letterSpacing: '-0.5px' }}>{newName || user.name}</h2>
                  <button onClick={() => setEditName(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: '4px', display: 'flex' }}>
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Mail size={13} color={muted} />
                <span style={{ fontSize: '13px', color: muted }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: '100px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, fontSize: '12px', fontWeight: 700, color: 'white' }}>
                  {lvl.level}
                </span>
                {user.is_admin && (
                  <span style={{ padding: '4px 12px', borderRadius: '100px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '12px', fontWeight: 700, color: '#6366F1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={11} /> Admin
                  </span>
                )}
                <span style={{ padding: '4px 12px', borderRadius: '100px', background: 'rgba(220,38,38,0.08)', fontSize: '12px', fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={11} /> {streak?.current_streak || 0} day streak
                </span>
              </div>
            </div>

            {/* Logout */}
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => { logout(); navigate('/'); }}
              style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', flexShrink: 0 }}>
              <LogOut size={13} /> Logout
            </motion.button>
          </div>

          {/* Level Progress Bar */}
          {lvl.next && (
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#4A3728' }}>{lvl.level} → {lvl.next}</span>
                <span style={{ fontSize: '12px', color: muted }}>{lvl.current}/{lvl.needed} pts</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(186,117,23,0.12)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${lvl.pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: '4px' }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'white', borderRadius: '12px', border: `1px solid ${cardBorder}`, padding: '5px' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: '9px 12px', borderRadius: '9px', border: 'none', background: activeTab === tab ? `linear-gradient(135deg, ${accent}, ${accentLight})` : 'transparent', color: activeTab === tab ? 'white' : muted, cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.2s' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,160px), 1fr))', gap: '10px', marginBottom: '16px' }}>
              {STATS.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -3 }}
                  style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '16px', textAlign: 'center' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <s.icon size={16} color={s.color} />
                  </div>
                  <div style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 900, color: '#1C1409', letterSpacing: '-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: muted, marginTop: '3px', fontWeight: 500 }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Recent Progress */}
            {progress.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', marginBottom: '14px' }}>Topic Progress</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {progress.slice(0, 6).map((p, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{p.topic}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: p.completion_percentage >= 80 ? '#059669' : accent }}>
                          {Math.round(p.completion_percentage)}%
                        </span>
                      </div>
                      <div style={{ height: '6px', background: accentPale, borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${p.completion_percentage}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                          style={{ height: '100%', background: p.completion_percentage >= 80 ? 'linear-gradient(90deg, #059669, #22C55E)' : `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ fontSize: '14px', color: muted }}>{earnedBadgeIds.length}/{ALL_BADGES.length} earned</p>
              <div style={{ height: '6px', width: '140px', background: accentPale, borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(earnedBadgeIds.length / ALL_BADGES.length) * 100}%` }} transition={{ duration: 1 }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: '3px' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,160px), 1fr))', gap: '10px' }}>
              {ALL_BADGES.map((badge, i) => {
                const earned = earnedBadgeIds.includes(badge.id);
                return (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -3 }}
                    style={{ background: earned ? `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.06))` : 'white', borderRadius: '14px', border: `1px solid ${earned ? cardBorder : 'rgba(186,117,23,0.08)'}`, padding: '16px', textAlign: 'center', opacity: earned ? 1 : 0.45, transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px', filter: earned ? 'none' : 'grayscale(1)' }}>{badge.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1C1409', marginBottom: '3px' }}>{badge.name}</div>
                    <div style={{ fontSize: '11px', color: muted }}>{badge.desc}</div>
                    {earned && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} color="#059669" />
                        <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>Earned</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '18px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', marginBottom: '14px' }}>Test History ({tests.length})</h3>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '24px', color: muted, fontSize: '13px' }}>Loading...</p>
            ) : tests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <FlaskConical size={40} color="rgba(186,117,23,0.25)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#4A3728' }}>No tests yet</p>
                <button onClick={() => navigate('/mcq')}
                  style={{ marginTop: '12px', padding: '8px 18px', borderRadius: '9px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                  Take your first test
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tests.map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: '10px', background: '#FEF9F0', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{t.topic}</div>
                      <div style={{ fontSize: '11px', color: muted }}>{t.correct}/{t.total} correct</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: t.score >= 70 ? '#059669' : t.score >= 50 ? accent : '#DC2626' }}>
                        {Math.round(t.score)}%
                      </div>
                      {t.score >= 70 && <CheckCircle2 size={15} color="#059669" />}
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