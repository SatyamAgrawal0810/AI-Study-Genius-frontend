import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Brain, BookOpen, Calculator, FlaskConical, Atom, Microscope,
  Globe, Music, PenTool, Lightbulb, GraduationCap, BookMarked,
  Cpu, Compass, Trophy, Zap, Target, Sparkles, Star, Users,
  Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle
} from 'lucide-react';

const STUDY_ICONS = [
  Brain, BookOpen, Calculator, FlaskConical, Atom, Microscope,
  Globe, Music, PenTool, Lightbulb, GraduationCap, BookMarked,
  Cpu, Compass, Trophy, Zap, Target, Sparkles, Star, Users,
  Brain, BookOpen, Calculator, FlaskConical,
];

function FloatingStudyIcons() {
  const icons = STUDY_ICONS.map((Icon, i) => ({
    id: i, Icon,
    x: (i * 37 + Math.sin(i * 1.3) * 20) % 95 + 2,
    y: (i * 29 + Math.cos(i * 0.9) * 15) % 90 + 2,
    size: 14 + (i % 5) * 2,
    duration: 12 + (i % 8) * 3,
    delay: (i * 0.6) % 6,
    rotateDuration: 15 + (i % 5) * 4,
    driftX: (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 10),
    driftY: (i % 3 === 0 ? 1 : -1) * (20 + (i % 5) * 8),
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {icons.map(({ id, Icon, x, y, size, duration, delay, rotateDuration, driftX, driftY }) => (
        <motion.div key={id}
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, color: 'rgba(186,117,23,0.28)' }}
          animate={{ x: [0, driftX, driftX * 0.5, 0], y: [0, driftY, driftY * 0.3, 0], rotate: [0, 180, 360], opacity: [0.5, 1, 0.7, 0.5], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut', rotate: { duration: rotateDuration, ease: 'linear', repeat: Infinity } }}>
          <Icon size={size} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accent = '#BA7517';
  const accentLight = '#EF9F27';
  const cardBorder = 'rgba(186,117,23,0.16)';
  const muted = '#8A7055';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF5', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '16px' }}>
      <FloatingStudyIcons />

      {/* Blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-20%', left: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(186,117,23,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <motion.div animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{ position: 'absolute', bottom: '-10%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(239,159,39,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '28px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <motion.div whileHover={{ rotate: 15 }} style={{ width: '40px', height: '40px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 15px rgba(186,117,23,0.4)` }}>
              <Sparkles size={20} color="white" />
            </motion.div>
            <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px', color: '#1C1409' }}>Study Genius</span>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: 'rgba(255,251,245,0.9)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: `1px solid ${cardBorder}`, padding: '32px 28px', boxShadow: '0 20px 60px rgba(186,117,23,0.1)' }}>

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-1px', color: '#1C1409', marginBottom: '6px' }}>Welcome back</h1>
            <p style={{ fontSize: '14px', color: muted }}>Sign in to continue your learning journey</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', borderRadius: '10px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', marginBottom: '18px' }}>
              <AlertCircle size={15} color="#DC2626" />
              <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 500 }}>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on">
            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1C1409', marginBottom: '7px' }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: muted, pointerEvents: 'none' }} />
                <input type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com"
                  style={{ width: '100%', padding: '12px 13px 12px 40px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'rgba(186,117,23,0.03)', fontSize: '14px', color: '#1C1409', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit', WebkitAppearance: 'none' }}
                  onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>Password</label>
                <span style={{ fontSize: '12px', color: accent, cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: muted, pointerEvents: 'none' }} />
                <input type={showPass ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Enter your password"
                  style={{ width: '100%', padding: '12px 42px 12px 40px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'rgba(186,117,23,0.03)', fontSize: '14px', color: '#1C1409', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit', WebkitAppearance: 'none' }}
                  onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: '4px', display: 'flex' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: `0 8px 30px rgba(186,117,23,0.5)` }}
              whileTap={{ scale: 0.98 }}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800, background: loading ? 'rgba(186,117,23,0.5)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 20px rgba(186,117,23,0.35)`, fontFamily: 'inherit', touchAction: 'manipulation' }}>
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
              ) : (
                <> Sign In <ArrowRight size={16} /> </>
              )}
            </motion.button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', color: muted }}>Don't have an account? </span>
            <span onClick={() => navigate('/signup')} style={{ fontSize: '14px', color: accent, fontWeight: 700, cursor: 'pointer' }}>Sign up free</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ textAlign: 'center', marginTop: '16px' }}>
          <span onClick={() => navigate('/')} style={{ fontSize: '13px', color: muted, cursor: 'pointer', fontWeight: 500 }}>← Back to home</span>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #B8A090; }
        @media (max-width: 480px) {
          input { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}