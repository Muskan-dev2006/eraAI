import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Filter, Download, X, Eye, CheckCircle, Users, Trophy, TrendingUp } from 'lucide-react';

const LoginForm = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', designation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const url = mode === 'login' ? '/api/recruiter/login' : '/api/recruiter/register';
      const { data } = await axios.post(url, form);
      localStorage.setItem('eraai_recruiter', JSON.stringify(data));
      localStorage.setItem('eraai_recruiter_token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 pt-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🏢</div>
          <h2 className="text-2xl font-black text-white">{mode === 'login' ? 'Recruiter Login' : 'Join as Recruiter'}</h2>
          <p className="text-text-secondary text-sm mt-1">Access India's verified AI talent pool</p>
        </div>

        {error && <div className="mb-4 px-3 py-2 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50" required />
              <input type="text" placeholder="Company Name" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50" />
              <input type="text" placeholder="Designation" value={form.designation} onChange={e => setForm(f => ({...f, designation: e.target.value}))}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50" />
            </>
          )}
          <input type="email" placeholder="Work Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50" required />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50" required />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl font-semibold text-sm btn-glow-purple transition-all disabled:opacity-60">
            {loading ? 'Loading...' : mode === 'login' ? 'Access Dashboard' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-xs text-text-muted mt-4">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-primary hover:underline">{mode === 'login' ? 'Register' : 'Login'}</button>
        </p>
      </motion.div>
    </div>
  );
};

