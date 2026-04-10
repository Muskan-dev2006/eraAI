import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { TrendingUp, TrendingDown, Minus, Filter, Crown, Award, Star } from 'lucide-react';

export default function Leaderboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ stream: '', tier: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.stream) params.stream = filters.stream;
      if (filters.tier) params.tier = filters.tier;
      const { data } = await axios.get('/api/student/leaderboard', { params });
      setStudents(data);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const userRank = user ? students.findIndex(s => s._id === user._id) + 1 : 0;

  const streamFilters = [
    { label: 'All Streams', value: '' },
    { label: 'DSA', value: 'DSA' },
    { label: 'AI/ML', value: 'AI/ML' },
    { label: 'Web Dev', value: 'Web Dev' },
    { label: 'CS Fundamentals', value: 'CS Fundamentals' },
  ];

  const tierFilters = [
    { label: 'All Tiers', value: '' },
    { label: 'Tier 1', value: 'Tier 1' },
    { label: 'Tier 2', value: 'Tier 2' },
    { label: 'Tier 3', value: 'Tier 3' },
  ];

  const podiumColors = [
    { border: '#94a3b8', bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', label: '2nd', height: 'pt-6' },
    { border: '#7DD3FC', bg: 'rgba(125,211,252,0.12)', text: '#7DD3FC', label: '1st', height: 'pt-2' },
    { border: '#818cf8', bg: 'rgba(129,140,248,0.1)', text: '#818cf8', label: '3rd', height: 'pt-10' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7ff' }}>
      <Navbar />

      {/* ── Hero Banner ── */}
      <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2040 60%, #1a1040 100%)', paddingTop: 96, paddingBottom: 48 }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Crown size={22} style={{ color: '#7DD3FC' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7DD3FC' }}>Live Rankings</span>
            </div>
            <h1 className="text-4xl font-black mb-2" style={{ color: '#7DD3FC' }}>AI Proficiency Leaderboard</h1>
            <p style={{ color: '#94a3b8', fontSize: 15 }}>Top assessed students across every stream and college tier in India</p>
            {userRank > 0 && (
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full" style={{ background: 'rgba(125,211,252,0.15)', border: '1px solid rgba(125,211,252,0.3)' }}>
                <Star size={13} style={{ color: '#7DD3FC' }} />
                <span className="text-sm font-semibold" style={{ color: '#7DD3FC' }}>
                  Your rank: #{userRank} {filters.stream ? `in ${filters.stream}` : 'Overall'}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" style={{ marginTop: -24 }}>

        {/* ── Filters ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 mb-6 flex flex-wrap gap-2 items-center"
          style={{ background: '#fff', boxShadow: '0 4px 20px rgba(125,211,252,0.1)', border: '1px solid #e0f2fe' }}>
          <div className="flex items-center gap-1.5 mr-2" style={{ color: '#64748b', fontSize: 12 }}>
            <Filter size={13} /> Filters
          </div>
          {streamFilters.map(({ label, value }) => (
            <button key={label} onClick={() => setFilters(f => ({ ...f, stream: value }))}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filters.stream === value ? 'rgba(125,211,252,0.15)' : 'transparent',
                border: filters.stream === value ? '1px solid rgba(125,211,252,0.5)' : '1px solid #e2e8f0',
                color: filters.stream === value ? '#0284c7' : '#64748b',
                transition: 'all 0.15s',
              }}>
              {label}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
          {tierFilters.map(({ label, value }) => (
            <button key={label} onClick={() => setFilters(f => ({ ...f, tier: value }))}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filters.tier === value ? 'rgba(129,140,248,0.15)' : 'transparent',
                border: filters.tier === value ? '1px solid rgba(129,140,248,0.5)' : '1px solid #e2e8f0',
                color: filters.tier === value ? '#4f46e5' : '#64748b',
                transition: 'all 0.15s',
              }}>
              {label}
            </button>
          ))}
        </motion.div>

        {/* ── Top 3 Podium ── */}
        {!loading && students.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-4 mb-6">
            {[students[1], students[0], students[2]].map((s, idx) => {
              const realRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
              const c = podiumColors[idx];
              return s ? (
                <motion.div key={s._id} whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => navigate(`/profile/${s._id}`)}
                  className={`text-center rounded-2xl p-5 cursor-pointer ${c.height}`}
                  style={{ background: '#fff', border: `1.5px solid ${c.border}40`, boxShadow: `0 4px 20px ${c.border}18`, transition: 'all 0.25s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 12px 32px ${c.border}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${c.border}18`; }}>
                  <div className="text-2xl mb-2">{realRank === 1 ? '🥇' : realRank === 2 ? '🥈' : '🥉'}</div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black mx-auto mb-2"
                    style={{ background: `linear-gradient(135deg, ${c.border}40, ${c.border}20)`, border: `2px solid ${c.border}50`, color: c.border }}>
                    {s.name?.charAt(0)}
                  </div>
                  <p className="text-sm font-bold text-gray-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 mb-2">{s.stream}</p>
                  <p className="text-xl font-black" style={{ color: c.text }}>{s.overallScore}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${c.border}15`, color: c.text }}>{c.label}</span>
                </motion.div>
              ) : <div key={idx} />;
            })}
          </motion.div>
        )}

        {/* ── Table ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 4px 24px rgba(125,211,252,0.1)', border: '1px solid #e0f2fe' }}>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3"
            style={{ background: 'linear-gradient(135deg, #f0f9ff, #e8f4fd)', borderBottom: '1px solid #bae6fd' }}>
            {[['col-span-1','Rank'],['col-span-4','Student'],['col-span-2 hidden sm:block','Stream'],['col-span-2 hidden sm:block','Tier'],['col-span-1','Score'],['col-span-1','Rounds'],['col-span-1','Trend']].map(([cls, label]) => (
              <div key={label} className={cls} style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center" style={{ color: '#64748b', fontSize: 14 }}>
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#7DD3FC', borderTopColor: 'transparent' }} />
              Loading leaderboard...
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center" style={{ color: '#94a3b8', fontSize: 14 }}>No students yet — be the first!</div>
          ) : (
            <div>
              {students.map((s, i) => {
                const isUser = user && s._id === user._id;
                const scoreColor = s.overallScore >= 80 ? '#22c55e' : s.overallScore >= 60 ? '#f59e0b' : '#94a3b8';
                return (
                  <motion.div key={s._id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/profile/${s._id}`)}
                    className="grid grid-cols-12 gap-2 px-5 py-3.5 cursor-pointer"
                    style={{
                      borderBottom: '1px solid #f0f9ff',
                      background: isUser ? 'rgba(125,211,252,0.06)' : 'transparent',
                      borderLeft: isUser ? '3px solid #7DD3FC' : '3px solid transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fbff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isUser ? 'rgba(125,211,252,0.06)' : 'transparent'; }}>

                    {/* Rank */}
                    <div className="col-span-1 flex items-center">
                      {s.rank === 1 ? <span style={{ fontSize: 18 }}>🥇</span>
                        : s.rank === 2 ? <span style={{ fontSize: 18 }}>🥈</span>
                        : s.rank === 3 ? <span style={{ fontSize: 18 }}>🥉</span>
                        : <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>#{s.rank}</span>}
                    </div>

                    {/* Student */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #bae6fd, #e0e7ff)', color: '#0284c7' }}>
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: isUser ? '#0284c7' : '#0f172a' }}>
                          {s.name} {isUser && <span style={{ fontSize: 11, color: '#7DD3FC', fontWeight: 700 }}>(You)</span>}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{s.college}</p>
                      </div>
                    </div>

                    {/* Stream */}
                    <div className="col-span-2 hidden sm:flex items-center">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(125,211,252,0.1)', color: '#0284c7', fontWeight: 600 }}>{s.stream}</span>
                    </div>

                    {/* Tier */}
                    <div className="col-span-2 hidden sm:flex items-center">
                      <span className="text-xs" style={{ color: '#64748b' }}>{s.tier || '—'}</span>
                    </div>

                    {/* Score */}
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm font-black" style={{ color: scoreColor }}>{s.overallScore}</span>
                    </div>

                    {/* Rounds */}
                    <div className="col-span-1 flex items-center">
                      <span className="text-xs font-semibold" style={{ color: '#64748b' }}>{s.roundsCompleted}/4</span>
                    </div>

                    {/* Trend */}
                    <div className="col-span-1 flex items-center">
                      {s.trend === 'up' ? <TrendingUp size={14} color="#22c55e" />
                        : s.trend === 'down' ? <TrendingDown size={14} color="#ef4444" />
                        : <Minus size={14} color="#94a3b8" />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── CTA for guests ── */}
        {!user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-6 text-center rounded-2xl p-8"
            style={{ background: 'linear-gradient(135deg, #0a1628, #0f2040)', border: '1px solid rgba(125,211,252,0.2)' }}>
            <Award size={32} style={{ color: '#7DD3FC', margin: '0 auto 12px' }} />
            <p className="font-bold text-lg mb-1" style={{ color: '#7DD3FC' }}>Want to appear on the leaderboard?</p>
            <p className="text-sm mb-5" style={{ color: '#e2e8f0' }}>Complete the AI assessment and earn your rank among India's best</p>
            <button onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
              className="px-7 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: '#7DD3FC', color: '#0a1628' }}>
              Start Assessment →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
