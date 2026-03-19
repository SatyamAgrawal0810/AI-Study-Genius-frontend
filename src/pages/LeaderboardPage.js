import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { useAuth } from '../context/AuthContext';
import { Trophy } from 'lucide-react';

const muted = '#8A7055';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/leaderboard')
      .then(res => setLeaders(res.data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const medalColor = (i) => i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7C2F' : accentPale;
  const medalEmoji = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

  return (
    <Layout title="Leaderboard" subtitle="See how you rank among all students">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Top 3 Podium */}
        {leaders.length >= 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {[1, 0, 2].map(idx => {
              const l = leaders[idx];
              const heights = { 0: 130, 1: 100, 2: 85 };
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  style={{ textAlign: 'center', width: '110px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: 'white', margin: '0 auto 7px' }}>
                    {l.username?.[0]?.toUpperCase()}
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#1C1409', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.username}</p>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: accent }}>{l.points} pts</p>
                  <div style={{ height: `${heights[idx]}px`, background: medalColor(idx), borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '8px', marginTop: '8px', fontSize: '22px' }}>
                    {medalEmoji(idx)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full Rankings */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: muted }}>Loading...</div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Trophy size={48} color="rgba(186,117,23,0.25)" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#4A3728' }}>No rankings yet</p>
            <p style={{ fontSize: '13px', color: muted, marginTop: '6px' }}>Take tests to earn points and appear here!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaders.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ x: 4 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '14px', background: l.username === user?.name ? `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.04))` : 'white', border: `1px solid ${l.username === user?.name ? accent : cardBorder}`, transition: 'all 0.2s' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: i < 3 ? medalColor(i) : accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i < 3 ? '17px' : '12px', fontWeight: 800, color: i >= 3 ? accent : undefined, flexShrink: 0 }}>
                  {i < 3 ? medalEmoji(i) : i + 1}
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                  {l.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {l.username}
                    {l.username === user?.name && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: accentPale, color: accent, fontWeight: 700 }}>YOU</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: muted }}>{l.topics_completed || 0} topics completed</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: accent }}>{l.points}</div>
                  <div style={{ fontSize: '10px', color: muted }}>points</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}