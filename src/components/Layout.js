import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, LayoutDashboard, FileText, BookOpen, PenTool,
  FlaskConical, Brain, CreditCard, Calendar, MessageCircle,
  Map, Mic, BarChart2, Trophy, Users, Zap, Shield,
  LogOut, Menu, X, User
} from 'lucide-react';

const accent = '#BA7517';
const accentLight = '#EF9F27';
const accentPale = 'rgba(186,117,23,0.08)';
const cardBorder = 'rgba(186,117,23,0.15)';

export const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard' },
  { icon: FileText,        label: 'Syllabus',     path: '/syllabus' },
  { icon: BookOpen,        label: 'Topic Learn',  path: '/topic' },
  { icon: PenTool,         label: 'Prev Papers',  path: '/paper' },
  { icon: FlaskConical,    label: 'MCQ Test',     path: '/mcq' },
  { icon: Brain,           label: 'AI Tutor',     path: '/tutor' },
  { icon: CreditCard,      label: 'Flashcards',   path: '/flashcards' },
  { icon: Calendar,        label: 'Study Planner',path: '/planner' },
  { icon: MessageCircle,   label: 'Doubt Solver', path: '/doubt' },
  { icon: Map,             label: 'Mind Map',     path: '/mindmap' },
  { icon: Mic,             label: 'Mock Interview',path: '/interview' },
  { icon: BarChart2,       label: 'Analytics',    path: '/analytics' },
  { icon: Trophy,          label: 'Leaderboard',  path: '/leaderboard' },
  { icon: Users,           label: 'Study Groups', path: '/groups' },
  { icon: Zap,             label: 'Quiz Battle',  path: '/battle' },
];

function SidebarContent({ onClose, mobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const active = location.pathname;

  return (
    <div style={{ width: mobile ? '260px' : '240px', height: '100vh', background: '#FFFBF5', borderRight: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => { navigate('/'); if (mobile) onClose(); }}>
          <div style={{ width: '30px', height: '30px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 8px rgba(186,117,23,0.35)` }}>
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.4px', color: '#1C1409' }}>Study Genius</span>
        </div>
        {mobile && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A7055', padding: '4px' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* User Card */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${cardBorder}`, flexShrink: 0 }}>
        <motion.div whileHover={{ scale: 1.02 }} onClick={() => { navigate('/profile'); if (mobile) onClose(); }}
          style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: '11px', background: active === '/profile' ? `linear-gradient(135deg, ${accent}, ${accentLight})` : accentPale, cursor: 'pointer', transition: 'background 0.2s' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: active === '/profile' ? 'rgba(255,255,255,0.3)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: active === '/profile' ? 'white' : '#1C1409', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '10px', color: active === '/profile' ? 'rgba(255,255,255,0.8)' : '#8A7055' }}>{user?.level || 'Beginner'} • {user?.total_points || 0} pts</div>
          </div>
          <User size={13} color={active === '/profile' ? 'rgba(255,255,255,0.8)' : '#8A7055'} />
        </motion.div>
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {SIDEBAR_ITEMS.map((item, i) => {
          const isActive = active === item.path;
          return (
            <motion.div key={i} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
              onClick={() => { navigate(item.path); if (mobile) onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 11px', borderRadius: '9px', cursor: 'pointer', marginBottom: '1px', background: isActive ? `linear-gradient(135deg, ${accent}, ${accentLight})` : 'transparent', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = accentPale; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
              <item.icon size={15} color={isActive ? 'white' : '#8A7055'} />
              <span style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? 'white' : '#4A3728' }}>{item.label}</span>
            </motion.div>
          );
        })}

        {/* Admin */}
        {user?.is_admin && (
          <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
            onClick={() => { navigate('/admin'); if (mobile) onClose(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 11px', borderRadius: '9px', cursor: 'pointer', marginTop: '4px', background: active === '/admin' ? 'rgba(99,102,241,0.12)' : 'transparent', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (active !== '/admin') e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
            onMouseLeave={e => { if (active !== '/admin') e.currentTarget.style.background = 'transparent'; }}>
            <Shield size={15} color="#6366F1" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366F1' }}>Admin Panel</span>
          </motion.div>
        )}
      </div>

      {/* Logout */}
      <div style={{ padding: '10px', borderTop: `1px solid ${cardBorder}`, flexShrink: 0 }}>
        <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
          onClick={() => { logout(); navigate('/'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 11px', borderRadius: '9px', cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <LogOut size={15} color="#DC2626" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>Logout</span>
        </motion.div>
      </div>
    </div>
  );
}

export default function Layout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FEF9F0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Desktop Sidebar */}
      <div className="layout-sidebar">
        <SidebarContent onClose={() => {}} mobile={false} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 }}
          onClick={() => setSidebarOpen(false)} />
      )}
      {sidebarOpen && (
        <motion.div initial={{ x: -280 }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 25 }}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 200 }}>
          <SidebarContent onClose={() => setSidebarOpen(false)} mobile={true} />
        </motion.div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(254,249,240,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${cardBorder}`, padding: '0 clamp(16px,3vw,28px)', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="layout-hamburger" onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A3728', padding: '4px', display: 'none' }}>
              <Menu size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 'clamp(14px,2.5vw,17px)', fontWeight: 800, color: '#1C1409', letterSpacing: '-0.4px', lineHeight: 1.2 }}>{title}</h1>
              {subtitle && <p style={{ fontSize: '11px', color: '#8A7055', marginTop: '1px' }}>{subtitle}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '4px 10px', borderRadius: '100px', background: accentPale, border: `1px solid ${cardBorder}`, fontSize: '11px', fontWeight: 700, color: accent }}>
              {user?.level || 'Beginner'}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} onClick={() => navigate('/profile')}
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white', cursor: 'pointer', boxShadow: `0 2px 8px rgba(186,117,23,0.3)` }}>
              {user?.name?.[0]?.toUpperCase()}
            </motion.div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px,3vw,24px) clamp(16px,3vw,28px)' }}>
          {children}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #FFF8EC; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(${accent}, ${accentLight}); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${accent}; }
        .layout-sidebar { display: flex !important; position: sticky; top: 0; height: 100vh; flex-shrink: 0; }
        .layout-hamburger { display: none !important; }
        @media (max-width: 768px) {
          .layout-sidebar { display: none !important; }
          .layout-hamburger { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export { accent, accentLight, accentPale, cardBorder };