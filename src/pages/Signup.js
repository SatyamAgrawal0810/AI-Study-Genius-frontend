import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Brain, BookOpen, Calculator, FlaskConical, Atom, Microscope,
  Globe, Music, PenTool, Lightbulb, GraduationCap, BookMarked,
  Cpu, Compass, Trophy, Zap, Target, Sparkles, Star, Users,
  Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, User, CheckCircle2
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

const perks = [
  "15+ AI Agents at your service",
  "Personalized study plans",
  "Live quiz battles with friends",
  "100% free forever",
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const accent = '#BA7517';
  const accentLight = '#EF9F27';
  const cardBorder = 'rgba(186,117,23,0.16)';
  const muted = '#8A7055';

  const passwordStrength = () => {
    const p = form.password;
    if (!p.length) return { score: 0, label: '', color: 'transparent' };
    if (p.length < 6) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (p.length < 10) return { score: 2, label: 'Fair', color: accentLight };
    return { score: 3, label: 'Strong', color: '#22C55E' };
  };
  const strength = passwordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup(form.name, form.email, form.password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF5', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative', overflow: 'hidden', padding: '16px' }}>
      <FloatingStudyIcons />

      {/* Blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-20%', right: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(186,117,23,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Logo - Mobile Top */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', paddingTop: '16px', marginBottom: '20px', cursor: 'pointer' }}
        onClick={() => navigate('/')}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <motion.div whileHover={{ rotate: 15 }} style={{ width: '38px', height: '38px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 15px rgba(186,117,23,0.4)` }}>
            <Sparkles size={18} color="white" />
          </motion.div>
          <span style={{ fontWeight: 800, fontSize: '19px', letterSpacing: '-0.5px', color: '#1C1409' }}>Study Genius</span>
        </div>
      </motion.div>

      {/* Two column on desktop, single on mobile */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '880px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Left – Perks (hidden on small screens via class) */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
          className="signup-left"
          style={{ flex: '1 1 300px', paddingTop: '24px' }}>

          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#1C1409', lineHeight: 1.1, marginBottom: '14px' }}>
            Start your journey to{' '}
            <span style={{ background: `linear-gradient(135deg, ${accent}, ${accentLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              academic excellence
            </span>
          </h1>
          <p style={{ fontSize: '15px', color: muted, lineHeight: 1.7, marginBottom: '28px' }}>
            Join thousands of students who transformed their study habits with AI.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {perks.map((perk, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={13} color={accent} />
                </div>
                <span style={{ fontSize: '14px', color: '#1C1409', fontWeight: 500 }}>{perk}</span>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ padding: '18px', borderRadius: '14px', background: 'rgba(186,117,23,0.05)', border: `1px solid ${cardBorder}` }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex' }}>
                {['R', 'P', 'A'].map((l, i) => (
                  <div key={i} style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: 'white', marginLeft: i > 0 ? '-8px' : 0, border: '2px solid #FFFBF5' }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>Join 2,000+ students</div>
                <div style={{ fontSize: '12px', color: muted }}>already learning smarter</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '1px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={accentLight} color={accentLight} />)}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right – Form */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ flex: '1 1 320px', background: 'rgba(255,251,245,0.9)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: `1px solid ${cardBorder}`, padding: '32px 28px', boxShadow: '0 20px 60px rgba(186,117,23,0.1)' }}>

          {success ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '30px 0' }}>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}
                style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={32} color="#22C55E" />
              </motion.div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1C1409', marginBottom: '8px' }}>Account Created!</h2>
              <p style={{ fontSize: '14px', color: muted }}>Redirecting you to login...</p>
            </motion.div>
          ) : (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.8px', color: '#1C1409', marginBottom: '6px' }}>Create your account</h2>
                <p style={{ fontSize: '13px', color: muted }}>Free forever. No credit card required.</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 14px', borderRadius: '10px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', marginBottom: '16px' }}>
                  <AlertCircle size={15} color="#DC2626" />
                  <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 500 }}>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} autoComplete="on">
                {/* Name */}
                <div style={{ marginBottom: '13px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1C1409', marginBottom: '6px' }}>Full name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: muted, pointerEvents: 'none' }} />
                    <input type="text" autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Satyam Agrawal"
                      style={{ width: '100%', padding: '11px 13px 11px 40px', borderRadius: '10px', border: `1px solid rgba(186,117,23,0.16)`, background: 'rgba(186,117,23,0.03)', fontSize: '14px', color: '#1C1409', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit', WebkitAppearance: 'none' }}
                      onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'rgba(186,117,23,0.16)'} />
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '13px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1C1409', marginBottom: '6px' }}>Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: muted, pointerEvents: 'none' }} />
                    <input type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com"
                      style={{ width: '100%', padding: '11px 13px 11px 40px', borderRadius: '10px', border: `1px solid rgba(186,117,23,0.16)`, background: 'rgba(186,117,23,0.03)', fontSize: '14px', color: '#1C1409', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit', WebkitAppearance: 'none' }}
                      onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'rgba(186,117,23,0.16)'} />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1C1409', marginBottom: '6px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: muted, pointerEvents: 'none' }} />
                    <input type={showPass ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Min. 8 characters"
                      style={{ width: '100%', padding: '11px 42px 11px 40px', borderRadius: '10px', border: `1px solid rgba(186,117,23,0.16)`, background: 'rgba(186,117,23,0.03)', fontSize: '14px', color: '#1C1409', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit', WebkitAppearance: 'none' }}
                      onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'rgba(186,117,23,0.16)'} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: '4px', display: 'flex' }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.password.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '7px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength.score ? strength.color : 'rgba(186,117,23,0.1)', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                    </motion.div>
                  )}
                </div>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.02, boxShadow: `0 8px 30px rgba(186,117,23,0.5)` }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 800, background: loading ? 'rgba(186,117,23,0.5)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 4px 20px rgba(186,117,23,0.35)`, fontFamily: 'inherit', touchAction: 'manipulation' }}>
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                  ) : (
                    <>Create Free Account <ArrowRight size={16} /></>
                  )}
                </motion.button>
              </form>

              <div style={{ marginTop: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '14px', color: muted }}>Already have an account? </span>
                <span onClick={() => navigate('/login')} style={{ fontSize: '14px', color: accent, fontWeight: 700, cursor: 'pointer' }}>Sign in</span>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: '16px', paddingBottom: '16px' }}>
        <span onClick={() => navigate('/')} style={{ fontSize: '13px', color: muted, cursor: 'pointer', fontWeight: 500 }}>← Back to home</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #B8A090; }
        @media (max-width: 600px) {
          .signup-left { display: none !important; }
          input { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}