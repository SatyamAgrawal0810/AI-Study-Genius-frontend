import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Brain, BookOpen, Trophy, Zap, Target, Users,
  Sun, Moon, ArrowRight, Sparkles, ChevronRight, Star,
  Calculator, FlaskConical, Atom, Microscope, Globe, Music,
  PenTool, Lightbulb, GraduationCap, BookMarked, Cpu, Compass,
  LogOut, LayoutDashboard, Shield, Menu, X
} from 'lucide-react';

const features = [
  { icon: Brain, title: "AI Tutor", desc: "Personal AI teacher available 24/7 to explain any concept in simple terms", tag: "Popular" },
  { icon: BookOpen, title: "Smart Notes", desc: "Upload your syllabus and get beautifully structured notes instantly", tag: null },
  { icon: Trophy, title: "Quiz Battle", desc: "Challenge friends to live MCQ battles and climb the leaderboard", tag: "New" },
  { icon: Zap, title: "Exam Predictor", desc: "AI analyzes patterns to predict what topics will appear in your exam", tag: null },
  { icon: Target, title: "Weak Topic Detector", desc: "Identifies your weak areas and creates a personalized study plan", tag: null },
  { icon: Users, title: "Study Groups", desc: "Collaborate in real-time with shared notes and group discussions", tag: null },
];

const stats = [
  { value: "15", suffix: "+", label: "AI Agents" },
  { value: "100", suffix: "%", label: "Free to use" },
  { value: "10", suffix: "x", label: "Faster Learning" },
];

const testimonials = [
  { name: "Rahul Sharma", role: "Engineering Student", text: "Scored 92% after using AI Study Genius for just 3 weeks. The exam predictor was spot on!", stars: 5 },
  { name: "Priya Patel", role: "Medical Student", text: "The AI tutor explains complex topics better than any textbook. Absolutely love it!", stars: 5 },
  { name: "Arjun Singh", role: "MBA Student", text: "Quiz Battle with friends made studying actually fun. My grades improved drastically.", stars: 5 },
];

const STUDY_ICONS = [
  Brain, BookOpen, Calculator, FlaskConical, Atom, Microscope,
  Globe, Music, PenTool, Lightbulb, GraduationCap, BookMarked,
  Cpu, Compass, Trophy, Zap, Target, Sparkles, Star, Users,
  Brain, BookOpen, Calculator, FlaskConical, Atom, Microscope,
];

