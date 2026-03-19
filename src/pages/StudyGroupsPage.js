import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Send, BookOpen, Copy, CheckCircle2, LogIn, X, AlertTriangle, Circle } from 'lucide-react';

const muted = '#8A7055';

// Global persisted state — survives sidebar navigation
const G = {
  ws: null, group: null,
  messages: [], notes: '', members: [],
};

export default function StudyGroupsPage() {
  const { user } = useAuth();
  const [phase, setPhase]   = useState(() => G.group ? 'room' : 'home');
  const [topic, setTopic]   = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [group, setGroup]   = useState(G.group);
  const [messages, setMessages] = useState([...G.messages]);
  const [notes, setNotes]   = useState(G.notes);
  const [members, setMembers] = useState([...G.members]);
  const [msgInput, setMsgInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const wsRef    = useRef(G.ws);
  const bottomRef = useRef(null);
  const msgIdSet = useRef(new Set()); // de-dup message IDs

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (phase === 'room') { e.preventDefault(); e.returnValue = 'Leave study group?'; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  // Re-attach WS when returning from sidebar
  useEffect(() => {
    if (G.ws?.readyState === WebSocket.OPEN) {
      wsRef.current = G.ws;
      bindWS(wsRef.current);
      setGroup(G.group);
      setMessages([...G.messages]);
      setNotes(G.notes);
      setMembers([...G.members]);
    }
  }, []);

  const bindWS = useCallback((sock) => {
    sock.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // ── Members list ──
        if (data.type === 'member_joined' || data.type === 'member_left' || data.type === 'members_list') {
          const list = Array.isArray(data.members)
            ? data.members
            : data.member_name
              ? [...G.members.filter(m => m.name !== data.member_name), { name: data.member_name, id: data.member_id }]
              : G.members;
          G.members = list;
          setMembers([...list]);
        }

        // ── New message — deduplicate by ID or content+sender ──
        if (data.type === 'new_message') {
          const msg = data.message || data;
          const dedupKey = msg.id || `${msg.user_id}-${msg.text}-${msg.sender_name}`;
          if (msgIdSet.current.has(dedupKey)) return; // already shown
          msgIdSet.current.add(dedupKey);
          G.messages = [...G.messages, msg];
          setMessages([...G.messages]);
        }

        // ── Notes sync ──
        if (data.type === 'notes_updated') {
          G.notes = data.notes;
          setNotes(data.notes);
        }
      } catch {}
    };
    sock.onclose = () => { G.ws = null; };
  }, []);

  const openWS = (groupId) => {
    const sock = new WebSocket(`ws://127.0.0.1:8000/ws/group/${groupId}/${user?.id || 1}`);
    sock.onopen = () => sock.send(JSON.stringify({ type: 'get_members' }));
    bindWS(sock);
    wsRef.current = sock;
    G.ws = sock;
  };

  const createGroup = async () => {
    if (!topic.trim()) return;
    try {
      const res = await API.post('/group/create', { topic });
      const g = res.data;
      G.group = g; G.messages = []; G.notes = '';
      G.members = [{ id: user?.id, name: user?.name }];
      msgIdSet.current.clear();
      setGroup(g); setMessages([]); setNotes('');
      setMembers([{ id: user?.id, name: user?.name }]);
      openWS(g.group_id); setPhase('room');
    } catch { alert('Error!'); }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;
    try {
      const res = await API.get(`/group/join/${joinCode.toUpperCase()}`);
      const g = { ...res.data.group, join_code: joinCode.toUpperCase() };
      G.group = g; G.messages = []; G.notes = g.shared_notes || '';
      G.members = [{ id: user?.id, name: user?.name }];
      msgIdSet.current.clear();
      setGroup(g); setMessages([]); setNotes(G.notes);
      setMembers([{ id: user?.id, name: user?.name }]);
      openWS(joinCode.toUpperCase()); setPhase('room');
    } catch { alert('Group not found!'); }
  };

  const sendMessage = () => {
    if (!msgInput.trim() || !wsRef.current) return;
    const text = msgInput;
    // Optimistic add with unique key
    const localId = `local-${Date.now()}-${Math.random()}`;
    msgIdSet.current.add(localId);
    const localMsg = { id: localId, text, user_id: user?.id, sender_name: user?.name, is_local: true };
    G.messages = [...G.messages, localMsg];
    setMessages([...G.messages]);
    wsRef.current.send(JSON.stringify({ type: 'chat_message', text, sender_name: user?.name }));
    setMsgInput('');
  };

  const updateNotes = (val) => {
    setNotes(val); G.notes = val;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'update_notes', notes: val }));
    }
  };

  const leaveRoom = () => {
    wsRef.current?.close();
    wsRef.current = null; G.ws = null; G.group = null;
    G.messages = []; G.notes = ''; G.members = [];
    msgIdSet.current.clear();
    setGroup(null); setMessages([]); setNotes(''); setMembers([]);
    setShowLeave(false); setPhase('home');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(group?.join_code || group?.group_id || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout title="Study Groups" subtitle="Collaborate with friends in real-time">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Leave Modal */}
        <AnimatePresence>
          {showLeave && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                style={{ background: 'white', borderRadius: '18px', padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
                <AlertTriangle size={32} color="#DC2626" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409', marginBottom: '8px' }}>Leave Study Group?</h3>
                <p style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>You'll disconnect. Others can continue.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowLeave(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Stay</button>
                  <button onClick={leaveRoom} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: '#DC2626', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Leave</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HOME */}
        {phase === 'home' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { icon: Plus, title: 'Create Group', desc: 'Start a new group and invite friends', color: accent, bg: accentPale, action: () => setPhase('create') },
                { icon: LogIn, title: 'Join Group', desc: 'Enter a group code to join friends', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', action: () => setPhase('join') },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ y: -4 }} onClick={item.action}
                  style={{ borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '28px', cursor: 'pointer', textAlign: 'center', background: item.bg }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: `0 4px 14px ${item.color}50` }}>
                    <item.icon size={24} color="white" />
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409', marginBottom: '6px' }}>{item.title}</h3>
                  <p style={{ fontSize: '13px', color: muted }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CREATE */}
        {phase === 'create' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '28px', maxWidth: '460px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1C1409', marginBottom: '16px' }}>Create Study Group</h2>
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && createGroup()}
              placeholder="Topic e.g. Python OOP, Machine Learning..."
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit', marginBottom: '14px' }}
              onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPhase('home')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={createGroup} disabled={!topic.trim()}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                Create Group
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* JOIN */}
        {phase === 'join' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '28px', maxWidth: '460px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1C1409', marginBottom: '16px' }}>Join Study Group</h2>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={8}
              placeholder="Group Code" onKeyDown={e => e.key === 'Enter' && joinGroup()}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '20px', color: '#1C1409', outline: 'none', fontFamily: 'monospace', textAlign: 'center', letterSpacing: '4px', marginBottom: '14px' }}
              onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPhase('home')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={joinGroup} disabled={joinCode.length < 4}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                Join Group
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ROOM */}
        {phase === 'room' && group && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${accent}, ${accentLight})`, borderRadius: '16px', padding: '14px 20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>{group.topic}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <Circle size={8} fill="#22C55E" color="#22C55E" />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>Connected · {members.length} member{members.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '2px' }}>
                  {group.join_code || group.group_id}
                </div>
                <button onClick={copyCode} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                </button>
                <button onClick={() => setShowLeave(true)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Members */}
            <div style={{ background: 'white', borderRadius: '12px', border: `1px solid ${cardBorder}`, padding: '10px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Members</span>
              {members.length === 0 ? (
                <span style={{ fontSize: '12px', color: muted }}>Waiting for others to join...</span>
              ) : members.map((m, i) => {
                const isMe = String(m.id) === String(user?.id);
                const name = m.name || m.username || `User ${i + 1}`;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '100px', background: isMe ? accentPale : '#F5F5F5', border: `1px solid ${isMe ? cardBorder : 'transparent'}` }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: 'white' }}>{name[0]?.toUpperCase()}</div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1C1409' }}>{name}{isMe && <span style={{ color: accent, fontSize: '10px' }}> (you)</span>}</span>
                  </div>
                );
              })}
            </div>

            {/* Chat + Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,300px), 1fr))', gap: '12px' }}>
              {/* Chat */}
              <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', height: '400px' }}>
                <div style={{ padding: '11px 16px', borderBottom: `1px solid ${cardBorder}`, fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>💬 Group Chat</div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {messages.length === 0
                    ? <div style={{ textAlign: 'center', padding: '20px', color: muted, fontSize: '13px' }}>Say hi! 👋</div>
                    : messages.map((m, i) => {
                      const isMe = String(m.user_id) === String(user?.id) || m.is_local;
                      const name = m.sender_name || m.name || (isMe ? user?.name : 'User');
                      return (
                        <div key={m.id || i} style={{ display: 'flex', gap: '7px', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                            {name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div style={{ maxWidth: '72%' }}>
                            {!isMe && <div style={{ fontSize: '10px', color: muted, marginBottom: '2px', paddingLeft: '3px', fontWeight: 600 }}>{name}</div>}
                            <div style={{ padding: '8px 12px', borderRadius: isMe ? '12px 4px 12px 12px' : '4px 12px 12px 12px', background: isMe ? `linear-gradient(135deg, ${accent}, ${accentLight})` : accentPale, border: isMe ? 'none' : `1px solid ${cardBorder}` }}>
                              <p style={{ fontSize: '13px', color: isMe ? 'white' : '#1C1409', margin: 0, lineHeight: 1.5 }}>{m.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                  <div ref={bottomRef} />
                </div>
                <div style={{ padding: '9px 10px', borderTop: `1px solid ${cardBorder}`, display: 'flex', gap: '7px' }}>
                  <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '13px', color: '#1C1409', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
                  <button onClick={sendMessage} style={{ width: '34px', height: '34px', borderRadius: '8px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={14} color="white" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', height: '400px' }}>
                <div style={{ padding: '11px 16px', borderBottom: `1px solid ${cardBorder}`, fontSize: '13px', fontWeight: 700, color: '#1C1409', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={14} color={accent} /> Shared Notes
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: muted }}>Auto-syncs</span>
                </div>
                <textarea value={notes} onChange={e => updateNotes(e.target.value)}
                  placeholder="Shared notes... Everyone in the group can edit!"
                  style={{ flex: 1, padding: '14px', border: 'none', outline: 'none', resize: 'none', fontSize: '13px', color: '#1C1409', lineHeight: 1.7, fontFamily: 'inherit', background: 'transparent' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}