export default function Recruiter() {
  const [recruiter, setRecruiter] = useState(() => {
    const stored = localStorage.getItem('eraai_recruiter');
    const token = localStorage.getItem('eraai_recruiter_token');
    if (stored && token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return JSON.parse(stored);
    }
    return null;
  });

  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, certified: 0, tier2_3: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ stream: '', tier: '', minScore: '', badge: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.stream) params.stream = filters.stream;
      if (filters.tier) params.tier = filters.tier;
      if (filters.minScore) params.minScore = filters.minScore;
      if (filters.badge) params.badge = filters.badge;
      const { data } = await axios.get('/api/recruiter/students', { params });
      setStudents(data.students || []);
      setStats({ total: data.total, certified: data.certified, tier2_3: data.tier2_3 });
    } catch { setStudents([]); }
    setLoading(false);
  };

  useEffect(() => { if (recruiter) loadStudents(); }, [recruiter, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewStudent = async (id) => {
    try {
      const { data } = await axios.get(`/api/recruiter/student/${id}`);
      setSelectedStudent(data);
    } catch {}
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'College', 'Stream', 'Tier', 'Score', 'Rounds', 'Badges'];
    const rows = students.map(s => [s.name, s.email, s.college, s.stream, s.tier, s.scores?.overall, s.roundsCompleted?.length, s.badges?.join('; ')]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'eraai-candidates.csv'; a.click();
  };

  const handleLogout = () => {
    localStorage.removeItem('eraai_recruiter');
    localStorage.removeItem('eraai_recruiter_token');
    delete axios.defaults.headers.common['Authorization'];
    setRecruiter(null);
  };

  if (!recruiter) return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <LoginForm onLogin={setRecruiter} />
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Recruiter Dashboard</h1>
            <p className="text-text-secondary text-sm mt-0.5">
              Welcome, {recruiter.name} {recruiter.company && `| ${recruiter.company}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-dark-card border border-dark-border text-text-secondary rounded-xl text-xs hover:text-white transition-all">
              <Download size={13} /> Export CSV
            </button>
            <button onClick={handleLogout} className="px-3 py-2 text-xs text-danger border border-danger/20 rounded-xl hover:bg-danger/10 transition-all">
              Logout
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: <Users size={20} />, label: 'Verified Students', value: stats.total, color: 'primary' },
            { icon: <TrendingUp size={20} />, label: 'Tier 2/3 Talent', value: stats.tier2_3, color: 'secondary' },
            { icon: <Trophy size={20} />, label: 'eraAI Certified', value: stats.certified, color: 'success' },
          ].map(({ icon, label, value, color }) => (
            <motion.div key={label} whileHover={{ y: -2 }}
              className={`p-5 bg-dark-card border border-${color}/20 rounded-2xl flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-xl bg-${color}/10 border border-${color}/20 flex items-center justify-center text-${color}`}>
                {icon}
              </div>
              <div>
                <p className={`text-2xl font-black text-${color}`}>{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter size={14} className="text-text-muted" />
            <select value={filters.stream} onChange={e => setFilters(f => ({...f, stream: e.target.value}))}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50">
              <option value="">All Streams</option>
              {['DSA', 'AI/ML', 'Web Dev', 'CS Fundamentals'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.tier} onChange={e => setFilters(f => ({...f, tier: e.target.value}))}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50">
              <option value="">All Tiers</option>
              {['Tier 1', 'Tier 2', 'Tier 3'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="Min Score" value={filters.minScore} onChange={e => setFilters(f => ({...f, minScore: e.target.value}))} min="0" max="100"
              className="w-24 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50" />
            <select value={filters.badge} onChange={e => setFilters(f => ({...f, badge: e.target.value}))}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50">
              <option value="">Any Badge</option>
              <option value="Certified">eraAI Certified</option>
              <option value="Whisperer">AI Whisperer</option>
              <option value="Thinker">Dynamic Thinker</option>
            </select>
            {Object.values(filters).some(v => v) && (
              <button onClick={() => setFilters({ stream: '', tier: '', minScore: '', badge: '' })}
                className="flex items-center gap-1 text-xs text-danger hover:text-danger/80 transition-colors">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Student Cards */}
        {loading ? (
          <div className="text-center py-16 text-text-secondary">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading candidates...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s, i) => (
              <motion.div key={s._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className="bg-dark-card border border-dark-border rounded-2xl p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-sm font-black">
                      {s.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{s.name}</p>
                      <p className="text-xs text-text-muted">{s.college}</p>
                    </div>
                  </div>
                  <div className={`text-lg font-black ${s.scores?.overall >= 80 ? 'text-success' : s.scores?.overall >= 60 ? 'text-warning' : 'text-text-secondary'}`}>
                    {s.scores?.overall || 0}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.stream && <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{s.stream}</span>}
                  {s.tier && <span className="text-xs bg-dark-bg border border-dark-border text-text-muted px-2 py-0.5 rounded-full">{s.tier}</span>}
                  {s.year && <span className="text-xs text-text-muted">{s.year}</span>}
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted mb-4">
                  <span>Rounds: {s.roundsCompleted?.length || 0}/4</span>
                  <div className="flex gap-0.5">
                    {s.badges?.slice(0, 3).map((b, bi) => <span key={bi} className="text-base">{b.split(' ').slice(-1)[0]}</span>)}
                  </div>
                </div>

                <div className="h-1 bg-dark-bg rounded-full overflow-hidden mb-4">
                  <div className={`h-full rounded-full ${s.scores?.overall >= 70 ? 'bg-success' : 'bg-warning'}`}
                    style={{ width: `${s.scores?.overall || 0}%` }} />
                </div>

                <button onClick={() => handleViewStudent(s._id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-text-secondary border border-dark-border rounded-lg hover:text-white hover:border-primary/30 transition-all">
                  <Eye size={12} /> View AI Passport
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Student Detail Modal */}
        <AnimatePresence>
          {selectedStudent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
              onClick={() => setSelectedStudent(null)}
            >
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-white">AI Passport</h3>
                  <button onClick={() => setSelectedStudent(null)} className="p-1.5 text-text-muted hover:text-white rounded-lg transition-colors"><X size={16} /></button>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-black">
                    {selectedStudent.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{selectedStudent.name}</p>
                    <p className="text-sm text-text-secondary">{selectedStudent.college}</p>
                    <div className="flex gap-2 mt-1">
                      {selectedStudent.stream && <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">{selectedStudent.stream}</span>}
                      {selectedStudent.tier && <span className="text-xs text-text-muted border border-dark-border px-1.5 py-0.5 rounded">{selectedStudent.tier}</span>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Overall Score', value: `${selectedStudent.scores?.overall || 0}/100`, color: 'primary' },
                    { label: 'Rounds Done', value: `${selectedStudent.roundsCompleted?.length || 0}/4`, color: 'success' },
                    { label: 'Email', value: selectedStudent.email, color: 'text-white', small: true },
                    { label: 'State', value: selectedStudent.state || 'N/A', color: 'text-white', small: true },
                  ].map(({ label, value, color, small }) => (
                    <div key={label} className="bg-dark-bg rounded-xl p-3">
                      <p className="text-xs text-text-muted mb-0.5">{label}</p>
                      <p className={`${small ? 'text-xs' : 'text-lg font-black'} text-${color} truncate`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Badges</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.badges?.length > 0
                      ? selectedStudent.badges.map(b => (
                        <span key={b} className="flex items-center gap-1.5 text-xs bg-success/10 border border-success/20 text-white px-2 py-1 rounded-lg">
                          <CheckCircle size={10} className="text-success" /> {b}
                        </span>
                      ))
                      : <span className="text-xs text-text-muted">No badges yet</span>
                    }
                  </div>
                </div>

                <button onClick={() => setSelectedStudent(null)}
                  className="w-full py-2.5 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-sm font-semibold transition-all btn-glow-purple">
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