function FloatingStudyIcons({ dark }) {
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
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, color: dark ? 'rgba(186,117,23,0.35)' : 'rgba(186,117,23,0.28)' }}
          animate={{ x: [0, driftX, driftX * 0.5, 0], y: [0, driftY, driftY * 0.3, 0], rotate: [0, 180, 360], opacity: [0.5, 1, 0.7, 0.5], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut', rotate: { duration: rotateDuration, ease: 'linear', repeat: Infinity } }}>
          <Icon size={size} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
}

function Counter({ end, suffix }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  if (!started) {
    setStarted(true);
    let cur = 0;
    const timer = setInterval(() => {
      cur += Math.ceil(end / 28);
      if (cur >= end) { setCount(end); clearInterval(timer); } else setCount(cur);
    }, 45);
  }
  return <>{count}{suffix}</>;
}

export default function Landing() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  const isAdmin = user?.email === 'admin@studygenius.com' || user?.is_admin;

  const bg = dark ? '#12100A' : '#FFFBF5';
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(186,117,23,0.04)';
  const cardBorder = dark ? 'rgba(186,117,23,0.22)' : 'rgba(186,117,23,0.16)';
  const text = dark ? '#FFF8EC' : '#1C1409';
  const muted = dark ? '#9C8A6A' : '#8A7055';
  const navBg = dark ? 'rgba(18,16,10,0.88)' : 'rgba(255,251,245,0.88)';
  const accent = '#BA7517';
  const accentLight = '#EF9F27';
  const accentPale = dark ? 'rgba(186,117,23,0.14)' : 'rgba(186,117,23,0.07)';

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  return (
    <div style={{ background: bg, color: text, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'background 0.4s, color 0.4s', overflowX: 'hidden' }}>
      <FloatingStudyIcons dark={dark} />

      {/* Blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-10%', left: '20%', width: '700px', height: '700px', background: `radial-gradient(circle, ${dark ? 'rgba(186,117,23,0.1)' : 'rgba(186,117,23,0.07)'} 0%, transparent 70%)`, filter: 'blur(60px)' }} />
        <motion.div animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{ position: 'absolute', bottom: '5%', right: '-5%', width: '500px', height: '500px', background: `radial-gradient(circle, rgba(239,159,39,0.06) 0%, transparent 70%)`, filter: 'blur(50px)' }} />
      </div>

      {/* ── NAVBAR ── */}
      <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: navBg, backdropFilter: 'blur(24px)', borderBottom: `1px solid ${cardBorder}`, transition: 'background 0.4s' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 clamp(16px, 4vw, 52px)', height: '66px', maxWidth: '1300px', margin: '0 auto' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>
            <motion.div whileHover={{ rotate: 15 }} style={{ width: '34px', height: '34px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(186,117,23,0.4)` }}>
              <Sparkles size={16} color="white" />
            </motion.div>
            <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.5px' }}>Study Genius</span>
          </div>

          {/* Desktop Nav */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => setDark(!dark)}
              style={{ width: '36px', height: '36px', borderRadius: '9px', background: accentPale, border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: accent }}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </motion.button>

            {user ? (
              <>
                {/* User Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '10px', background: accentPale, border: `1px solid ${cardBorder}` }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'white' }}>
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: text }}>{user.name?.split(' ')[0]}</span>
                </div>

                {/* Dashboard */}
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/dashboard')}
                  style={{ padding: '7px 16px', borderRadius: '9px', fontWeight: 600, background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LayoutDashboard size={14} /> Dashboard
                </motion.button>

                {/* Admin Button (only for admin) */}
                {isAdmin && (
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/admin')}
                    style={{ padding: '7px 16px', borderRadius: '9px', fontWeight: 600, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366F1', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} /> Admin
                  </motion.button>
                )}

                {/* Logout */}
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={handleLogout}
                  style={{ padding: '7px 16px', borderRadius: '9px', fontWeight: 600, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LogOut size={14} /> Logout
                </motion.button>
              </>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/login')}
                  style={{ padding: '7px 18px', borderRadius: '9px', fontWeight: 600, background: 'transparent', border: `1px solid ${cardBorder}`, color: text, cursor: 'pointer', fontSize: '14px' }}>
                  Sign in
                </motion.button>
                <motion.button whileHover={{ scale: 1.04, boxShadow: `0 6px 20px rgba(186,117,23,0.5)` }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/signup')}
                  style={{ padding: '7px 18px', borderRadius: '9px', fontWeight: 700, background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', boxShadow: `0 4px 15px rgba(186,117,23,0.35)` }}>
                  Get Started
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button className="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: text, padding: '8px', display: 'none' }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '16px clamp(16px, 4vw, 52px)', borderTop: `1px solid ${cardBorder}`, background: navBg, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setDark(!dark)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: 'inherit' }}>
              {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: accentPale, border: `1px solid ${cardBorder}` }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white' }}>
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: text }}>{user.name}</span>
                </div>
                <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: 'inherit' }}>
                  <LayoutDashboard size={15} /> Dashboard
                </button>
                {isAdmin && (
                  <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366F1', cursor: 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: 'inherit' }}>
                    <Shield size={15} /> Admin Panel
                  </button>
                )}
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: 'inherit' }}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate('/login'); setMenuOpen(false); }} style={{ padding: '10px 14px', borderRadius: '10px', fontWeight: 600, background: 'transparent', border: `1px solid ${cardBorder}`, color: text, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
                  Sign in
                </button>
                <button onClick={() => { navigate('/signup'); setMenuOpen(false); }} style={{ padding: '10px 14px', borderRadius: '10px', fontWeight: 700, background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
                  Get Started
                </button>
              </>
            )}
          </motion.div>
        )}
      </motion.nav>

      {/* ── HERO ── */}
      <motion.div ref={heroRef} style={{ position: 'relative', zIndex: 1, y: heroY, padding: 'clamp(120px, 15vw, 150px) clamp(16px, 4vw, 24px) clamp(60px, 8vw, 80px)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>

          {user ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', background: accentPale, border: `1px solid ${cardBorder}`, marginBottom: '24px', fontSize: '13px', fontWeight: 700, color: accent }}>
              Welcome back, {user.name?.split(' ')[0]}!
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', background: accentPale, border: `1px solid ${cardBorder}`, marginBottom: '24px', fontSize: '12px', fontWeight: 700, color: accent, letterSpacing: '1px' }}>
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent }} />
              AI-POWERED LEARNING PLATFORM
            </motion.div>
          )}

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
            style={{ fontSize: 'clamp(38px, 8vw, 92px)', fontWeight: 900, lineHeight: 1.04, letterSpacing: 'clamp(-1px, -0.03em, -3px)', maxWidth: '920px', margin: '0 auto 20px' }}>
            Study Smarter.{' '}
            <span style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accentLight} 50%, #FAC775 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Score Higher.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: muted, maxWidth: '520px', margin: '0 auto 36px', lineHeight: 1.75 }}>
            Upload your syllabus and let AI create personalized notes, predict exam questions,
            and guide you to academic excellence.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <motion.button whileHover={{ scale: 1.04, boxShadow: `0 10px 35px rgba(186,117,23,0.55)` }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/dashboard')}
                style={{ padding: 'clamp(12px, 2vw, 15px) clamp(24px, 4vw, 34px)', borderRadius: '12px', fontWeight: 800, background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: 'clamp(14px, 2vw, 16px)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 6px 24px rgba(186,117,23,0.4)` }}>
                Go to Dashboard <ArrowRight size={18} />
              </motion.button>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.04, boxShadow: `0 10px 35px rgba(186,117,23,0.55)` }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/signup')}
                  style={{ padding: 'clamp(12px, 2vw, 15px) clamp(24px, 4vw, 34px)', borderRadius: '12px', fontWeight: 800, background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: 'clamp(14px, 2vw, 16px)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 6px 24px rgba(186,117,23,0.4)` }}>
                  Start for Free <ArrowRight size={18} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/login')}
                  style={{ padding: 'clamp(12px, 2vw, 15px) clamp(24px, 4vw, 34px)', borderRadius: '12px', fontWeight: 600, background: accentPale, border: `1px solid ${cardBorder}`, color: text, cursor: 'pointer', fontSize: 'clamp(14px, 2vw, 16px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Sign In
                </motion.button>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ display: 'flex', justifyContent: 'center', maxWidth: '580px', margin: 'clamp(48px, 8vw, 80px) auto 0', border: `1px solid ${cardBorder}`, borderRadius: '16px', overflow: 'hidden', background: cardBg, backdropFilter: 'blur(12px)' }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: 'clamp(18px, 3vw, 28px) 12px', borderRight: i < stats.length - 1 ? `1px solid ${cardBorder}` : 'none' }}>
              <div style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, letterSpacing: '-2px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                <Counter end={parseInt(stat.value)} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: muted, marginTop: '5px', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── FEATURES ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 52px)', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ textAlign: 'center', marginBottom: 'clamp(32px, 5vw, 56px)' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '12px' }}>
            Everything to{' '}
            <span style={{ background: `linear-gradient(135deg, ${accent}, ${accentLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ace your exams</span>
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: muted, maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
            A complete AI toolkit designed to transform how you learn.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
          {features.map((feature, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              onHoverStart={() => setActiveFeature(i)} onHoverEnd={() => setActiveFeature(null)}
              onClick={() => user ? navigate('/dashboard') : navigate('/signup')}
              style={{ padding: 'clamp(20px, 3vw, 28px)', borderRadius: '18px', background: activeFeature === i ? (dark ? 'rgba(186,117,23,0.1)' : 'rgba(186,117,23,0.06)') : cardBg, border: `1px solid ${activeFeature === i ? 'rgba(186,117,23,0.4)' : cardBorder}`, cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'background 0.3s, border-color 0.3s', backdropFilter: 'blur(12px)' }}>
              {feature.tag && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '2px 9px', borderRadius: '100px', background: accentPale, border: `1px solid ${cardBorder}`, fontSize: '10px', fontWeight: 800, color: accent, letterSpacing: '1px' }}>
                  {feature.tag.toUpperCase()}
                </div>
              )}
              <motion.div animate={activeFeature === i ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }} transition={{ duration: 0.3 }}
                style={{ width: '46px', height: '46px', background: `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.1))`, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', border: `1px solid rgba(186,117,23,0.2)` }}>
                <feature.icon size={20} color={accent} />
              </motion.div>
              <h3 style={{ fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.3px' }}>{feature.title}</h3>
              <p style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', color: muted, lineHeight: 1.6 }}>{feature.desc}</p>
              <motion.div animate={activeFeature === i ? { x: 4 } : { x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '18px', color: accent, fontSize: '13px', fontWeight: 700 }}>
                {user ? 'Open' : 'Get started'} <ChevronRight size={14} />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(40px, 6vw, 60px) clamp(16px, 4vw, 52px)', background: dark ? 'rgba(186,117,23,0.04)' : 'rgba(186,117,23,0.03)', borderTop: `1px solid ${cardBorder}`, borderBottom: `1px solid ${cardBorder}` }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 'clamp(28px, 4vw, 44px)' }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, letterSpacing: '-1px' }}>
            Students{' '}
            <span style={{ background: `linear-gradient(135deg, ${accent}, ${accentLight})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>love it</span>
          </h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px', maxWidth: '1000px', margin: '0 auto' }}>
          {testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
              style={{ padding: 'clamp(18px, 3vw, 24px)', borderRadius: '16px', background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '12px' }}>
                {Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={13} fill={accentLight} color={accentLight} />)}
              </div>
              <p style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', color: muted, lineHeight: 1.7, marginBottom: '16px', fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 'clamp(13px, 1.5vw, 14px)', fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: muted }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(48px, 8vw, 80px) clamp(16px, 4vw, 52px)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{ maxWidth: '660px', margin: '0 auto', padding: 'clamp(36px, 6vw, 64px) clamp(24px, 5vw, 56px)', borderRadius: '24px', background: `linear-gradient(135deg, ${accentPale}, rgba(239,159,39,0.08))`, border: `1px solid ${cardBorder}`, position: 'relative', overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', border: `1px solid rgba(186,117,23,0.15)`, pointerEvents: 'none' }} />
          <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2, type: 'spring' }}
            style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 8px 24px rgba(186,117,23,0.4)` }}>
            <Sparkles size={26} color="white" />
          </motion.div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '12px', lineHeight: 1.15 }}>
            {user ? `Keep learning, ${user.name?.split(' ')[0]}!` : 'Ready to transform your study experience?'}
          </h2>
          <p style={{ color: muted, fontSize: 'clamp(14px, 2vw, 16px)', marginBottom: '28px' }}>
            {user ? 'Continue your journey to academic excellence.' : 'Join thousands of students who study smarter with AI.'}
          </p>
          <motion.button whileHover={{ scale: 1.05, boxShadow: `0 12px 40px rgba(186,117,23,0.55)` }} whileTap={{ scale: 0.97 }}
            onClick={() => user ? navigate('/dashboard') : navigate('/signup')}
            style={{ padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px)', borderRadius: '12px', fontWeight: 800, background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: 'clamp(14px, 2vw, 16px)', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: `0 6px 24px rgba(186,117,23,0.4)` }}>
            {user ? 'Go to Dashboard' : "Get Started — It's Free"} <ArrowRight size={16} />
          </motion.button>
        </motion.div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${cardBorder}`, padding: 'clamp(16px, 3vw, 24px) clamp(16px, 4vw, 52px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '14px' }}>Study Genius</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          {user && isAdmin && (
            <span onClick={() => navigate('/admin')} style={{ fontSize: '13px', color: '#6366F1', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={13} /> Admin Panel
            </span>
          )}
          <span style={{ fontSize: '13px', color: muted }}>Built by Aman Rathore</span>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .desktop-nav { display: flex !important; }
        .mobile-nav { display: none !important; }
        @media (max-width: 700px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}