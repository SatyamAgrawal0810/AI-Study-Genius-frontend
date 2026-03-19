import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout, { accent, accentLight, accentPale, cardBorder } from '../components/Layout';
import API from '../api/config';
import { History, Eye, Trash2, ZoomIn, ZoomOut, X, BookOpen, ChevronRight, Brain } from 'lucide-react';

const muted = '#8A7055';

function clean(val) {
  if (!val) return '';
  if (typeof val === 'object') return val.topic || val.label || val.name || '';
  return String(val).replace(/\*\*/g, '').trim();
}

// ── COLORS ───────────────────────────────────────────────────────────────────
const PALETTE = [
  { node: '#059669', sub: '#D1FAE5', line: '#059669', text: '#065F46' },
  { node: '#7C3AED', sub: '#EDE9FE', line: '#7C3AED', text: '#4C1D95' },
  { node: '#2563EB', sub: '#DBEAFE', line: '#2563EB', text: '#1E3A8A' },
  { node: '#DC2626', sub: '#FEE2E2', line: '#DC2626', text: '#7F1D1D' },
  { node: '#D97706', sub: '#FEF3C7', line: '#D97706', text: '#78350F' },
  { node: '#EC4899', sub: '#FCE7F3', line: '#EC4899', text: '#831843' },
  { node: '#0891B2', sub: '#CFFAFE', line: '#0891B2', text: '#0C4A6E' },
  { node: '#65A30D', sub: '#ECFCCB', line: '#65A30D', text: '#365314' },
];

// ── LAYOUT ENGINE ─────────────────────────────────────────────────────────────
// Compute total "leaf weight" for a subtree (used for angle allocation)
function leafWeight(node) {
  if (!node.children?.length) return 1;
  return node.children.reduce((s, c) => s + leafWeight(c), 0);
}

// Recursively assign x,y positions using radial layout
function computeLayout(node, cx, cy, startAngle, endAngle, depth, colorIdx) {
  const result = {
    id: node._id || Math.random().toString(36).slice(2),
    label: clean(node.topic || node.label || node.name),
    x: cx, y: cy,
    depth, colorIdx,
    children: [],
    description: node.description || node.details || '',
    rawNode: node,
  };

  const kids = node.children || [];
  if (!kids.length) return result;

  // Radii per depth level
  const radii = [0, 170, 290, 390];
  const r = radii[Math.min(depth + 1, radii.length - 1)];

  const totalWeight = kids.reduce((s, k) => s + leafWeight(k), 0);
  let angle = startAngle;

  kids.forEach((kid, i) => {
    const w = leafWeight(kid);
    const span = ((endAngle - startAngle) * w) / totalWeight;
    const mid = angle + span / 2;
    const kx = cx + r * Math.cos(mid);
    const ky = cy + r * Math.sin(mid);
    const kidColor = depth === 0 ? i % PALETTE.length : colorIdx;
    // Recurse with fan angle ± min 25deg per child
    const fanStart = mid - span / 2;
    const fanEnd   = mid + span / 2;
    result.children.push(computeLayout(kid, kx, ky, fanStart, fanEnd, depth + 1, kidColor));
    angle += span;
  });

  return result;
}

// Flatten tree to list of nodes + edges
function flatten(node, parent = null, nodes = [], edges = []) {
  nodes.push(node);
  if (parent) edges.push({ from: parent, to: node, colorIdx: node.colorIdx });
  node.children?.forEach(c => flatten(c, node, nodes, edges));
  return { nodes, edges };
}

// ── SVG CURVE ─────────────────────────────────────────────────────────────────
function curve(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  // Perpendicular offset for smooth curve
  const cpx = mx - dy * 0.2;
  const cpy = my + dx * 0.2;
  return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;
}

