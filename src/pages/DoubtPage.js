import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Send, Sparkles, User, Trash2, History, ChevronRight, X } from 'lucide-react';

const muted = '#8A7055';

function stripBold(t) { return (t || '').replace(/\*\*/g, '').replace(/^\s*[\*\-]\s+/gm, '').trim(); }

function Bold({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*{1,2}[^*]+\*{1,2})/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*{1,2}[^*]+\*{1,2}$/.test(p)) return <strong key={i} style={{ fontWeight: 700, color: '#1C1409' }}>{p.replace(/\*{1,2}/g, '')}</strong>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  const lines = (msg.text || '').split('\n');
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isUser ? 'rgba(124,58,237,0.12)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isUser ? <User size={14} color="#7C3AED" /> : <Sparkles size={14} color="white" />}
      </div>
      <div style={{ maxWidth: '78%', padding: '11px 15px', borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: isUser ? `linear-gradient(135deg, ${accent}, ${accentLight})` : 'white', border: isUser ? 'none' : `1px solid ${cardBorder}`, boxShadow: '0 2px 8px rgba(186,117,23,0.07)' }}>
        {lines.map((line, i) => {
          const t = line.trim();
          if (!t) return <div key={i} style={{ height: '5px' }} />;
          const isBullet = t.match(/^[\*\-]\s+/);
          if (isBullet) return (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isUser ? 'rgba(255,255,255,0.7)' : accent, flexShrink: 0, marginTop: '8px' }} />
              <p style={{ fontSize: '14px', color: isUser ? 'white' : '#1C1409', lineHeight: 1.65, margin: 0 }}>
                {isUser ? stripBold(t) : <Bold text={t} />}
              </p>
            </div>
          );
          return <p key={i} style={{ fontSize: '14px', color: isUser ? 'white' : '#1C1409', lineHeight: 1.65, margin: '0 0 3px' }}>
            {isUser ? stripBold(t) : <Bold text={t} />}
          </p>;
        })}
      </div>
    </motion.div>
  );
}

const QUICK_DOUBTS = [
  'What is the difference between stack and queue?',
  'Explain recursion with a simple example',
  'What is the difference between == and === in JavaScript?',
  'What is time complexity and Big O notation?',
  'Explain SQL joins with examples',
  'What is OOP? Explain with example',
];

const WELCOME_MSG = (name) => ({
  role: 'buddy',
  text: `Hey ${name || 'there'}! 👋 I'm your AI Study Buddy. Ask me anything — concepts, code, exam doubts — I'll explain simply with examples!`
});

export default function DoubtPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MSG(user?.name?.split(' ')[0])]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [language, setLanguage] = useState('English');
  const [phase, setPhase]       = useState('chat'); // chat | history
  const [chatHistory, setChatHistory] = useState([]); // saved sessions
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setChatHistory(JSON.parse(localStorage.getItem('doubt_history') || '[]'));
  }, []);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput('');
    const history = messages.slice(1).slice(-6).map(m => ({ user: m.role === 'user' ? m.text : '', buddy: m.role === 'buddy' ? m.text : '' })).filter(m => m.user || m.buddy);
    setMessages(p => [...p, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await API.post('/study-buddy', { message: msg, chat_history: history, language });
      setMessages(p => [...p, { role: 'buddy', text: res.data.reply }]);
    } catch {
      setMessages(p => [...p, { role: 'buddy', text: 'Sorry, I had trouble. Please try again!' }]);
    } finally { setLoading(false); }
  };

  const saveSession = () => {
    if (messages.length <= 1) return;
    const label = messages.find(m => m.role === 'user')?.text?.slice(0, 50) || 'Chat Session';
    const entry = { id: Date.now(), label, date: new Date().toLocaleDateString('en-IN'), messages, count: messages.filter(m => m.role === 'user').length };
    const updated = [entry, ...JSON.parse(localStorage.getItem('doubt_history') || '[]')].slice(0, 20);
    localStorage.setItem('doubt_history', JSON.stringify(updated));
    setChatHistory(updated);
  };

  const clearChat = () => {
    saveSession();
    setMessages([WELCOME_MSG(user?.name?.split(' ')[0])]);
  };

  const loadSession = (entry) => {
    setMessages(entry.messages);
    setPhase('chat');
  };

  return (
    <Layout title="Doubt Solver" subtitle="Ask any question — your AI Study Buddy is here 24/7">
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 115px)' }}>

        {/* History Panel */}
        {phase === 'history' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Chat History</h2>
              <button onClick={() => setPhase('chat')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>← Back</button>
            </div>
            {chatHistory.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, color: muted }}>No saved chats yet</div>
              : chatHistory.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.label}</div>
                    <div style={{ fontSize: '11px', color: muted }}>{h.date} · {h.count} questions</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => loadSession(h)}
                      style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' }}>
                      View
                    </button>
                    <button onClick={() => { const u = chatHistory.filter(x => x.id !== h.id); setChatHistory(u); localStorage.setItem('doubt_history', JSON.stringify(u)); }}
                      style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))
            }
          </motion.div>
        )}

        {/* Chat Panel */}
        {phase === 'chat' && (
          <>
            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.length <= 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Questions</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {QUICK_DOUBTS.map((q, i) => (
                      <motion.button key={i} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => sendMessage(q)}
                        style={{ textAlign: 'left', padding: '9px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '13px', color: accent, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ChevronRight size={13} /> {q}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
              </AnimatePresence>

              {loading && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={14} color="white" />
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: 'white', border: `1px solid ${cardBorder}`, display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ y: [-3, 3, -3] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        style={{ width: '7px', height: '7px', borderRadius: '50%', background: accent }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '12px', boxShadow: '0 4px 20px rgba(186,117,23,0.07)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '12px', color: '#1C1409', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <option>English</option><option>Hindi</option>
                </select>
                <button onClick={clearChat}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: 'white', color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Trash2 size={12} /> Clear & Save
                </button>
                <button onClick={() => { saveSession(); setPhase('history'); }}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: accentPale, color: accent, cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <History size={12} /> History ({chatHistory.length})
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask any doubt... (Press Enter to send)"
                  style={{ flex: 1, padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  style={{ width: '42px', height: '42px', borderRadius: '10px', background: loading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0, boxShadow: `0 4px 12px rgba(186,117,23,0.35)` }}>
                  <Send size={16} color="white" />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}