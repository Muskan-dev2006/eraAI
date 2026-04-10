import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import AuthModal from '../components/AuthModal';
import {
  ArrowRight, Play, CheckCircle, Zap, Brain, Target, Shield,
  Users, Award,
  Globe, Code2, Cpu, Twitter, Linkedin,
  Github, Heart, TrendingUp, MessageSquare, Layers
} from 'lucide-react';

// ─── Particle Canvas ────────────────────────────────────────────────────────
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '#00BCD4' : '#7C3AED'
    }));

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      // Connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 188, 212, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, []);
  return <canvas ref={canvasRef} id="particle-canvas" />;
};

// ─── Typewriter ──────────────────────────────────────────────────────────────
const Typewriter = ({ texts, speed = 70 }) => {
  const [displayed, setDisplayed] = useState('');
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[textIdx];
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => { setDisplayed(current.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }, speed);
      return () => clearTimeout(t);
    } else if (!deleting && charIdx === current.length) {
      if (texts.length === 1) return;
      const t = setTimeout(() => setDeleting(true), 2000);
      return () => clearTimeout(t);
    } else if (deleting && charIdx > 0) {
      const t = setTimeout(() => { setDisplayed(current.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }, 35);
      return () => clearTimeout(t);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setTextIdx(i => (i + 1) % texts.length);
    }
  }, [charIdx, deleting, textIdx, texts, speed]);

  return (
    <span className="typewriter-cursor">{displayed}</span>
  );
};

// ─── Counter ─────────────────────────────────────────────────────────────────
const AnimatedCounter = ({ end, suffix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ─── Floating Cards ───────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const FloatingCard = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
    style={{ animation: `float-card ${3 + delay}s ease-in-out infinite` }}
    className={`glass border border-white/5 rounded-xl px-4 py-3 shadow-xl backdrop-blur-xl ${className}`}
  >
    {children}
  </motion.div>
);

// ─── Section Wrapper ─────────────────────────────────────────────────────────
const Section = ({ children, className = '', style = {} }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={className}
      style={style}
    >
      {children}
    </motion.section>
  );
};

