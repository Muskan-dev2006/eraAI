import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Download, Share2, ArrowRight, CheckCircle, Star, TrendingUp } from 'lucide-react';

const AnimatedScore = ({ value }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = value / 80;
    const t = setInterval(() => {
      n += step;
      if (n >= value) { setCount(value); clearInterval(t); }
      else setCount(Math.round(n));
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <>{count}</>;
};

export default function Results() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [u, setU] = useState(user);
  const certRef = useRef(null);

  useEffect(() => {
    refreshUser().then(data => { if (data) setU(data); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!u) return null;

  const radarData = [
    { subject: 'Foundation', score: u.scores?.round1 || 0, full: 100 },
    { subject: 'Adaptive', score: u.scores?.round2 || 0, full: 100 },
    { subject: 'Scenarios', score: u.scores?.round3 || 0, full: 100 },
    { subject: 'Interview', score: u.scores?.round4 || 0, full: 100 },
  ];

  const growthData = u.growthData?.map((g, i) => ({
    name: g.label || `R${g.round}`,
    score: g.score
  })) || [];

  const overallScore = u.scores?.overall || 0;
  const certified = u.roundsCompleted?.includes(4) && (u.scores?.round4 || 0) >= 70;
  const verificationCode = `CIQ-${u._id?.toString().slice(-8).toUpperCase()}`;

  const nextSteps = [
    overallScore < 60 && 'Focus on AI fundamentals - retake Round 1 with more preparation',
    overallScore >= 60 && overallScore < 75 && 'Good foundation! Work on practical AI application skills',
    overallScore >= 75 && !certified && 'Strong performance! Complete all rounds for full certification',
    certified && 'Share your AI Passport with recruiters and LinkedIn connections',
    certified && 'Explore advanced AI/ML courses to deepen your expertise',
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          {certified ? (
            <div className="text-6xl mb-3">🏆</div>
          ) : (
            <div className="text-6xl mb-3">📊</div>
          )}
          <h1 className="text-3xl font-black text-white mb-2">
            {certified ? 'eraAI Certified!' : 'Your Results'}
          </h1>
          <p className="text-text-secondary">{u.name} | {u.stream} | {u.college}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Score */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="bg-dark-card border border-primary/20 rounded-2xl p-8 text-center score-reveal">
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">Overall Score</p>
            <div className={`text-7xl font-black mb-2 ${overallScore >= 70 ? 'text-success' : overallScore >= 50 ? 'text-warning' : 'text-danger'}`}>
              <AnimatedScore value={overallScore} />
            </div>
            <p className="text-text-muted text-sm">/100</p>
            <div className="mt-4 h-2 bg-dark-bg rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${overallScore}%` }} transition={{ delay: 0.5, duration: 1 }}
                className={`h-full rounded-full ${overallScore >= 70 ? 'bg-success' : overallScore >= 50 ? 'bg-warning' : 'bg-danger'}`} />
            </div>
          </motion.div>

          {/* Round Scores */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Round Scores</h3>
            <div className="space-y-3">
              {[
                { label: 'Round 1: Foundation', key: 'round1', pass: 60, color: 'primary' },
                { label: 'Round 2: Adaptive', key: 'round2', pass: 65, color: 'secondary' },
                { label: 'Round 3: Scenarios', key: 'round3', pass: 60, color: 'warning' },
                { label: 'Round 4: Interview', key: 'round4', pass: 70, color: 'danger' },
              ].map(({ label, key, pass, color }) => {
                const score = u.scores?.[key] || 0;
                const done = u.roundsCompleted?.includes(parseInt(key.replace('round', '')));
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-secondary">{label}</span>
                      <span className={`font-bold ${done ? (score >= pass ? 'text-success' : 'text-warning') : 'text-text-muted'}`}>
                        {done ? `${score}/100` : 'Not taken'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: done ? `${score}%` : '0%' }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className={`h-full rounded-full bg-${color}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Badges Earned</h3>
            <div className="space-y-2">
              {[
                { badge: 'AI Foundations 🏅', round: 1 },
                { badge: 'Dynamic Thinker 🧠', round: 2 },
                { badge: 'AI Whisperer 🎯', round: 3 },
                { badge: 'eraAI Certified 🏆', round: 4 },
              ].map(({ badge, round }) => {
                const earned = u.roundsCompleted?.includes(round);
                return (
                  <div key={badge}
                    className={`flex items-center gap-3 p-2.5 rounded-xl ${earned ? 'bg-success/5 border border-success/10' : 'opacity-25'}`}>
                    <span className="text-lg">{badge.split(' ').slice(-1)[0]}</span>
                    <span className={`text-xs font-medium ${earned ? 'text-white' : 'text-text-muted'}`}>
                      {earned ? badge.split(' ').slice(0, -1).join(' ') : '???'}
                    </span>
                    {earned && <CheckCircle size={12} className="text-success ml-auto" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Radar Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Skills Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#21262D" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E', fontSize: 11 }} />
                <Radar name="Score" dataKey="score" stroke="#00BCD4" fill="#00BCD4" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Growth Line */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Score Journey</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={growthData.length > 0 ? growthData : [{ name: 'Start', score: 0 }]}
                margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                <XAxis dataKey="name" tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="score" stroke="#00BCD4" strokeWidth={2.5} dot={{ fill: '#00BCD4', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Certificate */}
        {certified && (
          <motion.div ref={certRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-primary/30 rounded-3xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />
            <div className="relative text-center">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-xs text-primary uppercase tracking-widest font-semibold mb-2">Certificate of Achievement</p>
              <h2 className="text-3xl font-black text-white mb-1">{u.name}</h2>
              <p className="text-text-secondary mb-4">has successfully completed all 4 rounds of the eraAI AI Proficiency Assessment</p>

              <div className="inline-flex items-center gap-6 py-4 px-8 bg-dark-bg rounded-2xl border border-dark-border mb-6">
                <div className="text-center">
                  <p className="text-2xl font-black gradient-text">{overallScore}</p>
                  <p className="text-xs text-text-muted">Overall Score</p>
                </div>
                <div className="w-px h-10 bg-dark-border" />
                <div className="text-center">
                  <p className="text-base font-bold text-white">{u.stream}</p>
                  <p className="text-xs text-text-muted">Stream</p>
                </div>
                <div className="w-px h-10 bg-dark-border" />
                <div className="text-center">
                  <p className="text-base font-bold text-white">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-text-muted">Date</p>
                </div>
              </div>

              <p className="text-xs text-text-muted mb-6">Verification Code: <span className="text-primary font-mono">{verificationCode}</span></p>

              <div className="flex gap-3 justify-center">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-dark-bg border border-dark-border text-white rounded-xl text-sm font-medium hover:bg-dark-hover transition-all">
                  <Download size={15} /> Download PDF
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold btn-glow transition-all">
                  <Share2 size={15} /> Share AI Passport
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-primary" />
            <h3 className="text-base font-bold text-white">Your Next Steps</h3>
          </div>
          <div className="space-y-2">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <Star size={14} className="text-warning mt-0.5 flex-shrink-0" /> {step}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 bg-dark-card border border-dark-border text-white rounded-xl text-sm font-semibold hover:bg-dark-hover transition-all text-center">
            &larr; Back to Dashboard
          </button>
          <button onClick={() => navigate('/leaderboard')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold btn-glow transition-all">
            View Leaderboard <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
