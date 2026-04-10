import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Trophy, Lock, CheckCircle, ArrowRight, Flame, Star, TrendingUp, BarChart2, Zap, ChevronRight, Mail, Users, MessageCircle, Award } from 'lucide-react';
import axios from 'axios';

const ROUND_CONFIG = [
  { round: 1, title: 'Foundation Check', desc: '15 MCQs | 20 min | Pass: 9/15', color: 'primary', icon: <Zap size={20} />, pass: 60 },
  { round: 2, title: 'Dynamic Adaptive Test', desc: '30 questions | 45 min | Pass: 65%', color: 'secondary', icon: <BarChart2 size={20} />, pass: 65 },
  { round: 3, title: 'Real Scenario Challenge', desc: '2 scenarios | AI evaluated | Pass: 60%', color: 'warning', icon: <Star size={20} />, pass: 60 },
];

const MENTOR_QUESTIONS = {
  'DSA': [
    'Walk me through a DSA project or problem you\'re most proud of solving.',
    'Which data structure or algorithm do you find most challenging and why?',
    'Have you done competitive programming? What\'s your current level?',
    'What kind of role are you targeting — product, service, or startup?',
    'Where do you feel you need the most improvement right now?',
  ],
  'AI/ML': [
    'Tell me about an ML project you\'ve built or are currently working on.',
    'What area of AI/ML interests you most — NLP, CV, or something else?',
    'Have you deployed a model to production? What challenges did you face?',
    'What frameworks are you comfortable with (TensorFlow, PyTorch, sklearn)?',
    'Where do you want to be in this field — researcher, engineer, or product?',
  ],
  'Web Dev': [
    'Walk me through a web project you\'ve built from scratch.',
    'What\'s your current stack and what are you trying to learn next?',
    'Have you faced performance issues in a project? How did you handle them?',
    'Do you prefer frontend, backend, or fullstack — and why?',
    'What\'s one technical problem you\'re currently stuck on?',
  ],
  'CS Fundamentals': [
    'Which CS subject — OS, DBMS, Networks, or CN — do you find hardest?',
    'Have you applied CS fundamentals in a real project? Walk me through it.',
    'How comfortable are you with SQL and database design?',
    'What kind of companies or roles are you targeting after graduation?',
    'What specific concept do you want to strengthen in this session?',
  ],
  'General': [
    'Tell me a little about your background and what you\'re currently working on.',
    'What\'s the biggest technical challenge you\'re facing right now?',
    'What do you want to get out of this mentorship session?',
    'Where do you see yourself in the next 1-2 years?',
    'Is there a specific skill gap you want to close?',
  ],
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-text-secondary mb-1">{label}</p>
        <p className="text-sm font-bold text-primary">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await refreshUser();
        setStats(data);
      } catch {
        setStats(user);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const u = stats || user;
  if (!u) return null;

  const growthChartData = u.growthData?.length > 0
    ? u.growthData.map((g, i) => ({ name: g.label || `R${g.round}`, score: g.score, attempt: i + 1 }))
    : [{ name: 'Start', score: 0, attempt: 1 }];

  const getAvg = () => {
    if (!u.growthData?.length) return 0;
    return Math.round(u.growthData.reduce((a, b) => a + b.score, 0) / u.growthData.length);
  };

  const avgData = growthChartData.map(d => ({ ...d, avg: getAvg() }));

  const roundStatus = (round) => {
    if (u.roundsCompleted?.includes(round)) return 'completed';
    if (u.roundsUnlocked?.includes(round)) return 'unlocked';
    return 'locked';
  };

  const scoreForRound = (round) => u.scores?.[`round${round}`] || 0;

  if (loading) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white">Hello, <span className="gradient-text">{u.name?.split(' ')[0]}!</span> 👋</h1>
              <p className="text-text-secondary mt-1 text-sm">
                Stream: <span className="text-primary font-medium">{u.stream || 'Not set'}</span>
                {u.tier && <> &middot; <span className="text-secondary font-medium">{u.tier}</span></>}
                {u.college && <> &middot; {u.college}</>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {u.streak > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/20 rounded-xl">
                  <Flame size={18} className="text-warning" />
                  <span className="text-sm font-bold text-warning">Day {u.streak} Streak</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                <Trophy size={16} className="text-primary" />
                <span className="text-sm font-bold text-primary">{u.scores?.overall || 0}/100</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Rounds */}
          <div className="lg:col-span-2 space-y-6">
            {/* Round Cards */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Assessment Rounds</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ROUND_CONFIG.map(({ round, title, desc, color, icon, pass }, i) => {
                  const status = roundStatus(round);
                  const score = scoreForRound(round);
                  return (
                    <motion.div key={round}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      whileHover={status !== 'locked' ? { y: -4, scale: 1.01 } : {}}
                      className={`relative p-5 bg-dark-card rounded-2xl border overflow-hidden transition-all duration-200 ${
                        status === 'locked' ? 'border-dark-border opacity-60' :
                        status === 'completed' ? `border-${color}/30 bg-${color}/5` :
                        `border-${color}/40 cursor-pointer hover:border-${color}/60`
                      }`}
                      onClick={() => status === 'unlocked' && navigate(`/assessment/${round}`)}
                    >
                      <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        status === 'completed' ? 'bg-success/20 text-success' :
                        status === 'locked' ? 'bg-dark-border text-text-muted' :
                        `bg-${color}/20 text-${color}`
                      }`}>
                        {status === 'completed' ? <><CheckCircle size={10} /> Done</> :
                         status === 'locked' ? <><Lock size={10} /> Locked</> :
                         <><Zap size={10} /> Ready</>}
                      </div>

                      <div className={`w-10 h-10 rounded-xl bg-${color}/10 border border-${color}/20 flex items-center justify-center text-${color} mb-3`}>
                        {status === 'locked' ? <Lock size={20} className="text-text-muted" /> : icon}
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1">Round {round}: {title}</h3>
                      <p className="text-xs text-text-secondary mb-3">{desc}</p>

                      {status === 'completed' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-text-muted">Your Score</span>
                            <span className={`font-bold ${score >= pass ? 'text-success' : 'text-danger'}`}>{score}/100</span>
                          </div>
                          <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: 0.5, duration: 0.8 }}
                              className={`h-full rounded-full ${score >= pass ? 'bg-success' : 'bg-danger'}`} />
                          </div>
                        </div>
                      )}

                      {status === 'unlocked' && (
                        <button className={`flex items-center gap-1.5 text-xs font-semibold text-${color} hover:gap-2.5 transition-all`}>
                          Start Round <ChevronRight size={13} />
                        </button>
                      )}

                      {status === 'completed' && (
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/assessment/${round}`); }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-white transition-colors">
                          Retake <ChevronRight size={13} />
                        </button>
                      )}
                    </motion.div>
                  );
                })}

                {/* Mentor Session Card — replaces Round 4 */}
                {(() => {
                  const r3done = u.roundsCompleted?.includes(3);
                  const certified = u.roundsCompleted?.includes(4); // 4 = mentor session done
                  const r3unlocked = u.roundsUnlocked?.includes(3) || r3done;
                  const questions = MENTOR_QUESTIONS[u.stream] || MENTOR_QUESTIONS['General'];

                  const handleMarkComplete = async () => {
                    setMarking(true);
                    try {
                      const token = localStorage.getItem('eraai_token');
                      await axios.post('/api/assessment/mentor-session/complete', {}, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      await refreshUser();
                    } catch (e) {
                      console.error(e);
                    }
                    setMarking(false);
                  };

                  if (certified) return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="relative p-5 bg-dark-card rounded-2xl border border-success/30 bg-success/5 overflow-hidden">
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
                        <Award size={10} /> Certified
                      </div>
                      <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-success/10 border border-success/20 text-success">
                        <Trophy size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">eraAI Certified! 🏆</h3>
                      <p className="text-xs text-text-secondary mb-3">You've completed all rounds and your mentor session. Congratulations!</p>
                      <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-xl">
                        <span className="text-lg">🏆</span>
                        <div>
                          <p className="text-xs font-bold text-success">eraAI Certified</p>
                          <p className="text-xs text-text-muted">Badge earned</p>
                        </div>
                      </div>
                    </motion.div>
                  );

                  return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className={`relative p-5 bg-dark-card rounded-2xl border overflow-hidden transition-all duration-200 ${
                        !r3unlocked ? 'border-dark-border opacity-60' :
                        r3done ? 'border-warning/30 bg-warning/5' :
                        'border-dark-border'
                      }`}>

                      <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        r3done ? 'bg-warning/20 text-warning' : 'bg-dark-border text-text-muted'
                      }`}>
                        {r3done ? <><Mail size={10} /> Email Sent</> : <><Lock size={10} /> Locked</>}
                      </div>

                      <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                        r3done ? 'bg-warning/10 border border-warning/20 text-warning' : 'bg-dark-border/30 border border-dark-border'
                      }`}>
                        {r3done ? <Users size={20} /> : <Lock size={20} className="text-text-muted" />}
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1">Mentor Interview Session</h3>

                      {!r3done ? (
                        <p className="text-xs text-text-secondary">Clear Round 3 to unlock your 1-on-1 mentor session.</p>
                      ) : (
                        <>
                          <p className="text-xs text-text-secondary mb-3">
                            Your session is scheduled. Check your email for meeting link &amp; timings.
                          </p>
                          <p className="text-xs font-semibold text-warning mb-2 flex items-center gap-1">
                            <MessageCircle size={11} /> Questions your mentor may ask:
                          </p>
                          <ul className="space-y-1.5 mb-4">
                            {questions.map((q, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                                <span className="text-warning mt-0.5 shrink-0">›</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                          <button onClick={handleMarkComplete} disabled={marking}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-warning to-success text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all">
                            {marking ? 'Updating...' : <><CheckCircle size={12} /> I attended my session</>}
                          </button>
                        </>
                      )}
                    </motion.div>
                  );
                })()}
              </div>
            </div>

            {/* Growth Graph */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Performance Growth</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Your score progression across rounds</p>
                </div>
                <TrendingUp size={18} className="text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={avgData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="name" tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="#7C3AED" strokeDasharray="4 4" opacity={0.4} />
                  <Line type="monotone" dataKey="score" stroke="#00BCD4" strokeWidth={2.5} dot={{ fill: '#00BCD4', r: 4 }} activeDot={{ r: 6, fill: '#00BCD4' }} />
                  <Line type="monotone" dataKey="avg" stroke="#7C3AED" strokeWidth={1.5} strokeDasharray="5 5" dot={false} opacity={0.6} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-primary" /><span className="text-xs text-text-muted">Your score</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-secondary opacity-60" style={{borderTop: '1.5px dashed'}} /><span className="text-xs text-text-muted">Average</span></div>
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Quick Stats */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-dark-card border border-dark-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Overall', value: `${u.scores?.overall || 0}%`, color: 'primary' },
                  { label: 'Rounds Done', value: `${u.roundsCompleted?.length || 0}/3`, color: 'success' },
                  { label: 'Best Round', value: `${Math.max(...Object.values(u.scores || {}).filter(v => typeof v === 'number'))}%`, color: 'warning' },
                  { label: 'Badges', value: u.badges?.length || 0, color: 'secondary' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-dark-bg rounded-xl p-3 text-center">
                    <p className={`text-xl font-black text-${color}`}>{value}</p>
                    <p className="text-xs text-text-muted mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Badges */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="bg-dark-card border border-dark-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Badges Earned</h3>
              <div className="space-y-2">
                {[
                  { badge: 'AI Foundations 🏅', round: 1, locked: !u.roundsCompleted?.includes(1) },
                  { badge: 'Dynamic Thinker 🧠', round: 2, locked: !u.roundsCompleted?.includes(2) },
                  { badge: 'AI Whisperer 🎯', round: 3, locked: !u.roundsCompleted?.includes(3) },
                  { badge: 'eraAI Certified 🏆', round: 'Session', locked: !u.roundsCompleted?.includes(4) },
                ].map(({ badge, round, locked }) => (
                  <div key={badge} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${locked ? 'opacity-30' : 'bg-primary/5 border border-primary/10'}`}>
                    <span className="text-lg">{locked ? '🔒' : badge.split(' ').slice(-1)[0]}</span>
                    <div>
                      <p className="text-xs font-medium text-white">{locked ? '???' : badge.split(' ').slice(0, -1).join(' ')}</p>
                      <p className="text-xs text-text-muted">Round {round}</p>
                    </div>
                    {!locked && <CheckCircle size={14} className="text-success ml-auto" />}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Next Action */}
            {!u.roundsCompleted?.includes(3) && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-2">Next Up</h3>
                {(() => {
                  const nextRound = [1, 2, 3].find(r => !u.roundsCompleted?.includes(r) && u.roundsUnlocked?.includes(r));
                  if (!nextRound) return <p className="text-xs text-text-secondary">Keep going!</p>;
                  const config = ROUND_CONFIG.find(c => c.round === nextRound);
                  return (
                    <>
                      <p className="text-xs text-text-secondary mb-3">Round {nextRound}: {config.title}</p>
                      <button onClick={() => navigate(`/assessment/${nextRound}`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold btn-glow transition-all">
                        Start Round {nextRound} <ArrowRight size={14} />
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {u.roundsCompleted?.includes(3) && !u.roundsCompleted?.includes(4) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-warning/10 to-success/10 border border-warning/20 rounded-2xl p-5 text-center">
                <div className="text-4xl mb-2">🤝</div>
                <p className="text-sm font-bold text-white mb-1">Mentor Session Unlocked!</p>
                <p className="text-xs text-text-secondary">Check your email for your meeting link and timings.</p>
              </motion.div>
            )}

            {u.roundsCompleted?.includes(4) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-success/10 to-primary/10 border border-success/20 rounded-2xl p-5 text-center">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-sm font-bold text-white mb-1">eraAI Certified!</p>
                <p className="text-xs text-text-secondary">You've completed all rounds and your mentor session.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