// ─── Main Home Component ─────────────────────────────────────────────────────
export default function Home() {
  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const navigate = useNavigate(); // eslint-disable-line no-unused-vars
  const { user } = useAuth(); // eslint-disable-line no-unused-vars


  // Global event so Navbar / other components can open the auth modal
  useEffect(() => {
    const openLogin = () => { setAuthTab('login'); setAuthModal(true); };
    const openSignup = () => { setAuthTab('signup'); setAuthModal(true); };
    window.addEventListener('openAuthModal', openLogin);
    window.addEventListener('openSignupModal', openSignup);
    return () => {
      window.removeEventListener('openAuthModal', openLogin);
      window.removeEventListener('openSignupModal', openSignup);
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-x-hidden">
      <Navbar transparent />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Hero background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1660385938160-b0dd49ef09d9?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          {/* Dark overlay to keep text readable */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,10,0.55) 100%)' }} />
        </div>

        <ParticleCanvas />

        {/* Radial glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ color: '#ffffff' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-medium mb-8">
              <Zap size={14} className="animate-pulse" />
              India's First Adaptive AI Proficiency Platform
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-white">
              <span style={{ color: '#7DD3FC' }}>
                <Typewriter texts={['Prove Your AI Skills.', 'Stand Out. Get Hired.', 'Master AI. Now.']} speed={60} />
              </span>
              <br />
              <span style={{ color: '#ffffff', fontSize: '0.65em', fontWeight: 800, letterSpacing: '0.01em' }}>Redefining The Era Of AI In Modern World.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ color: '#ffffff' }}
              className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16 mt-20">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
                style={{ backgroundColor: '#7DD3FC', color: '#0a0a1a' }}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all duration-200">
                Start Assessment <ArrowRight size={18} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setAuthTab('login'); setAuthModal(true); }}
                style={{ border: '2px solid #7DD3FC', color: '#7DD3FC' }}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent rounded-xl text-base font-semibold transition-all duration-200">
                <Play size={16} /> Login to Dashboard
              </motion.button>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <Section className="py-24 px-8 sm:px-16 lg:px-28 w-full">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#0ea5e9' }}>Simple Process</p>
          <h2 className="text-4xl font-black mb-4" style={{ color: '#0c4a6e' }}>How eraAI Works</h2>
          <p className="max-w-xl mx-auto" style={{ color: '#475569' }}>From zero to certified in four steps. No fluff. No shortcuts. Real results.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 w-full">
          {[
            { icon: <MessageSquare size={26} />, step: '01', title: 'Smart Chatbot Onboard', desc: 'Aria guides you through signup in under 2 minutes. No boring forms.' },
            { icon: <Layers size={26} />, step: '02', title: '3 Rounds of Assessment', desc: 'Foundation to Adaptive to Scenarios. Progressive difficulty.' },
            { icon: <Brain size={26} />, step: '03', title: 'Honest AI Evaluation', desc: 'Groq AI evaluates your work. No sugarcoating. Real professional feedback.' },
            { icon: <Award size={26} />, step: '04', title: 'Mentor + Get Certified', desc: 'Earn verified badge. 1-on-1 mentor session. Get noticed by real recruiters.' },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group relative text-center p-8 py-12 bg-white cursor-pointer transition-all duration-300"
              style={{
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                boxShadow: '0 2px 12px rgba(14,165,233,0.08)',
                borderRadius: '16px',
              }}
              whileHover={{
                backgroundImage: 'linear-gradient(#f0f9ff, #e0f2fe), linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9)',
                boxShadow: '0 12px 40px rgba(14,165,233,0.18)',
                y: -6,
                transition: { duration: 0.2 }
              }}
            >
              {/* Step number pill */}
              <div className="absolute top-5 left-6 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#e0f2fe', color: '#0369a1', letterSpacing: '0.05em' }}>
                {item.step}
              </div>

              {/* Icon with glow on hover */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', color: '#0369a1',
                  boxShadow: '0 4px 14px rgba(14,165,233,0.12)' }}>
                {item.icon}
              </div>

              <h3 className="text-base font-bold mb-3 transition-colors duration-300" style={{ color: '#0c4a6e' }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{item.desc}</p>

              {/* Bottom accent bar — slides in on hover */}
              <div className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{ background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)' }} />

              {/* Top left corner accent */}
              <div className="absolute top-0 left-0 w-8 h-8 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #7dd3fc33, transparent)' }} />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── 4 ROUNDS FLOWCHART ───────────────────────────────────────────── */}
      <Section className="py-16 bg-dark-card/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#7DD3FC' }}>Assessment Structure</p>
            <h2 className="text-4xl font-black text-white mb-3">4 Rounds. No Easy Path.</h2>
            <p className="text-text-secondary max-w-xl mx-auto">Each round unlocks only after you pass the previous one. This isn't a quiz — it's a real proficiency test.</p>
          </div>

          {/* Clockwise: R1(top-left) →  R2(top-right) ↓ R3(bottom-right) ← R4(bottom-left) */}
          {/* 3-col grid: [left-card] [center-arrow] [right-card] */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 1fr', gridTemplateRows: 'auto 64px auto' }}>

            {/* ── Row 1: cards ── */}
            {/* R1 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
              className="rounded-2xl p-5 cursor-default"
              style={{ background: '#fff', borderTop: '3px solid #7DD3FC', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', transition: 'transform 0.22s, box-shadow 0.22s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-7px) scale(1.025)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(125,211,252,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: 'rgba(125,211,252,0.15)', color: '#0284c7', border: '1px solid rgba(125,211,252,0.4)' }}>Round 1 · Foundation</span>
              <h3 className="text-base font-bold mb-3" style={{ color: '#0f172a' }}>Foundation Check</h3>
              <ul className="space-y-1.5">
                {['15 core AI concept MCQs', 'Covers your stream specifically', '20 minutes · 9/15 to pass'].map((p, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}><CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#7DD3FC' }} />{p}</li>
                ))}
              </ul>
            </motion.div>

            {/* H-Arrow R1→R2 — center column, row 1, vertically centered */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gridRow: 1, gridColumn: 2 }}>
              <span className="text-xs font-semibold mb-1" style={{ color: '#7DD3FC' }}>Pass</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 30, height: 2, background: 'linear-gradient(to right, #7DD3FC, #38bdf8)' }} />
                <svg width="8" height="12" viewBox="0 0 8 12"><path d="M0 0l8 6-8 6V0z" fill="#38bdf8" /></svg>
              </div>
            </motion.div>

            {/* R2 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.4 }}
              className="rounded-2xl p-5 cursor-default"
              style={{ background: '#fff', borderTop: '3px solid #38bdf8', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', transition: 'transform 0.22s, box-shadow 0.22s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-7px) scale(1.025)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(56,189,248,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: 'rgba(56,189,248,0.15)', color: '#0284c7', border: '1px solid rgba(56,189,248,0.4)' }}>Round 2 · Adaptive</span>
              <h3 className="text-base font-bold mb-3" style={{ color: '#0f172a' }}>Dynamic Adaptive Test</h3>
              <ul className="space-y-1.5">
                {['30 questions — gets harder as you improve', 'Real-time difficulty adjustment', '45 minutes · Score 65+ to pass'].map((p, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}><CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#38bdf8' }} />{p}</li>
                ))}
              </ul>
            </motion.div>

            {/* ── Row 2: connector row ── */}
            {/* col1: empty */}
            <div style={{ gridRow: 2, gridColumn: 1 }} />
            {/* col2: empty */}
            <div style={{ gridRow: 2, gridColumn: 2 }} />
            {/* col3: V-arrow R2→R3, centered on right card */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              style={{ gridRow: 2, gridColumn: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 2, height: 22, background: 'linear-gradient(to bottom, #38bdf8, #60a5fa)' }} />
              <span className="text-xs font-semibold my-1" style={{ color: '#60a5fa' }}>Pass</span>
              <svg width="12" height="7" viewBox="0 0 12 7"><path d="M6 7L0 0h12z" fill="#60a5fa" /></svg>
            </motion.div>

            {/* ── Row 3: cards (R4 left, R3 right for clockwise) ── */}
            {/* R4 — bottom-left */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.35, duration: 0.4 }}
              className="rounded-2xl p-5 cursor-default"
              style={{ background: '#fff', borderTop: '3px solid #818cf8', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', transition: 'transform 0.22s, box-shadow 0.22s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-7px) scale(1.025)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(129,140,248,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: 'rgba(129,140,248,0.15)', color: '#4f46e5', border: '1px solid rgba(129,140,248,0.4)' }}>Round 4 · Mentor Session</span>
              <h3 className="text-base font-bold mb-3" style={{ color: '#0f172a' }}>Mentor Interview Session</h3>
              <ul className="space-y-1.5">
                {['Clear Round 3 → unlock 1-on-1 mentor session', 'Mentor matched to your stream & score', 'Meeting link + details sent to your email', 'Attend session → earn eraAI Certified 🏆'].map((p, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}><CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#818cf8' }} />{p}</li>
                ))}
              </ul>
            </motion.div>

            {/* H-Arrow R3→R4 (pointing left) — center column, row 3 */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.45 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gridRow: 3, gridColumn: 2 }}>
              <span className="text-xs font-semibold mb-1" style={{ color: '#818cf8' }}>Unlock</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="8" height="12" viewBox="0 0 8 12"><path d="M8 0L0 6l8 6V0z" fill="#818cf8" /></svg>
                <div style={{ width: 30, height: 2, background: 'linear-gradient(to left, #60a5fa, #818cf8)' }} />
              </div>
            </motion.div>

            {/* R3 — bottom-right */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25, duration: 0.4 }}
              className="rounded-2xl p-5 cursor-default"
              style={{ background: '#fff', borderTop: '3px solid #60a5fa', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', transition: 'transform 0.22s, box-shadow 0.22s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-7px) scale(1.025)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(96,165,250,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; }}>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: 'rgba(96,165,250,0.15)', color: '#2563eb', border: '1px solid rgba(96,165,250,0.4)' }}>Round 3 · Real-World</span>
              <h3 className="text-base font-bold mb-3" style={{ color: '#0f172a' }}>Real Scenario Challenge</h3>
              <ul className="space-y-1.5">
                {['5 professional work scenarios', 'Write your AI prompt + reasoning', 'Groq AI evaluates · Score 60+ to advance'].map((p, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs" style={{ color: '#475569' }}><CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />{p}</li>
                ))}
              </ul>
            </motion.div>

          </div>

        </div>
      </Section>

      {/* ── STREAMS ──────────────────────────────────────────────────────── */}
      <Section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Pick Your Track</p>
          <h2 className="text-4xl font-black text-white mb-4">4 Streams Available</h2>
          <p className="text-text-secondary max-w-xl mx-auto">Questions are tailored to your stream. DSA students get DSA questions. AI students get AI questions. Always relevant.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <Code2 size={32} />, stream: 'DSA', name: 'Data Structures & Algorithms', desc: 'Arrays, Trees, DP, Graphs, Sorting — the interview essentials', color: 'from-blue-500/20 to-primary/20', border: 'border-primary/30', students: '12,400+' },
            { icon: <Brain size={32} />, stream: 'AI/ML', name: 'Artificial Intelligence & ML', desc: 'Neural networks, NLP, CV, transformers, real AI applications', color: 'from-secondary/20 to-purple-400/20', border: 'border-secondary/30', students: '9,800+' },
            { icon: <Globe size={32} />, stream: 'Web Dev', name: 'Web Development', desc: 'React, Node, APIs, performance, security, architecture', color: 'from-success/20 to-teal-400/20', border: 'border-success/30', students: '8,200+' },
            { icon: <Cpu size={32} />, stream: 'CS Fundamentals', name: 'CS Fundamentals', desc: 'OS, Networks, DBMS, ACID, TCP — core CS concepts', color: 'from-warning/20 to-orange-400/20', border: 'border-warning/30', students: '7,600+' },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
              className={`p-6 bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl cursor-pointer card-hover group`}
            >
              <div className="text-white mb-4 group-hover:scale-110 transition-transform duration-200">{item.icon}</div>
              <h3 className="text-base font-bold text-white mb-2">{item.name}</h3>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">{item.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{item.students} assessed</span>
                <ArrowRight size={14} className="text-text-muted group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── WHY ERAAI — infinite marquee ─────────────────────────────── */}
      <Section className="py-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e8f4fd 50%, #eff6ff 100%)' }}>
        <style>{`
          @keyframes ciq-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .ciq-track { animation: ciq-scroll 30s linear infinite; display: flex; width: max-content; }
          .ciq-track:hover { animation-play-state: paused; }
        `}</style>

        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#7DD3FC' }}>Why Different</p>
          <h2 className="text-4xl font-black text-white mb-3">Built for Every Indian Student</h2>
          <p className="text-text-secondary max-w-xl mx-auto">6 pillars that make eraAI the most credible AI assessment platform in India.</p>
        </div>

        {(() => {
          const items = [
            { icon: <Zap size={18} />, title: 'Adaptive AI Evaluation', desc: 'Questions adapt to your stream and level in real time — personal to you.', accent: '#7DD3FC' },
            { icon: <Users size={18} />, title: 'Human + AI Collaboration', desc: 'AI evaluates. Humans validate. Together = Centaur Intelligence.', accent: '#38bdf8' },
            { icon: <Shield size={18} />, title: 'Transparency & Trust', desc: 'Every score explained. You know exactly why you scored what you scored.', accent: '#60a5fa' },
            { icon: <MessageSquare size={18} />, title: 'Inclusive Onboarding', desc: 'Simple chatbot signup. Works for tech AND non-tech students. Tier 3 to IIT.', accent: '#818cf8' },
            { icon: <TrendingUp size={18} />, title: 'Gamification & Progress', desc: 'Badges. Streaks. Growth graphs. Track your AI journey with recruiter-ready metrics.', accent: '#a78bfa' },
            { icon: <Target size={18} />, title: 'Zero Sugarcoating', desc: 'Honest AI feedback. If your answer was weak, you\'ll know why — and improve.', accent: '#7DD3FC' },
          ];
          const Card = ({ item }) => (
            <div
              style={{
                width: 295, flexShrink: 0,
                background: '#ffffff',
                border: '1px solid #e0f2fe',
                borderRadius: 20, padding: '30px 26px 26px',
                minHeight: 250,
                boxShadow: '0 4px 20px rgba(125,211,252,0.12)',
                marginRight: 20, cursor: 'default',
                transition: 'box-shadow 0.3s, transform 0.3s, border-color 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 12px 40px ${item.accent}35`;
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = `${item.accent}80`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(125,211,252,0.12)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = '#e8f0fe';
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 20,
                background: `linear-gradient(135deg, ${item.accent}22, ${item.accent}0a)`,
                border: `1px solid ${item.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.accent,
              }}>
                {React.cloneElement(item.icon, { size: 22 })}
              </div>

              {/* Title */}
              <p style={{ fontSize: 15.5, fontWeight: 700, color: '#0f172a', marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{item.title}</p>

              {/* Divider */}
              <div style={{ width: 32, height: 2.5, borderRadius: 2, background: `linear-gradient(to right, ${item.accent}, ${item.accent}40)`, marginBottom: 12 }} />

              {/* Description */}
              <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75 }}>{item.desc}</p>
            </div>
          );
          return (
            <div style={{ overflow: 'hidden' }}>
              <div className="ciq-track">
                {[...items, ...items].map((item, i) => <Card key={i} item={item} />)}
              </div>
            </div>
          );
        })()}
      </Section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <Section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-dark-card to-secondary/10 border border-primary/20 p-12 text-center">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">Ready to Begin?</p>
            <h2 className="text-5xl font-black text-white mb-4">Prove Your AI Skills Today</h2>
            <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">Join thousands of Indian students who have verified their AI proficiency. No college brand required — only skills.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-base font-bold shadow-glow-primary btn-glow">
                Start Free Assessment <ArrowRight size={18} />
              </motion.button>
            </div>
            <p className="text-text-muted text-sm mt-4">Free for all students | No credit card | Takes 2 min to sign up</p>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ background: 'linear-gradient(180deg, #0a1628 0%, #08121f 100%)', borderTop: '1px solid rgba(125,211,252,0.15)' }}
        className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {[
              { label: '38M+ Students', value: 38, suffix: 'M+', sub: 'Eligible in India' },
              { label: 'Rigorous Rounds', value: 3, suffix: '', sub: 'Progressive Assessment' },
              { label: 'AI Evaluation', value: 100, suffix: '%', sub: 'Honest Feedback' },
              { label: 'Sugarcoating', value: 0, suffix: '', sub: 'Pure Assessment' },
            ].map((stat, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.03 }}
                style={{ background: 'rgba(125,211,252,0.05)', border: '1px solid rgba(125,211,252,0.12)' }}
                className="rounded-2xl p-6 text-center cursor-default transition-all duration-200">
                <p className="text-3xl font-black mb-1" style={{ color: '#7DD3FC' }}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm font-semibold text-white">{stat.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-black" style={{ color: '#7DD3FC' }}>eraAI</span>
              </div>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: '#94a3b8' }}>Human + AI. Smarter Together. India's first adaptive AI proficiency platform.</p>
              <div className="flex gap-3">
                {[Twitter, Linkedin, Github].map((Icon, i) => (
                  <div key={i}
                    style={{ background: 'rgba(125,211,252,0.07)', border: '1px solid rgba(125,211,252,0.18)' }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[rgba(125,211,252,0.18)]"
                  >
                    <Icon size={15} style={{ color: '#7DD3FC' }} />
                  </div>
                ))}
              </div>
            </div>
            {[
              { title: 'Platform', links: ['Home', 'Leaderboard', 'About'] },
              { title: 'Students', links: ['Start Assessment', 'Dashboard', 'AI Passport', 'Badges'] },
              { title: 'Company', links: ['About eraAI', 'Privacy Policy', 'Terms of Use', 'Contact'] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-white mb-4 tracking-wide">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <span className="text-sm cursor-pointer transition-colors duration-150"
                        style={{ color: '#64748b' }}
                        onMouseEnter={e => e.target.style.color = '#7DD3FC'}
                        onMouseLeave={e => e.target.style.color = '#64748b'}>
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div style={{ borderTop: '1px solid rgba(125,211,252,0.1)' }}
            className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: '#475569' }}>© 2025 eraAI. All rights reserved.</p>
            <p className="text-sm flex items-center gap-1.5" style={{ color: '#475569' }}>
              Made with <Heart size={12} className="text-danger fill-danger" /> for India's AI Era
            </p>
          </div>

        </div>
      </footer>

      {/* Chatbot */}
      <Chatbot />

      <AuthModal isOpen={authModal} defaultTab={authTab} onClose={() => setAuthModal(false)} />
    </div>
  );
}
