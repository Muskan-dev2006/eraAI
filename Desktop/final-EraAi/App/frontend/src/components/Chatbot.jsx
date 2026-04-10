import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Bot, ChevronRight, SkipForward, Sparkles, CheckCircle } from 'lucide-react';

const STEPS = [
  { id: 0, type: 'intro' },
  { id: 1, type: 'text', field: 'name', question: "Awesome! First things first — what's your name?" },
  { id: 2, type: 'text', field: 'college', question: (name) => `Great to meet you, ${name}! Which college are you from?` },
  { id: 3, type: 'options', field: 'year', question: "Which year are you in?", options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'] },
  { id: 4, type: 'options', field: 'tier', question: "What's your college tier?", options: ['Tier 1 - IIT/NIT/BITS', 'Tier 2 - State Universities', 'Tier 3 - Local Colleges'] },
  { id: 5, type: 'options', field: 'stream', question: "Choose your assessment stream:", options: ['💻 DSA', '🤖 AI/ML', '🌐 Web Dev', '🖥️ CS Fundamentals'] },
  { id: 6, type: 'password', field: 'password', question: "Almost there! Set your password:" },
  { id: 7, type: 'email', field: 'email', question: "Enter your email to save your progress:" },
  { id: 8, type: 'final' }
];

const STREAM_MAP = {
  '💻 DSA': 'DSA',
  '🤖 AI/ML': 'AI/ML',
  '🌐 Web Dev': 'Web Dev',
  '🖥️ CS Fundamentals': 'CS Fundamentals'
};

const TIER_MAP = {
  'Tier 1 - IIT/NIT/BITS': 'Tier 1',
  'Tier 2 - State Universities': 'Tier 2',
  'Tier 3 - Local Colleges': 'Tier 3'
};

/* ── Small spinning-ring Aria avatar for the chat header ── */
const AriaAvatarHeader = () => (
  <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #7DD3FC, #38bdf8, #818cf8, #60a5fa, #7DD3FC)',
        zIndex: 1
      }}
    />
    <div style={{
      position: 'absolute', inset: 3, borderRadius: '50%',
      background: '#0a1628', zIndex: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <svg viewBox="0 0 60 60" style={{ width: 22, height: 22 }}>
        <circle cx="20" cy="25" r="6.5" fill="#38bdf8" opacity="0.9" />
        <circle cx="20" cy="25" r="3"   fill="#e0f2fe" />
        <circle cx="40" cy="25" r="6.5" fill="#818cf8" opacity="0.9" />
        <circle cx="40" cy="25" r="3"   fill="#e0e7ff" />
        <path d="M 16 40 Q 30 50 44 40" stroke="#7DD3FC" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

/* ── Tiny avatar used beside each bot message ── */
const AriaAvatarTiny = () => (
  <div style={{
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <svg viewBox="0 0 60 60" style={{ width: 16, height: 16 }}>
      <circle cx="20" cy="26" r="7" fill="#fff" opacity="0.9" />
      <circle cx="40" cy="26" r="7" fill="#fff" opacity="0.9" />
      <path d="M 18 44 Q 30 52 42 44" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  </div>
);

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [formData, setFormData] = useState({ name: '', college: '', year: '', tier: '', stream: '', password: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const autoOpenedRef = useRef(false);
  const navigate = useNavigate();
  const { register } = useAuth(); // eslint-disable-line no-unused-vars

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Auto-open after 5 seconds on first visit
  useEffect(() => {
    if (autoOpenedRef.current) return;
    const timer = setTimeout(() => {
      autoOpenedRef.current = true;
      setOpen(true);
      setShowPreview(false);
    }, 5000);
    // Show preview bubble at 3s
    const previewTimer = setTimeout(() => setShowPreview(true), 3000);
    return () => { clearTimeout(timer); clearTimeout(previewTimer); };
  }, []);

  // Init chat when opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setTimeout(() => initChatbot(), 300);
    }
    if (!open) {
      const t = setTimeout(() => setShowPreview(true), 4000);
      return () => clearTimeout(t);
    } else {
      setShowPreview(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global open event (from navbar / home page buttons)
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      autoOpenedRef.current = true;
    };
    window.addEventListener('openChatbot', handler);
    return () => window.removeEventListener('openChatbot', handler);
  }, []);

  // eslint-disable-next-line no-unused-vars
  const addMessage = (text, sender = 'bot', delay = 0) =>
    new Promise(resolve => {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender, time: new Date() }]);
        resolve();
      }, delay);
    });

  const initChatbot = useCallback(() => {
    setMessages([]);
    setStep(0);
    setTimeout(() => {
      setMessages([{
        id: 1, sender: 'bot', time: new Date(),
        text: "Hey! I'm Aria, your eraAI guide!\nI'll get you set up in under 2 minutes.\nReady to prove your AI skills to the world?",
        type: 'intro'
      }]);
    }, 300);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) initChatbot();
  };

  const showTyping = async (duration = 800) => {
    setTyping(true);
    await new Promise(r => setTimeout(r, duration));
    setTyping(false);
  };

  const proceedToStep = async (nextStep, userMessage = null) => {
    if (userMessage) {
      setMessages(prev => [...prev, { id: Date.now(), text: userMessage, sender: 'user', time: new Date() }]);
    }
    await showTyping(700);

    const currentStep = STEPS.find(s => s.id === nextStep);
    if (!currentStep) return;

    let text = '';
    if (currentStep.type === 'intro') {
      text = "Hey! I'm Aria, your eraAI guide!\nI'll get you set up in under 2 minutes.\nReady to prove your AI skills to the world?";
    } else if (typeof currentStep.question === 'function') {
      text = currentStep.question(formData.name);
    } else {
      text = currentStep.question;
    }

    setMessages(prev => [...prev, {
      id: Date.now() + 1, text, sender: 'bot', time: new Date(),
      stepId: nextStep, type: currentStep.type,
      options: currentStep.options
    }]);
    setStep(nextStep);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleOptionSelect = async (option) => {
    const currentStepData = STEPS.find(s => s.id === step);
    if (!currentStepData) return;

    const newData = { ...formData };
    if (currentStepData.field === 'stream') {
      newData.stream = STREAM_MAP[option] || option;
    } else if (currentStepData.field === 'tier') {
      newData.tier = TIER_MAP[option] || option;
    } else {
      newData[currentStepData.field] = option;
    }
    setFormData(newData);
    setError('');

    if (step < 7) {
      await proceedToStep(step + 1, option);
    }
  };

  const handleNext = async () => {
    const currentStepData = STEPS.find(s => s.id === step);
    if (!currentStepData) return;

    if (currentStepData.type === 'text' || currentStepData.type === 'email' || currentStepData.type === 'password') {
      if (!inputValue.trim()) { setError('Please fill this in before continuing'); return; }
      if (currentStepData.type === 'email' && !/\S+@\S+\.\S+/.test(inputValue)) {
        setError('Please enter a valid email'); return;
      }
      if (currentStepData.type === 'password' && inputValue.length < 6) {
        setError('Password must be at least 6 characters'); return;
      }

      const newData = { ...formData, [currentStepData.field]: inputValue.trim() };
      setFormData(newData);
      setError('');

      const displayValue = currentStepData.type === 'password' ? '••••••••' : inputValue.trim();

      if (step < 7) {
        await proceedToStep(step + 1, displayValue);
      } else {
        await handleSubmit(newData);
      }
    }
  };

  const handleSkip = async () => {
    if (step === 0) { setOpen(false); return; }
    setError('');
    if (step < 7) {
      await proceedToStep(step + 1, 'Skipped');
    } else {
      await handleSubmit(formData);
    }
  };

  const handleSubmit = async (data) => {
    if (!data.email || !data.password) {
      setError('Email and password are required to create your account');
      return;
    }
    if (!data.name) data.name = 'Student';

    setLoading(true);
    try {
      await showTyping(1200);
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
        college: data.college,
        year: data.year,
        tier: data.tier,
        stream: data.stream
      });

      setSubmitted(true);
      const streamDisplay = data.stream || 'AI/ML';
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: `You're all set, ${data.name}!\nWelcome to eraAI!\nYour ${streamDisplay} assessment is ready.\nLet's see what you're made of!`,
        sender: 'bot',
        time: new Date(),
        type: 'final'
      }]);
      setStep(8);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      setMessages(prev => [...prev, {
        id: Date.now(), text: `Oops! ${msg} Want to try again?`, sender: 'bot', time: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = () => {
    setOpen(false);
    navigate('/dashboard');
  };

  const currentStepData = STEPS.find(s => s.id === step);

  return (
    <>
      {/* ── Floating launcher button (bottom-right, shown when closed) ── */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}
          >
            {/* Preview bubble */}
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.92 }}
                  onClick={handleOpen}
                  style={{
                    background: '#161622', border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: '16px 16px 4px 16px',
                    padding: '10px 14px', maxWidth: 210, cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
                  }}
                >
                  <p style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500, margin: 0 }}>
                    Hey! Ready to prove your AI skills?
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} className="animate-pulse" />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Aria is online</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Launcher */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpen}
              style={{
                width: 54, height: 54, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                border: 'none', cursor: 'pointer', position: 'relative',
                boxShadow: '0 6px 24px rgba(124,58,237,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Bot size={24} color="#fff" />
              <div style={{
                position: 'absolute', top: -2, right: -2,
                width: 14, height: 14, borderRadius: '50%',
                background: '#22c55e', border: '2px solid #08080f'
              }} className="animate-pulse" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat panel (bottom-right corner popup) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 50,
              width: 380,
              height: 500,
              maxHeight: 'calc(100vh - 48px)',
              display: 'flex', flexDirection: 'column',
              background: 'rgba(235,247,255,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(125,211,252,0.5)',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(0,100,200,0.2), 0 0 0 1px rgba(125,211,252,0.15)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '12px 14px',
              background: 'linear-gradient(135deg, rgba(125,211,252,0.4), rgba(56,189,248,0.25))',
              borderBottom: '1px solid rgba(125,211,252,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AriaAvatarHeader />
                <div>
                  <p style={{ color: '#0c4a6e', fontWeight: 700, fontSize: 14, margin: 0 }}>Aria</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} className="animate-pulse" />
                    <span style={{ fontSize: 11, color: '#0369a1' }}>eraAI Guide</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(125,211,252,0.2)',
                  border: '1px solid rgba(125,211,252,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#0369a1'
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '12px 12px',
              display: 'flex', flexDirection: 'column', gap: 10,
              minHeight: 0
            }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', gap: 7, flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}
                >
                  {msg.sender === 'bot' && <AriaAvatarTiny />}
                  <div style={{
                    maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 5,
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      padding: '9px 12px', fontSize: 13, lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      color: msg.sender === 'bot' ? '#0c4a6e' : '#fff',
                      borderRadius: msg.sender === 'bot' ? '14px 14px 14px 3px' : '14px 14px 3px 14px',
                      background: msg.sender === 'bot'
                        ? 'rgba(255,255,255,0.7)'
                        : 'linear-gradient(135deg, #38bdf8, #0369a1)',
                      border: msg.sender === 'bot' ? '1px solid rgba(125,211,252,0.3)' : 'none'
                    }}>
                      {msg.text}
                    </div>

                    {/* Option buttons */}
                    {msg.type === 'options' && msg.options && step === msg.stepId && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                        {msg.options.map(opt => (
                          <motion.button key={opt}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleOptionSelect(opt)}
                            style={{
                              padding: '5px 11px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                              background: 'rgba(125,211,252,0.15)',
                              border: '1px solid rgba(125,211,252,0.5)',
                              borderRadius: 9, color: '#0369a1'
                            }}
                          >
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Final CTA */}
                    {msg.type === 'final' && submitted && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleStartAssessment}
                        style={{
                          marginTop: 4, display: 'flex', alignItems: 'center', gap: 7,
                          padding: '9px 16px',
                          background: 'linear-gradient(135deg, #38bdf8, #0369a1)',
                          border: 'none', borderRadius: 11, color: '#fff',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          boxShadow: '0 4px 16px rgba(56,189,248,0.35)'
                        }}
                      >
                        <Sparkles size={13} />
                        Start Assessment
                      </motion.button>
                    )}

                    {/* Intro CTAs */}
                    {msg.type === 'intro' && step === 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 3 }}>
                        <div style={{ display: 'flex', gap: 7 }}>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={async () => { await proceedToStep(1); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '6px 13px', fontSize: 12, fontWeight: 600,
                              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                              border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer'
                            }}
                          >
                            <CheckCircle size={12} /> Let's Go!
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setOpen(false)}
                            style={{
                              padding: '6px 13px', fontSize: 12,
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.13)',
                              borderRadius: 9, color: '#94a3b8', cursor: 'pointer'
                            }}
                          >
                            Maybe Later
                          </motion.button>
                        </div>
                        <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                          Already have an account?{' '}
                          <button
                            onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent('openAuthModal')); }}
                            style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: 0 }}
                          >
                            Sign in here
                          </button>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', gap: 7, alignItems: 'center' }}
                  >
                    <AriaAvatarTiny />
                    <div style={{
                      padding: '10px 14px', display: 'flex', gap: 4,
                      background: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(125,211,252,0.3)',
                      borderRadius: '14px 14px 14px 3px'
                    }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i}
                          style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed' }}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.12 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {step > 0 && step < 8 && !submitted && currentStepData?.type !== 'options' && (
              <div style={{
                padding: '10px 12px',
                borderTop: '1px solid rgba(125,211,252,0.3)',
                flexShrink: 0
              }}>
                {error && (
                  <p style={{ fontSize: 11, color: '#f87171', marginBottom: 6, paddingLeft: 2 }}>{error}</p>
                )}
                <div style={{ display: 'flex', gap: 7 }}>
                  <input
                    ref={inputRef}
                    type={
                      currentStepData?.type === 'password' ? 'password' :
                      currentStepData?.type === 'email' ? 'email' : 'text'
                    }
                    value={inputValue}
                    onChange={e => { setInputValue(e.target.value); setError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') handleNext(); }}
                    placeholder={
                      currentStepData?.type === 'password' ? 'Enter password...' :
                      currentStepData?.type === 'email' ? 'your@email.com' :
                      currentStepData?.field === 'name' ? 'Your name...' :
                      'Type your answer...'
                    }
                    disabled={loading}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(125,211,252,0.5)',
                      borderRadius: 11, padding: '8px 12px',
                      fontSize: 13, color: '#0c4a6e', outline: 'none'
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleNext}
                    disabled={loading}
                    style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
                      border: 'none', borderRadius: 11, color: '#fff',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? (
                      <div style={{ width: 15, height: 15, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    ) : (
                      <ChevronRight size={17} />
                    )}
                  </motion.button>
                </div>

                {/* Progress + skip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {STEPS.filter(s => s.id > 0 && s.id < 8).map(s => (
                      <div key={s.id} style={{
                        height: 3, width: 18, borderRadius: 3,
                        background: s.id <= step ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s'
                      }} />
                    ))}
                  </div>
                  <button
                    onClick={handleSkip}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: 11, color: '#475569',
                      background: 'none', border: 'none', cursor: 'pointer'
                    }}
                  >
                    <SkipForward size={10} /> Skip
                  </button>
                </div>
              </div>
            )}

            {/* Account creation loading */}
            {loading && step === 8 && !submitted && (
              <div style={{
                padding: '10px 12px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 12, color: '#94a3b8', flexShrink: 0
              }}>
                <div style={{ width: 14, height: 14, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Creating your account...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
