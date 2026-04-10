import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Edit2, Share2, Flame, GraduationCap, Calendar, CheckCircle, Lock, MapPin } from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const isOwn = !id || id === user?._id;

  useEffect(() => {
    const load = async () => {
      try {
        if (id && id !== user?._id) {
          const { data } = await axios.get(`/api/student/${id}`);
          setProfile(data);
        } else {
          const data = await refreshUser();
          setProfile(data || user);
        }
      } catch {
        setProfile(user);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/student/${user._id}/update`, editData);
      await refreshUser().then(d => setProfile(d));
      setEditMode(false);
    } catch {}
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const p = profile;
  if (!p) return null;

  const overallScore = p.scores?.overall || 0;
  const level = overallScore >= 90 ? 'Expert' : overallScore >= 75 ? 'Advanced' : overallScore >= 60 ? 'Intermediate' : overallScore > 0 ? 'Beginner' : 'Unranked';
  const levelColor = overallScore >= 90 ? 'success' : overallScore >= 75 ? 'primary' : overallScore >= 60 ? 'warning' : 'text-muted';
  const verificationCode = `CIQ-${p._id?.toString().slice(-8).toUpperCase()}`;

  const growthChartData = p.growthData?.map((g, i) => ({
    name: g.label || `R${g.round}`, score: g.score, attempt: i + 1
  })) || [];

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* AI Passport Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-dark-card via-dark-card to-primary/5 border border-primary/20 rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/3 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/3 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
                {p.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-white">{p.name}</h1>
                  {p.badges?.includes('eraAI Certified 🏆') && <span className="text-base">🏆</span>}
                </div>
                <p className="text-text-secondary text-sm flex items-center gap-1.5">
                  <GraduationCap size={13} /> {p.college || 'College not set'}
                  {p.tier && <span className="ml-2 text-xs bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">{p.tier}</span>}
                </p>
                {p.state && (
                  <p className="text-text-muted text-xs flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {p.state}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isOwn && (
                <button onClick={() => { setEditMode(!editMode); setEditData({ name: p.name, college: p.college, year: p.year, state: p.state }); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-dark-bg border border-dark-border text-text-secondary rounded-xl text-xs hover:text-white hover:border-primary/30 transition-all">
                  <Edit2 size={13} /> Edit
                </button>
              )}
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs hover:bg-primary/20 transition-all">
                <Share2 size={13} /> Share
              </button>
            </div>
          </div>

          {/* Edit form */}
          {editMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="bg-dark-bg border border-dark-border rounded-2xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-white mb-4">Edit Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'name', label: 'Full Name', type: 'text' },
                  { key: 'college', label: 'College', type: 'text' },
                  { key: 'year', label: 'Year', type: 'text' },
                  { key: 'state', label: 'State', type: 'text' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="text-xs text-text-muted mb-1 block">{label}</label>
                    <input type={type} value={editData[key] || ''} onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))}
                      className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold disabled:opacity-60 btn-glow transition-all">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-dark-card border border-dark-border text-text-secondary rounded-xl text-sm hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Stats grid */}
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Overall Score', value: `${overallScore}/100`, color: 'primary' },
              { label: 'Level', value: level, color: levelColor },
              { label: 'Rounds Done', value: `${p.roundsCompleted?.length || 0}/4`, color: 'success' },
              { label: 'Streak', value: `${p.streak || 0} days`, color: 'warning', icon: <Flame size={12} /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-dark-bg/60 rounded-xl p-4 text-center border border-dark-border">
                <p className={`text-xl font-black text-${color} flex items-center justify-center gap-1`}>
                  {icon}{value}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div className="relative">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { badge: 'AI Foundations 🏅', round: 1 },
                { badge: 'Dynamic Thinker 🧠', round: 2 },
                { badge: 'AI Whisperer 🎯', round: 3 },
                { badge: 'eraAI Certified 🏆', round: 4 },
              ].map(({ badge, round }) => {
                const earned = p.roundsCompleted?.includes(round);
                return (
                  <div key={badge}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-all ${
                      earned ? 'bg-success/10 border-success/20 text-white' : 'bg-dark-bg border-dark-border text-text-muted opacity-40'
                    }`}>
                    <span>{badge.split(' ').slice(-1)[0]}</span>
                    <span className="text-xs">{earned ? badge.split(' ').slice(0, -1).join(' ') : '???'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification */}
          <div className="relative mt-5 pt-5 border-t border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-success" />
              <p className="text-xs text-text-secondary">Verified Profile</p>
            </div>
            <p className="text-xs font-mono text-text-muted">{verificationCode}</p>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Calendar size={12} />
              Joined {new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </motion.div>

        {/* Growth Graph */}
        {growthChartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-6">
            <h3 className="text-base font-bold text-white mb-5">Performance History</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growthChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                <XAxis dataKey="name" tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="score" stroke="#00BCD4" strokeWidth={2.5} dot={{ fill: '#00BCD4', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Round Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(round => {
            const score = p.scores?.[`round${round}`] || 0;
            const completed = p.roundsCompleted?.includes(round);
            const roundNames = { 1: 'Foundation', 2: 'Adaptive', 3: 'Scenarios', 4: 'Interview' };
            const roundColors = { 1: 'primary', 2: 'secondary', 3: 'warning', 4: 'danger' };
            return (
              <div key={round} className={`p-4 bg-dark-card border rounded-xl ${completed ? `border-${roundColors[round]}/20` : 'border-dark-border opacity-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Round {round}: {roundNames[round]}</span>
                  {completed ? <CheckCircle size={14} className="text-success" /> : <Lock size={14} className="text-text-muted" />}
                </div>
                {completed ? (
                  <>
                    <div className="text-2xl font-black gradient-text mb-1">{score}<span className="text-sm text-text-muted">/100</span></div>
                    <div className="h-1 bg-dark-bg rounded-full overflow-hidden">
                      <div className={`h-full bg-${roundColors[round]} rounded-full`} style={{ width: `${score}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-text-muted">Not yet completed</p>
                )}
              </div>
            );
          })}
        </motion.div>

        {isOwn && (
          <div className="mt-6 flex justify-center">
            <button onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-sm btn-glow transition-all">
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
