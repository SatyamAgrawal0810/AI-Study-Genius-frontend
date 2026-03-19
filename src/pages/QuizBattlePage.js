import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { useAuth } from '../context/AuthContext';
import { Zap, Plus, LogIn, Trophy, Clock, Copy, CheckCircle2, Users, AlertTriangle, X, Circle } from 'lucide-react';

const muted = '#8A7055';

const G = {
  ws: null, room: null, questions: [], scores: {},
  players: [], phase: 'home', current: 0, selected: {}, winner: null,
};

export default function QuizBattlePage() {
  const { user } = useAuth();
  const [phase, setPhase]       = useState(G.phase);
  const [topic, setTopic]       = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [room, setRoom]         = useState(G.room);
  const [questions, setQuestions] = useState(G.questions);
  const [current, setCurrent]   = useState(G.current);
  const [selected, setSelected] = useState(G.selected);
  const [scores, setScores]     = useState(G.scores);
  const [players, setPlayers]   = useState(G.players);
  const [winner, setWinner]     = useState(G.winner);
  const [timeLeft, setTimeLeft] = useState(20);
  const [copied, setCopied]     = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  const wsRef    = useRef(G.ws);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (['lobby','battle'].includes(phase)) { e.preventDefault(); e.returnValue = 'Leave battle?'; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  useEffect(() => {
    if (G.ws?.readyState === WebSocket.OPEN) {
      wsRef.current = G.ws;
      bindWS(wsRef.current);
      setRoom(G.room); setQuestions(G.questions); setScores(G.scores);
      setPlayers(G.players); setCurrent(G.current); setSelected(G.selected);
      setPhase(G.phase);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const bindWS = (sock) => {
    sock.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // ── Players — handle multiple event types from backend ──
        if (['player_joined','player_left','players_list','members_list','member_joined'].includes(data.type)) {
          let list = [];
          if (Array.isArray(data.players))  list = data.players;
          else if (Array.isArray(data.members)) list = data.members;
          else if (data.player_name || data.member_name) {
            // Single player join event
            const name = data.player_name || data.member_name;
            const id   = data.player_id   || data.member_id   || data.user_id;
            const exists = G.players.find(p => String(p.id) === String(id));
            list = exists ? G.players : [...G.players, { id, name }];
          } else {
            list = G.players;
          }
          // Always ensure current user is in list
          const meAlready = list.find(p => String(p.id) === String(user?.id));
          if (!meAlready) list = [{ id: user?.id, name: user?.name }, ...list];
          G.players = list;
          setPlayers([...list]);
        }

        if (data.type === 'game_started') {
          const qs = data.questions || [];
          G.questions = qs; G.current = 0; G.selected = {}; G.phase = 'battle';
          setQuestions(qs); setCurrent(0); setSelected({}); setPhase('battle');
          startTimer();
        }

        if (data.type === 'score_update') {
          G.scores = data.scores || {};
          setScores({ ...G.scores });
        }

        if (data.type === 'game_ended') {
          G.winner = data.winner; G.scores = data.final_scores || {}; G.phase = 'result';
          setWinner(data.winner); setScores({ ...G.scores }); setPhase('result');
          clearInterval(timerRef.current);
        }
      } catch {}
    };
    sock.onclose = () => { clearInterval(timerRef.current); };
  };

  const openWS = (roomId) => {
    const sock = new WebSocket(`ws://127.0.0.1:8000/ws/battle/${roomId}/${user?.id || 1}`);
    sock.onopen = () => {
      // Send join notification with user name
      sock.send(JSON.stringify({ type: 'player_join', player_name: user?.name, player_id: user?.id }));
      sock.send(JSON.stringify({ type: 'get_players' }));
    };
    bindWS(sock);
    wsRef.current = sock; G.ws = sock;
  };

  const createRoom = async () => {
    if (!topic.trim()) return;
    try {
      const res = await API.post('/battle/create', { topic, num_questions: 10 });
      const r = res.data;
      G.room = r; G.phase = 'lobby';
      G.players = [{ id: user?.id, name: user?.name }];
      setRoom(r); setPhase('lobby');
      setPlayers([{ id: user?.id, name: user?.name }]);
      openWS(r.room_id);
    } catch { alert('Error creating room!'); }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return;
    try {
      const res = await API.get(`/battle/join/${joinCode.toUpperCase()}`);
      const r = { ...res.data.room, room_id: joinCode.toUpperCase(), join_code: joinCode.toUpperCase() };
      G.room = r; G.phase = 'lobby';
      G.players = [{ id: user?.id, name: user?.name }];
      setRoom(r); setPhase('lobby');
      setPlayers([{ id: user?.id, name: user?.name }]);
      openWS(joinCode.toUpperCase());
    } catch { alert('Room not found!'); }
  };

  const startGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: 'start_game' }));
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(20);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current); handleTimeout(); return 0; } return p - 1; });
    }, 1000);
  };

  const handleTimeout = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: 'submit_answer', question_index: G.current, is_correct: false }));
    moveNext();
  };

  const selectAnswer = (opt) => {
    if (selected[current] !== undefined) return;
    const newSel = { ...selected, [current]: opt };
    setSelected(newSel); G.selected = newSel;
    clearInterval(timerRef.current);
    const isCorrect = opt === questions[current]?.correct_answer;
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify({ type: 'submit_answer', question_index: current, is_correct: isCorrect }));
    setTimeout(moveNext, 1200);
  };

  const moveNext = () => {
    const next = G.current + 1;
    if (next < G.questions.length) { G.current = next; setCurrent(next); startTimer(); }
    else if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'game_over' }));
  };

  const leaveRoom = () => {
    clearInterval(timerRef.current);
    wsRef.current?.close(); wsRef.current = null;
    Object.assign(G, { ws: null, room: null, questions: [], scores: {}, players: [], phase: 'home', current: 0, selected: {}, winner: null });
    setRoom(null); setQuestions([]); setScores({}); setPlayers([]);
    setWinner(null); setSelected({}); setCurrent(0);
    setShowLeave(false); setPhase('home');
  };

  const copyCode = () => { navigator.clipboard.writeText(room?.join_code || room?.room_id || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const getName = (uid) => {
    const p = players.find(p => String(p.id) === String(uid));
    return p?.name || p?.username || (String(uid) === String(user?.id) ? user?.name : `Player ${uid}`);
  };
  const myScore = scores[String(user?.id || 1)] || 0;

  return (
    <Layout title="Quiz Battle" subtitle="Challenge friends to live MCQ battles">
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Leave Modal */}
        <AnimatePresence>
          {showLeave && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                style={{ background: 'white', borderRadius: '18px', padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
                <AlertTriangle size={32} color="#DC2626" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409', marginBottom: '8px' }}>Leave Battle?</h3>
                <p style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>You'll disconnect from the battle room.</p>
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
                { icon: Plus, title: 'Create Battle', desc: 'Host a quiz and invite friends', color: accent, bg: accentPale, action: () => setPhase('create') },
                { icon: LogIn, title: 'Join Battle', desc: 'Enter a room code to join', color: '#DC2626', bg: 'rgba(220,38,38,0.07)', action: () => setPhase('join') },
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
            <div style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1409', marginBottom: '12px' }}>How it works</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Host creates a room and shares the code','Friends join using the room code','Host starts — same questions for all','Answer fast + correctly = more points','Highest score wins!'].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: accent, flexShrink: 0 }}>{i+1}</div>
                    <p style={{ fontSize: '13px', color: '#1C1409' }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* CREATE */}
        {phase === 'create' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '28px', maxWidth: '460px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1C1409', marginBottom: '16px' }}>Create Battle Room</h2>
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && createRoom()}
              placeholder="Battle topic e.g. Python, React..."
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit', marginBottom: '14px' }}
              onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPhase('home')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={createRoom} disabled={!topic.trim()}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                Create Room
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* JOIN */}
        {phase === 'join' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '28px', maxWidth: '460px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1C1409', marginBottom: '16px' }}>Join Battle Room</h2>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={8}
              placeholder="ROOMCODE" onKeyDown={e => e.key === 'Enter' && joinRoom()}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '22px', color: '#1C1409', outline: 'none', fontFamily: 'monospace', textAlign: 'center', letterSpacing: '4px', marginBottom: '14px' }}
              onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPhase('home')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={joinRoom} disabled={joinCode.length < 4}
                style={{ flex: 2, padding: '12px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                Join Room
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* LOBBY */}
        {phase === 'lobby' && room && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '32px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button onClick={() => setShowLeave(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#DC2626', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                <X size={13} /> Leave
              </button>
            </div>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Zap size={32} color={accent} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1C1409', marginBottom: '6px' }}>Battle Room Ready!</h2>
            <p style={{ fontSize: '14px', color: muted, marginBottom: '20px' }}>Topic: <strong style={{ color: '#1C1409' }}>{room.topic}</strong></p>

            {/* Room Code */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '12px', background: accentPale, border: `1px solid ${cardBorder}`, marginBottom: '20px' }}>
              <span style={{ fontSize: '22px', fontWeight: 900, color: accent, fontFamily: 'monospace', letterSpacing: '4px' }}>{room.join_code || room.room_id}</span>
              <button onClick={copyCode} style={{ width: '32px', height: '32px', borderRadius: '8px', background: cardBorder, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <p style={{ fontSize: '13px', color: muted, marginBottom: '16px' }}>Share this code with friends!</p>

            {/* Players List */}
            <div style={{ background: '#FEF9F0', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Users size={14} color={accent} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Players in Lobby ({players.length})
                </span>
              </div>
              {players.length === 0 ? (
                <p style={{ fontSize: '13px', color: muted }}>Waiting for players to join...</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {players.map((p, i) => {
                    const isMe = String(p.id) === String(user?.id);
                    const name = p.name || p.username || `Player ${i+1}`;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 14px', borderRadius: '100px', background: isMe ? accentPale : 'white', border: `1px solid ${isMe ? cardBorder : '#E5E7EB'}` }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'white' }}>
                          {name[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C1409' }}>{name}</span>
                        {isMe && <span style={{ fontSize: '10px', color: accent, fontWeight: 700 }}>(you)</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <motion.button whileHover={{ scale: 1.04, boxShadow: `0 8px 24px rgba(186,117,23,0.4)` }} whileTap={{ scale: 0.97 }} onClick={startGame}
              style={{ padding: '14px 36px', borderRadius: '12px', fontWeight: 800, background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', fontFamily: 'inherit' }}>
              Start Battle! ⚡
            </motion.button>
          </motion.div>
        )}

        {/* BATTLE */}
        {phase === 'battle' && questions.length > 0 && (
          <div>
            <div style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '12px 18px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>Q{current+1}/{questions.length}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color={timeLeft <= 5 ? '#DC2626' : accent} />
                <motion.span animate={timeLeft <= 5 ? { scale: [1,1.2,1] } : {}} transition={{ repeat: Infinity, duration: 0.5 }}
                  style={{ fontSize: '16px', fontWeight: 900, color: timeLeft <= 5 ? '#DC2626' : accent }}>{timeLeft}s</motion.span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: accent }}>Your: {myScore} pts</span>
              <button onClick={() => setShowLeave(true)}
                style={{ padding: '4px 10px', borderRadius: '7px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#DC2626', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit' }}>
                Leave
              </button>
            </div>
            <div style={{ height: '5px', background: accentPale, borderRadius: '3px', marginBottom: '12px', overflow: 'hidden' }}>
              <motion.div animate={{ width: `${(timeLeft / 20) * 100}%` }} transition={{ duration: 1 }}
                style={{ height: '100%', background: timeLeft <= 5 ? '#DC2626' : `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: '3px' }} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(18px,3vw,28px)', marginBottom: '12px' }}>
                <p style={{ fontSize: 'clamp(15px,2.5vw,18px)', fontWeight: 700, color: '#1C1409', lineHeight: 1.6, marginBottom: '20px' }}>
                  {questions[current]?.question}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,220px), 1fr))', gap: '10px' }}>
                  {Object.entries(questions[current]?.options || {}).map(([key, val]) => {
                    const sel = selected[current];
                    const isSelected = sel === key;
                    const isCorrect  = sel !== undefined && key === questions[current]?.correct_answer;
                    const isWrong    = sel === key && key !== questions[current]?.correct_answer;
                    return (
                      <motion.div key={key} whileHover={{ scale: sel !== undefined ? 1 : 1.02 }} whileTap={{ scale: sel !== undefined ? 1 : 0.98 }}
                        onClick={() => selectAnswer(key)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', borderRadius: '12px', border: `1.5px solid ${isCorrect ? '#059669' : isWrong ? '#DC2626' : isSelected ? accent : cardBorder}`, background: isCorrect ? 'rgba(5,150,105,0.07)' : isWrong ? 'rgba(220,38,38,0.06)' : isSelected ? accentPale : '#FEF9F0', cursor: sel !== undefined ? 'default' : 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isCorrect ? '#059669' : isWrong ? '#DC2626' : isSelected ? accent : accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: (isSelected || isCorrect) ? 'white' : muted, flexShrink: 0 }}>{key}</div>
                        <span style={{ fontSize: '14px', color: '#1C1409' }}>{val}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Live Scores with Names */}
            {Object.keys(scores).length > 0 && (
              <div style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Live Scores</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([uid, pts], i) => {
                    const isMe = String(uid) === String(user?.id);
                    const name = getName(uid);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderRadius: '100px', background: isMe ? accentPale : '#F5F5F5', border: `1px solid ${isMe ? cardBorder : 'transparent'}` }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: 'white' }}>
                          {name[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1C1409' }}>{isMe ? 'You' : name}</span>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: accent }}>{pts}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: '36px', textAlign: 'center' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}
              style={{ width: '72px', height: '72px', borderRadius: '50%', background: accentPale, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trophy size={32} color={accent} />
            </motion.div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#1C1409', letterSpacing: '-1px', marginBottom: '6px' }}>Battle Over!</h2>
            {winner && (
              <p style={{ fontSize: '15px', color: muted, marginBottom: '20px' }}>
                🏆 Winner: <strong style={{ color: accent }}>
                  {String(winner) === String(user?.id) ? 'You Won! 🎉' : getName(winner)}
                </strong>
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', maxWidth: '340px', margin: '0 auto 24px' }}>
              {Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([uid, pts], i) => {
                const isMe = String(uid) === String(user?.id);
                const name = isMe ? `${user?.name?.split(' ')[0]} (You)` : getName(uid);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 18px', borderRadius: '12px', background: isMe ? accentPale : '#F5F5F5', border: `1px solid ${isMe ? cardBorder : 'transparent'}` }}>
                    <span style={{ fontSize: '18px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 700, color: '#1C1409', textAlign: 'left' }}>{name}</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: accent }}>{pts} pts</span>
                  </div>
                );
              })}
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={leaveRoom}
              style={{ padding: '12px 28px', borderRadius: '12px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit' }}>
              Play Again
            </motion.button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}