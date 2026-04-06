import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Chatbot from '../components/Chatbot';
import {
  ArrowRight, Play, CheckCircle, Zap, Brain, Target, Shield,
  Users, Star, ChevronLeft, ChevronRight, Award,
  Globe, Code2, Cpu, Twitter, Linkedin,
  Github, Heart, TrendingUp, MessageSquare, Layers
} from 'lucide-react';

// â”€â”€â”€ Particle Canvas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      color: Math.random() > 0.5 ? '#0f766e' : '#2563eb'
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
            ctx.strokeStyle = `rgba(37, 99, 235, ${0.08 * (1 - dist / 120)})`;
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

// â”€â”€â”€ Typewriter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Counter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// Section Wrapper
const Section = ({ children, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

// â”€â”€â”€ Main Home Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Home() {
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [loginModal, setLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openChatbot'));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const testimonials = [
    { name: "Priya Sharma", college: "JNTU Hyderabad", tier: "Tier 2", stream: "AI/ML", score: 84, text: "CentaurIQ gave me an honest assessment of my AI skills. The feedback was direct and helped me understand exactly where I stood before my campus placements. I got placed at a Hyderabad startup because of this!", avatar: "PS" },
    { name: "Rajan Kumar", college: "GEC Thrissur", tier: "Tier 3", stream: "Web Dev", score: 76, text: "I'm from a local college in Kerala and always felt at a disadvantage. CentaurIQ's certificate gave me credibility that my college name alone couldn't. Three recruiters reached out after I shared my AI Passport.", avatar: "RK" },
    { name: "Ananya Singh", college: "IIT Kanpur", tier: "Tier 1", stream: "DSA", score: 93, text: "Even as a Tier 1 student, this platform challenged me. Round 4 live interview was intense. It told me exactly what was missing in my answers â€” no padding, no fake praise. This is the real deal.", avatar: "AS" },
    { name: "Mohammed Farrukh", college: "Osmania University", tier: "Tier 2", stream: "CS Fundamentals", score: 79, text: "The chatbot signup was so smooth. Aria made me feel welcome even though I was nervous. The adaptive Round 2 actually got harder as I answered correctly â€” felt like a real challenge, not just a quiz.", avatar: "MF" },
  ];

  const heroImage = 'https://unsplash.com/photos/5ZeooCGNw3s/download?force=true&w=2200';

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError('');
    try {
      await login(loginData.email, loginData.password);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="home-page-light min-h-screen bg-[#f8fafc] text-slate-900 overflow-x-hidden">
      <style>{`
        .home-page-light {
          background:
            linear-gradient(180deg, #ffffff 0%, #f8fafc 48%, #eff6ff 100%);
        }

        .home-page-light .grid-bg {
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
        }

        .home-page-light .glass {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(148, 163, 184, 0.22);
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
        }

        .home-page-light .gradient-text {
          background: linear-gradient(135deg, #0f172a, #1d4ed8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .home-page-light .text-text-secondary {
          color: #475569 !important;
        }

        .home-page-light .text-text-muted {
          color: #64748b !important;
        }

        .home-page-light .bg-dark-card,
        .home-page-light .bg-dark-card\\/30,
        .home-page-light .bg-dark-card\\/60,
        .home-page-light footer {
          background-color: rgba(255, 255, 255, 0.8) !important;
        }

        .home-page-light .bg-dark-bg {
          background-color: #eef4ff !important;
        }

        .home-page-light .border-dark-border {
          border-color: rgba(148, 163, 184, 0.28) !important;
        }

        .home-page-light .hover\\:bg-dark-hover:hover {
          background-color: rgba(226, 232, 240, 0.9) !important;
        }

        .home-page-light .hover\\:text-white:hover {
          color: #0f172a !important;
        }

        .home-page-light .bg-white\\/5 {
          background-color: rgba(255, 255, 255, 0.72) !important;
        }

        .home-page-light .border-white\\/10,
        .home-page-light .border-white\\/5 {
          border-color: rgba(148, 163, 184, 0.28) !important;
        }

        .home-page-light input {
          color: #0f172a !important;
        }

        .home-page-light input::placeholder {
          color: #94a3b8 !important;
        }

        .home-page-light #particle-canvas {
          opacity: 0.55;
        }

        .hero-slider-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
      <Navbar transparent />

      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg pt-16">
        <ParticleCanvas />
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Dark hero background"
            className="hero-slider-image"
          />
          <div className="absolute inset-0 bg-slate-950/28" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-slate-950/36 to-black/18" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-4xl text-left">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-8">
              <Zap size={14} className="animate-pulse" />
              India's First Adaptive AI Proficiency Platform
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
                <Typewriter texts={['Prove Your AI Skills.', 'Stand Out. Get Hired.', 'Master AI. Now.']} speed={60} />
              </span>
              <br />
              <span className="text-white">Redefining the AI era.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-slate-200 max-w-2xl mb-10 leading-relaxed">
              India's first adaptive AI proficiency platform for every student, every stream, every city.
              <span className="text-cyan-200 font-semibold"> Zero sugarcoating. Real results.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 items-start sm:justify-start mb-16">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl text-base font-bold shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition-all duration-200 hover:bg-slate-100">
                Start Assessment <ArrowRight size={18} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setLoginModal(true)}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900/72 border border-white/25 text-white rounded-xl text-base font-semibold backdrop-blur-sm hover:bg-slate-900/84 transition-all duration-200">
                <Play size={16} className="text-cyan-300" /> Login to Dashboard
              </motion.button>
            </motion.div>
          </div>

        </div>
      </section>

      {/* â”€â”€ HOW IT WORKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="text-4xl font-black text-white mb-4">How CentaurIQ Works</h2>
          <p className="text-text-secondary max-w-xl mx-auto">From zero to certified in four steps. No fluff. No shortcuts. Real results.</p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-20" />
          <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5"
            style={{ background: 'repeating-linear-gradient(90deg, #00BCD4 0, #00BCD4 8px, transparent 8px, transparent 16px)', opacity: 0.4 }} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: <MessageSquare size={24} />, step: '01', title: 'Smart Chatbot Onboard', desc: 'Aria guides you through signup in under 2 minutes. No boring forms.', color: 'primary' },
              { icon: <Layers size={24} />, step: '02', title: '4 Rounds of Assessment', desc: 'Foundation â†’ Adaptive â†’ Scenarios â†’ Live Interview. Progressive difficulty.', color: 'secondary' },
              { icon: <Brain size={24} />, step: '03', title: 'Honest AI Evaluation', desc: 'Claude AI evaluates your work. No sugarcoating. Real professional feedback.', color: 'warning' },
              { icon: <Award size={24} />, step: '04', title: 'Badge + Get Hired', desc: 'Earn verified badge. Share AI Passport. Get noticed by real recruiters.', color: 'success' },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className="relative text-center p-6 bg-dark-card border border-dark-border rounded-2xl card-hover group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${item.color}/10 border border-${item.color}/20 flex items-center justify-center mx-auto mb-5 text-${item.color} group-hover:scale-110 transition-transform duration-200`}>
                  {item.icon}
                </div>
                <div className="absolute top-4 right-4 text-xs font-mono text-text-muted opacity-50">{item.step}</div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* â”€â”€ 4 ROUNDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="py-24 bg-dark-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Assessment Structure</p>
            <h2 className="text-4xl font-black text-white mb-4">4 Rounds. No Easy Path.</h2>
            <p className="text-text-secondary max-w-xl mx-auto">Each round unlocks only after you pass the previous one. This isn't a quiz â€” it's a real proficiency test.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { round: 1, color: 'primary', icon: 'ðŸ”µ', badge: 'Foundation', title: 'Foundation Check', points: ['15 core AI concept MCQs', 'Covers your stream specifically', '20 minutes. 9/15 to pass', 'Pass to unlock Round 2'] },
              { round: 2, color: 'secondary', icon: 'ðŸŸ£', badge: 'Adaptive', title: 'Dynamic Adaptive Test', points: ['30 questions. Gets harder as you improve', 'Real-time difficulty adjustment', '45 minutes. Score 65+ to pass', 'Intelligence reveal through adaptation'] },
              { round: 3, color: 'warning', icon: 'ðŸŸ¡', badge: 'Real-World', title: 'Real Scenario Challenge', points: ['5 professional work scenarios', 'Write your AI prompt + reasoning', 'Claude evaluates. Zero sugarcoating', 'Score 60+ to advance'] },
              { round: 4, color: 'danger', icon: 'ðŸ”´', badge: 'Live Interview', title: 'Live AI Interview', points: ['10 real interview questions', '90 seconds per answer. Strict timer', 'AI interviewer. Professional standard', 'Score 70+ = CentaurIQ Certified ðŸ†'] },
            ].map((round, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className={`relative p-6 bg-dark-card border rounded-2xl overflow-hidden card-hover group border-${round.color}/20 hover:border-${round.color}/50`}
              >
                <div className={`absolute top-0 right-0 w-40 h-40 bg-${round.color}/3 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl`} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{round.icon}</span>
                    <div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-${round.color}/10 text-${round.color} border border-${round.color}/20`}>
                        Round {round.round} Â· {round.badge}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">{round.title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {round.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle size={14} className={`text-${round.color} mt-0.5 flex-shrink-0`} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* â”€â”€ STREAMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Pick Your Track</p>
          <h2 className="text-4xl font-black text-white mb-4">4 Streams Available</h2>
          <p className="text-text-secondary max-w-xl mx-auto">Questions are tailored to your stream. DSA students get DSA questions. AI students get AI questions. Always relevant.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <Code2 size={32} />, stream: 'DSA', name: 'Data Structures & Algorithms', desc: 'Arrays, Trees, DP, Graphs, Sorting â€” the interview essentials', color: 'from-blue-500/20 to-primary/20', border: 'border-primary/30', students: '12,400+' },
            { icon: <Brain size={32} />, stream: 'AI/ML', name: 'Artificial Intelligence & ML', desc: 'Neural networks, NLP, CV, transformers, real AI applications', color: 'from-secondary/20 to-purple-400/20', border: 'border-secondary/30', students: '9,800+' },
            { icon: <Globe size={32} />, stream: 'Web Dev', name: 'Web Development', desc: 'React, Node, APIs, performance, security, architecture', color: 'from-success/20 to-teal-400/20', border: 'border-success/30', students: '8,200+' },
            { icon: <Cpu size={32} />, stream: 'CS Fundamentals', name: 'CS Fundamentals', desc: 'OS, Networks, DBMS, ACID, TCP â€” core CS concepts', color: 'from-warning/20 to-orange-400/20', border: 'border-warning/30', students: '7,600+' },
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

      {/* â”€â”€ WHY CENTAURIQ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="py-24 bg-dark-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-secondary text-sm font-semibold uppercase tracking-widest mb-3">Why Different</p>
            <h2 className="text-4xl font-black text-white mb-4">Built for Every Indian Student</h2>
            <p className="text-text-secondary max-w-xl mx-auto">5 pillars that make CentaurIQ the most credible AI assessment platform in India.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Zap size={20} />, title: 'Adaptive AI Evaluation', desc: 'Questions adapt to YOUR stream and YOUR level in real time. Not one-size-fits-all â€” personal to you.', color: 'primary' },
              { icon: <Users size={20} />, title: 'Human + AI Collaboration', desc: 'AI evaluates. Humans validate. Together = Centaur Intelligence. The best of both worlds.', color: 'secondary' },
              { icon: <Shield size={20} />, title: 'Transparency & Trust', desc: 'Every score explained clearly. You know why you scored what you scored. No black box. Ever.', color: 'success' },
              { icon: <MessageSquare size={20} />, title: 'Inclusive Onboarding', desc: 'Simple chatbot signup. Works for tech AND non-tech students. Tier 3 to IIT â€” same platform.', color: 'warning' },
              { icon: <TrendingUp size={20} />, title: 'Gamification & Progress', desc: 'Badges. Streaks. Growth graphs. Track your AI journey with metrics that matter to recruiters.', color: 'danger' },
              { icon: <Target size={20} />, title: 'Zero Sugarcoating', desc: 'Our AI evaluator is honest. If your answer was weak, you\'ll know why. That\'s how you actually improve.', color: 'primary' },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className={`p-6 bg-dark-card border border-${item.color}/15 rounded-2xl card-hover group`}
              >
                <div className={`w-10 h-10 rounded-xl bg-${item.color}/10 border border-${item.color}/20 flex items-center justify-center text-${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* â”€â”€ TESTIMONIALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Student Stories</p>
          <h2 className="text-4xl font-black text-white mb-4">Real Students. Real Results.</h2>
          <p className="text-text-secondary">From Tier 3 colleges to top companies â€” CentaurIQ levels the playing field.</p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div key={testimonialIdx}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-dark-card border border-dark-border rounded-2xl p-8 relative">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                    {testimonials[testimonialIdx].avatar}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{testimonials[testimonialIdx].name}</p>
                    <p className="text-sm text-text-secondary">{testimonials[testimonialIdx].college} Â· {testimonials[testimonialIdx].tier}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{testimonials[testimonialIdx].stream}</span>
                      <span className="text-xs text-success font-semibold">Score: {testimonials[testimonialIdx].score}/100</span>
                    </div>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-warning fill-warning" />)}
                  </div>
                </div>
                <p className="text-text-secondary leading-relaxed text-base italic">"{testimonials[testimonialIdx].text}"</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setTestimonialIdx(i => (i - 1 + testimonials.length) % testimonials.length)}
              className="p-2 rounded-full bg-dark-card border border-dark-border text-text-secondary hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setTestimonialIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === testimonialIdx ? 'w-6 bg-primary' : 'w-2 bg-dark-border'}`} />
            ))}
            <button onClick={() => setTestimonialIdx(i => (i + 1) % testimonials.length)}
              className="p-2 rounded-full bg-dark-card border border-dark-border text-text-secondary hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Section>

      {/* â”€â”€ FOR RECRUITERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="py-24 bg-dark-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-secondary text-sm font-semibold uppercase tracking-widest mb-3">For Employers</p>
              <h2 className="text-4xl font-black text-white mb-6">Find AI-Ready Talent From Every Corner of India</h2>
              <p className="text-text-secondary leading-relaxed mb-6 text-base">Stop filtering by college tier. Filter by verified skill. Our platform has assessed students from 500+ colleges across India â€” Tier 1 to Tier 3.</p>
              <ul className="space-y-3 mb-8">
                {['Verified AI proficiency scores, not just resumes', 'Filter by stream, tier, score, and badge level', 'See honest AI feedback on every candidate', 'Export shortlisted candidates to CSV instantly'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                    <CheckCircle size={16} className="text-success flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/recruiters')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-primary text-white rounded-xl font-semibold btn-glow-purple transition-all duration-200">
                Access Recruiter Dashboard <ArrowRight size={16} />
              </motion.button>
            </div>

            <div className="relative">
              <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Recruiter Dashboard</h3>
                  <span className="text-xs text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">Live</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[['847', 'Verified Students'], ['234', 'Tier 2/3 Talent'], ['89', 'Certified']].map(([v, l]) => (
                    <div key={l} className="bg-dark-bg rounded-xl p-3 text-center">
                      <p className="text-xl font-black gradient-text">{v}</p>
                      <p className="text-xs text-text-muted mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Arjun Mehta', stream: 'DSA', score: 90, badge: 'ðŸ†', tier: 'Tier 1' },
                    { name: 'Priya Nair', stream: 'Web Dev', score: 79, badge: 'ðŸ§ ', tier: 'Tier 2' },
                    { name: 'Rajan Kumar', stream: 'AI/ML', score: 84, badge: 'ðŸŽ¯', tier: 'Tier 3' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center text-xs font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">{s.name}</p>
                          <p className="text-xs text-text-muted">{s.stream} Â· {s.tier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{s.badge}</span>
                        <span className="text-xs font-bold text-success">{s.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Decoration */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </Section>

      {/* â”€â”€ CTA BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-dark-card to-secondary/10 border border-primary/20 p-12 text-center">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">Ready to Begin?</p>
            <h2 className="text-5xl font-black text-white mb-4">Prove Your AI Skills Today</h2>
            <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">Join thousands of Indian students who have verified their AI proficiency. No college brand required â€” only skills.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-base font-bold shadow-glow-primary btn-glow">
                Start Free Assessment <ArrowRight size={18} />
              </motion.button>
            </div>
            <p className="text-text-muted text-sm mt-4">Free for all students Â· No credit card Â· Takes 2 min to sign up</p>
          </div>
        </div>
      </Section>

      {/* â”€â”€ FOOTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <footer className="bg-dark-card border-t border-dark-border py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: '38M+ Students', value: 38, suffix: 'M+', sub: 'Eligible in India' },
              { label: '4 Rigorous Rounds', value: 4, suffix: '', sub: 'Progressive Assessment' },
              { label: 'Real AI Evaluation', value: 100, suffix: '%', sub: 'Honest Feedback' },
              { label: '0 Sugarcoating', value: 0, suffix: '', sub: 'Pure Assessment' },
            ].map((stat, i) => (
              <motion.div key={i} whileHover={{ y: -2 }}
                className="glass border border-white/5 rounded-2xl p-5 text-center card-hover">
                <p className="text-3xl font-black gradient-text mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm font-semibold text-slate-900 mb-0.5">{stat.label.split(' ').slice(-2).join(' ')}</p>
                <p className="text-xs text-text-secondary">{stat.sub}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-black gradient-text">CentaurIQ</span>
              </div>
              <p className="text-sm text-text-secondary mb-4 leading-relaxed">Human + AI. Smarter Together. India's first adaptive AI proficiency platform.</p>
              <div className="flex gap-3">
                {[Twitter, Linkedin, Github].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-dark-bg border border-dark-border flex items-center justify-center text-text-secondary hover:text-white hover:border-primary/40 transition-all cursor-pointer">
                    <Icon size={14} />
                  </div>
                ))}
              </div>
            </div>
            {[
              { title: 'Platform', links: ['Home', 'Leaderboard', 'For Recruiters', 'About'] },
              { title: 'Students', links: ['Start Assessment', 'Dashboard', 'AI Passport', 'Badges'] },
              { title: 'Company', links: ['About CentaurIQ', 'Privacy Policy', 'Terms of Use', 'Contact'] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-white mb-4">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}><span className="text-sm text-text-secondary hover:text-white cursor-pointer transition-colors">{link}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">Â© 2025 CentaurIQ. All rights reserved.</p>
            <p className="text-sm text-text-muted flex items-center gap-1.5">Made with <Heart size={12} className="text-danger fill-danger" /> for India's AI Era</p>
          </div>
        </div>
      </footer>

      {/* Chatbot */}
      <Chatbot />

      {/* Login Modal */}
      <AnimatePresence>
        {loginModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setLoginModal(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-dark-card border border-dark-border rounded-2xl p-8 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-black text-white mb-2">Welcome back</h2>
              <p className="text-text-secondary text-sm mb-6">Sign in to your CentaurIQ account</p>
              {loginError && <div className="mb-4 px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">{loginError}</div>}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Email</label>
                  <input type="email" value={loginData.email} onChange={e => setLoginData(p => ({...p, email: e.target.value}))}
                    className="w-full mt-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="your@email.com" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Password</label>
                  <input type="password" value={loginData.password} onChange={e => setLoginData(p => ({...p, password: e.target.value}))}
                    className="w-full mt-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required />
                </div>
                <button type="submit" disabled={loginLoading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-sm btn-glow transition-all disabled:opacity-60">
                  {loginLoading ? 'Signing in...' : 'Sign In â†’'}
                </button>
              </form>
              <p className="text-center text-xs text-text-muted mt-4">
                New here?{' '}
                <button onClick={() => { setLoginModal(false); window.dispatchEvent(new CustomEvent('openChatbot')); }}
                  className="text-primary hover:underline">
                  Get started with Aria â†’
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}