// ── NODE sizes ────────────────────────────────────────────────────────────────
function nodeSize(depth, label) {
  const len = label.length;
  if (depth === 0) return { rx: 78, ry: 30 };
  if (depth === 1) return { rx: Math.max(52, len * 4.2 + 16), ry: 18 };
  if (depth === 2) return { rx: Math.max(44, len * 3.8 + 12), ry: 15 };
  return { rx: Math.max(36, len * 3.4 + 10), ry: 13 };
}

// ── MIND MAP SVG ─────────────────────────────────────────────────────────────
function MindMapCanvas({ data, onSelect, selected }) {
  const svgRef = useRef(null);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.9);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Compute layout — full 360° from center
  const layout = computeLayout(data, 0, 0, -Math.PI, Math.PI, 0, 0);
  const { nodes, edges } = flatten(layout);

  // Bounding box
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs) - 120, maxX = Math.max(...xs) + 120;
  const minY = Math.min(...ys) - 80,  maxY = Math.max(...ys) + 80;
  const W = maxX - minX, H = maxY - minY;

  // Pan/zoom handlers
  const onMouseDown = (e) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setPan({ x: dragStart.current.px + e.clientX - dragStart.current.x, y: dragStart.current.py + e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => { dragging.current = false; };
  const onWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(2.5, z - e.deltaY * 0.001)));
  };

  useEffect(() => {
    const el = svgRef.current;
    if (el) el.addEventListener('wheel', onWheel, { passive: false });
    return () => { if (el) el.removeEventListener('wheel', onWheel); };
  }, []);

  const fontSize = (depth) => depth === 0 ? 13 : depth === 1 ? 11 : depth === 2 ? 10 : 9;

  return (
    <div style={{ position: 'relative' }}>
      {/* Zoom controls */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 10 }}>
        <button onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
          style={{ width: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomIn size={14} color={accent} />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
          style={{ width: '30px', height: '30px', borderRadius: '7px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomOut size={14} color={accent} />
        </button>
        <button onClick={() => { setZoom(0.9); setPan({ x: 0, y: 0 }); }}
          style={{ padding: '0 10px', height: '30px', borderRadius: '7px', border: `1px solid ${cardBorder}`, background: accentPale, color: accent, cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit' }}>
          Reset
        </button>
      </div>

      <svg ref={svgRef} width="100%" height="560"
        viewBox={`${minX} ${minY} ${W} ${H}`}
        style={{ cursor: dragging.current ? 'grabbing' : 'grab', userSelect: 'none', display: 'block' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <defs>
          <filter id="mm-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>
        </defs>

        <g transform={`translate(${pan.x / zoom}, ${pan.y / zoom}) scale(${zoom})`} style={{ transformOrigin: '0 0' }}>

          {/* Edges */}
          {edges.map((e, i) => {
            const col = PALETTE[e.colorIdx % PALETTE.length];
            return (
              <path key={i} d={curve(e.from.x, e.from.y, e.to.x, e.to.y)}
                fill="none" stroke={col.line} strokeWidth={e.to.depth === 1 ? 2.2 : 1.5}
                strokeLinecap="round" opacity={0.6} />
            );
          })}

          {/* Nodes */}
          {nodes.map((n, i) => {
            const col = PALETTE[n.colorIdx % PALETTE.length];
            const { rx, ry } = nodeSize(n.depth, n.label);
            const isSelected = selected?.id === n.id;
            const label = n.label.length > (n.depth === 0 ? 20 : n.depth === 1 ? 18 : 16)
              ? n.label.slice(0, n.depth === 0 ? 18 : n.depth === 1 ? 16 : 14) + '…'
              : n.label;

            let fill, textColor, stroke;
            if (n.depth === 0) { fill = '#1C1409'; textColor = 'white'; stroke = 'white'; }
            else if (n.depth === 1) { fill = col.node; textColor = 'white'; stroke = 'white'; }
            else { fill = col.sub; textColor = col.text; stroke = col.line; }

            return (
              <g key={n.id || i} onClick={() => onSelect(isSelected ? null : n)}
                style={{ cursor: 'pointer' }}>
                <motion.ellipse
                  cx={n.x} cy={n.y} rx={rx} ry={ry}
                  fill={isSelected ? col.node : fill}
                  stroke={isSelected ? '#1C1409' : stroke}
                  strokeWidth={isSelected ? 2.5 : n.depth === 0 ? 0 : 1.5}
                  filter="url(#mm-shadow)"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                />
                <text x={n.x} y={n.y + fontSize(n.depth) * 0.38}
                  textAnchor="middle"
                  style={{
                    fontSize: `${fontSize(n.depth)}px`,
                    fontWeight: n.depth < 2 ? 700 : 600,
                    fill: isSelected ? 'white' : textColor,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    pointerEvents: 'none',
                  }}>
                  {label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// ── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ node, onClose, onLearnMore }) {
  if (!node) return null;
  const col = node.depth > 0 ? PALETTE[node.colorIdx % PALETTE.length] : null;
  const kids = node.children || [];

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      style={{ background: 'white', borderRadius: '16px', border: `1px solid ${cardBorder}`, padding: '20px', height: 'fit-content', minWidth: '240px', boxShadow: '0 8px 32px rgba(186,117,23,0.1)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            {node.depth === 0 ? 'Main Topic' : node.depth === 1 ? 'Branch' : node.depth === 2 ? 'Sub-topic' : 'Detail'}
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1C1409', letterSpacing: '-0.3px' }}>{node.label}</h3>
        </div>
        <button onClick={onClose}
          style={{ width: '28px', height: '28px', borderRadius: '7px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <X size={14} color={muted} />
        </button>
      </div>

      {/* Description */}
      {node.description && (
        <p style={{ fontSize: '13px', color: '#4A3728', lineHeight: 1.7, marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', background: accentPale, border: `1px solid ${cardBorder}` }}>
          {node.description}
        </p>
      )}

      {/* Children list */}
      {kids.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {kids.length} Sub-topic{kids.length > 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {kids.map((k, i) => {
              const kCol = col || PALETTE[k.colorIdx % PALETTE.length];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '9px', background: kCol.sub, border: `1px solid ${kCol.line}30` }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: kCol.line, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: kCol.text }}>{k.label}</span>
                  {k.children?.length > 0 && (
                    <span style={{ fontSize: '10px', color: muted, marginLeft: 'auto' }}>+{k.children.length}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Learn More button */}
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => onLearnMore(node.label)}
        style={{ width: '100%', padding: '10px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontFamily: 'inherit', boxShadow: `0 4px 12px rgba(186,117,23,0.3)` }}>
        <Brain size={14} /> Learn "{node.label}" in Detail
      </motion.button>
    </motion.div>
  );
}

// ── SAMPLES ──────────────────────────────────────────────────────────────────
const SAMPLES = ['Machine Learning', 'Web Development', 'Python', 'Data Science', 'React JS', 'Deep Learning'];

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function MindMapPage() {
  const [topic, setTopic]     = useState('');
  const [language, setLanguage] = useState('English');
  const [mindmap, setMindmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase]     = useState('input');
  const [history, setHistory] = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [selected, setSelected] = useState(null);  // selected node for detail
  const [learnTopic, setLearnTopic] = useState(null);
  const [learnData, setLearnData]   = useState(null);
  const [learnLoading, setLearnLoading] = useState(false);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('mindmap_history') || '[]'));
  }, []);

  const generate = async (t) => {
    const q = (t || topic).trim();
    if (!q) return;
    setTopic(q); setCurrentTopic(q);
    setLoading(true); setMindmap(null); setSelected(null);
    try {
      const res = await API.post('/generate-mindmap', { topic: q, language });
      const m = res.data.mindmap;
      setMindmap(m); setPhase('result');
      const entry = { id: Date.now(), topic: q, date: new Date().toLocaleDateString('en-IN'), mindmap: m };
      const updated = [entry, ...JSON.parse(localStorage.getItem('mindmap_history') || '[]')].slice(0, 20);
      localStorage.setItem('mindmap_history', JSON.stringify(updated));
      setHistory(updated);
    } catch { alert('Error! Please try again.'); }
    finally { setLoading(false); }
  };

  const learnMore = async (t) => {
    setLearnTopic(t); setLearnData(null); setLearnLoading(true);
    try {
      const res = await API.post('/analyze-topic', { topic: t, language });
      setLearnData(res.data.result);
    } catch { alert('Error loading details!'); }
    finally { setLearnLoading(false); }
  };

  const loadHistory = (entry) => {
    setCurrentTopic(entry.topic); setTopic(entry.topic);
    setMindmap(entry.mindmap); setPhase('result'); setSelected(null);
  };

  return (
    <Layout title="Mind Map Generator" subtitle="Visual graphical mind map with clickable detail view">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, padding: 'clamp(14px,3vw,20px)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()}
              placeholder="e.g. Machine Learning, Python, Web Development..."
              style={{ flex: 1, minWidth: '180px', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '14px', color: '#1C1409', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = cardBorder} />
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{ padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: 'white', fontSize: '13px', color: '#1C1409', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <option>English</option><option>Hindi</option>
            </select>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => generate()} disabled={loading || !topic.trim()}
              style={{ padding: '11px 22px', borderRadius: '10px', fontWeight: 700, background: loading ? 'rgba(186,117,23,0.4)' : `linear-gradient(135deg, ${accent}, ${accentLight})`, border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: `0 4px 14px rgba(186,117,23,0.35)` }}>
              {loading ? 'Generating...' : 'Generate Map'}
            </motion.button>
            {history.length > 0 && (
              <button onClick={() => setPhase(phase === 'history' ? (mindmap ? 'result' : 'input') : 'history')}
                style={{ padding: '11px 14px', borderRadius: '10px', border: `1px solid ${cardBorder}`, background: accentPale, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <History size={13} /> ({history.length})
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {SAMPLES.map((t, i) => (
              <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => generate(t)}
                style={{ padding: '5px 12px', borderRadius: '100px', border: `1px solid ${cardBorder}`, background: accentPale, fontSize: '12px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '56px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ width: '44px', height: '44px', border: `3px solid ${accentPale}`, borderTopColor: accent, borderRadius: '50%', margin: '0 auto 14px' }} />
            <p style={{ fontSize: '14px', color: muted }}>Building mind map for "<strong>{currentTopic}</strong>"...</p>
          </div>
        )}

        {/* History */}
        {phase === 'history' && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1C1409' }}>Mind Map History</h2>
              <button onClick={() => setPhase(mindmap ? 'result' : 'input')}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>← Back</button>
            </div>
            {history.map((h, i) => (
              <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'white', borderRadius: '14px', border: `1px solid ${cardBorder}`, padding: '14px 18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1C1409' }}>{h.topic}</div>
                  <div style={{ fontSize: '11px', color: muted }}>{h.date}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => loadHistory(h)}
                    style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} /> View
                  </button>
                  <button onClick={() => { const u = history.filter(x => x.id !== h.id); setHistory(u); localStorage.setItem('mindmap_history', JSON.stringify(u)); }}
                    style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Result */}
        {phase === 'result' && mindmap && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1C1409' }}>{currentTopic}</h3>
                <p style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>Click any node to see details · Drag to pan · Scroll to zoom</p>
              </div>
              <button onClick={() => { setMindmap(null); setPhase('input'); setSelected(null); setLearnTopic(null); }}
                style={{ padding: '7px 14px', borderRadius: '8px', background: accentPale, border: `1px solid ${cardBorder}`, color: accent, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
                New Map
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 280px' : '1fr', gap: '14px', alignItems: 'start' }}>
              {/* SVG Canvas */}
              <div style={{ background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, overflow: 'hidden', position: 'relative' }}>
                <MindMapCanvas data={mindmap} selected={selected} onSelect={setSelected} />
              </div>

              {/* Detail Panel */}
              <AnimatePresence>
                {selected && (
                  <DetailPanel
                    key={selected.id}
                    node={selected}
                    onClose={() => { setSelected(null); setLearnTopic(null); setLearnData(null); }}
                    onLearnMore={learnMore}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Learn More panel - full width below */}
            <AnimatePresence>
              {learnTopic && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  style={{ marginTop: '14px', background: 'white', borderRadius: '18px', border: `1px solid ${cardBorder}`, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', background: accentPale, borderBottom: `1px solid ${cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={16} color={accent} />
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#1C1409' }}>Learning: {learnTopic}</span>
                    </div>
                    <button onClick={() => { setLearnTopic(null); setLearnData(null); }}
                      style={{ width: '28px', height: '28px', borderRadius: '7px', border: `1px solid ${cardBorder}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={13} color={muted} />
                    </button>
                  </div>
                  <div style={{ padding: '20px', maxHeight: '380px', overflowY: 'auto' }}>
                    {learnLoading ? (
                      <div style={{ textAlign: 'center', padding: '32px' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{ width: '36px', height: '36px', border: `3px solid ${accentPale}`, borderTopColor: accent, borderRadius: '50%', margin: '0 auto 10px' }} />
                        <p style={{ color: muted, fontSize: '13px' }}>Loading details for "{learnTopic}"...</p>
                      </div>
                    ) : learnData ? (
                      <div>
                        {/* Render notes section */}
                        {learnData.split('\n').map((line, i) => {
                          const t = line.trim();
                          if (!t || t.startsWith('#') || t.match(/^[=\-]{3,}/)) return null;
                          if (t.match(/^[\*\-]\s/)) return (
                            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '7px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, flexShrink: 0, marginTop: '8px' }} />
                              <p style={{ fontSize: '14px', color: '#4A3728', lineHeight: 1.75, margin: 0 }}>
                                {t.replace(/^\*{1,2}([^*]+)\*{1,2}/g, '$1').replace(/^[\*\-]\s/, '')}
                              </p>
                            </div>
                          );
                          return <p key={i} style={{ fontSize: '14px', color: '#4A3728', lineHeight: 1.8, marginBottom: '5px' }}>{t.replace(/\*\*/g, '')}</p>;
                        })}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px', padding: '10px 16px', background: 'white', borderRadius: '12px', border: `1px solid ${cardBorder}`, alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: muted }}>LEGEND</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '28px', height: '14px', background: '#1C1409', borderRadius: '7px' }} />
                <span style={{ fontSize: '11px', color: muted }}>Main Topic</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '28px', height: '14px', background: '#059669', borderRadius: '7px' }} />
                <span style={{ fontSize: '11px', color: muted }}>Branches</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '28px', height: '12px', background: '#D1FAE5', border: '1px solid #059669', borderRadius: '6px' }} />
                <span style={{ fontSize: '11px', color: muted }}>Sub-topics</span>
              </div>
              <span style={{ fontSize: '11px', color: muted, marginLeft: 'auto' }}>🖱️ Click node → details · Scroll → zoom · Drag → pan</span>
            </div>
          </motion.div>
        )}

        {/* Empty */}
        {phase === 'input' && !loading && (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <span style={{ fontSize: '60px', display: 'block', marginBottom: '16px' }}>🗺️</span>
            </motion.div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#4A3728' }}>Enter a topic to generate a graphical mind map</p>
            <p style={{ fontSize: '13px', color: muted, marginTop: '8px', maxWidth: '360px', margin: '8px auto 0' }}>
              AI creates a spider map • Click any node to see details • Click "Learn in Detail" for full notes
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}