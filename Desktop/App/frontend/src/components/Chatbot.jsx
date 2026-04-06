import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Bot, ChevronRight, SkipForward, Sparkles, CheckCircle } from 'lucide-react';

const STEPS = [
  { id: 0, type: 'intro' },
  { id: 1, type: 'text', field: 'name', question: "Awesome! First things first - what's your name?" },
  { id: 2, type: 'text', field: 'college', question: (name) => `Great to meet you, ${name}! Which college are you from?` },
  { id: 3, type: 'options', field: 'year', question: 'Which year are you in?', options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'] },
  { id: 4, type: 'options', field: 'tier', question: "What's your college tier?", options: ['Tier 1 - IIT/NIT/BITS', 'Tier 2 - State Universities', 'Tier 3 - Local Colleges'] },
  { id: 5, type: 'options', field: 'stream', question: 'Choose your assessment stream:', options: ['DSA', 'AI/ML', 'Web Dev', 'CS Fundamentals'] },
  { id: 6, type: 'password', field: 'password', question: 'Almost there! Set your password:' },
  { id: 7, type: 'email', field: 'email', question: 'Enter your email to save your progress:' },
  { id: 8, type: 'final' }
];

const STREAM_MAP = {
  DSA: 'DSA',
  'AI/ML': 'AI/ML',
  'Web Dev': 'Web Dev',
  'CS Fundamentals': 'CS Fundamentals'
};

const TIER_MAP = {
  'Tier 1 - IIT/NIT/BITS': 'Tier 1',
  'Tier 2 - State Universities': 'Tier 2',
  'Tier 3 - Local Colleges': 'Tier 3'
};

const AriaAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
    <Bot size={16} className="text-white" />
  </div>
);

const AriaHeroAvatar = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.82, y: 24 }}
    animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
    transition={{
      opacity: { duration: 0.4 },
      scale: { duration: 0.45 },
      y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
    }}
    className="relative mx-auto mb-4 h-24 w-24"
  >
    <div className="aria-orb-ring absolute inset-0 rounded-full p-[4px]">
      <div className="relative h-full w-full rounded-full bg-[#07111f] shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="absolute left-1/2 top-2.5 h-4 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan-300 to-purple-400" />
        <div className="absolute left-1/2 top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.85)]" />
        <div className="absolute left-[34%] top-[42%] h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(165,243,252,0.9)]" />
        <div className="absolute right-[34%] top-[42%] h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(165,243,252,0.9)]" />
        <div className="absolute left-1/2 top-[58%] h-6 w-10 -translate-x-1/2 rounded-b-full border-b-[3px] border-cyan-200/80" />
      </div>
    </div>
  </motion.div>
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
  const navigate = useNavigate();
  const { register } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPreview(true), 9000);
    return () => clearTimeout(timer);
  }, []);

  const initChatbot = useCallback(() => {
    setMessages([]);
    setStep(0);
    setTimeout(() => {
      setMessages([{
        id: 1,
        sender: 'bot',
        time: new Date(),
        text: "Hey! I'm Aria, your CentaurIQ guide!\nI'll get you set up in under 2 minutes.\nReady to prove your AI skills to the world?",
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
      text = "Hey! I'm Aria, your CentaurIQ guide!\nI'll get you set up in under 2 minutes.\nReady to prove your AI skills to the world?";
    } else if (typeof currentStep.question === 'function') {
      text = currentStep.question(formData.name);
    } else {
      text = currentStep.question;
    }

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      text,
      sender: 'bot',
      time: new Date(),
      stepId: nextStep,
      type: currentStep.type,
      options: currentStep.options
    }]);
    setStep(nextStep);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    const handleOpenEvent = () => {
      setShowPreview(false);
      setOpen(true);
      if (messages.length === 0) initChatbot();
    };

    window.addEventListener('openChatbot', handleOpenEvent);
    return () => window.removeEventListener('openChatbot', handleOpenEvent);
  }, [initChatbot, messages.length]);

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

      const displayValue = currentStepData.type === 'password' ? '********' : inputValue.trim();

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
        text: `You're all set, ${data.name}!\nWelcome to CentaurIQ!\nYour ${streamDisplay} assessment is ready.\nLet's see what you're made of.`,
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');

        .aria-welcome-shell {
          font-family: 'Sora', 'Inter', sans-serif;
        }

        .aria-orb-ring {
          background: conic-gradient(from 0deg, #8b5cf6, #2dd4bf, #fb7185, #8b5cf6);
          animation: aria-spin 5s linear infinite;
          box-shadow: 0 0 28px rgba(45, 212, 191, 0.24), 0 0 40px rgba(139, 92, 246, 0.18);
        }

        .aria-grid-bg {
          background-image:
            linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
          background-size: 34px 34px;
        }

        .aria-typing-dot {
          animation: aria-bounce 1.1s infinite ease-in-out;
        }

        .aria-typing-dot:nth-child(2) {
          animation-delay: 0.16s;
        }

        .aria-typing-dot:nth-child(3) {
          animation-delay: 0.32s;
        }

        @keyframes aria-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes aria-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
          >
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="bg-dark-card border border-dark-border rounded-2xl rounded-br-sm px-4 py-2.5 shadow-xl max-w-[220px] cursor-pointer"
                  onClick={handleOpen}
                >
                  <p className="text-sm text-white font-medium">Hey! Ready to prove your AI skills?</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                    <span className="text-xs text-text-secondary">Aria is online</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpen}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl glow-pulse flex items-center justify-center relative"
            >
              <Bot size={26} className="text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-dark-bg animate-pulse" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="aria-welcome-shell fixed bottom-6 right-6 z-50 w-[430px] max-w-[calc(100vw-24px)] text-white"
          >
            <div className="aria-grid-bg absolute inset-0 rounded-[32px]" />
            <div className="absolute left-1/2 top-10 h-48 w-48 -translate-x-1/2 rounded-full bg-purple-500/18 blur-3xl" />
            <div className="absolute bottom-16 left-6 h-40 w-40 rounded-full bg-teal-400/14 blur-3xl" />
            <div className="absolute right-6 top-16 h-40 w-40 rounded-full bg-fuchsia-400/10 blur-3xl" />

            <div className="relative">
              <motion.div
                className="relative flex h-[min(82vh,720px)] w-full flex-col overflow-hidden rounded-[32px] border border-slate-700/80 bg-[#05070d] shadow-[0_24px_100px_rgba(0,0,0,0.55)]"
              >
                <button
                  onClick={() => setOpen(false)}
                  className="absolute right-5 top-5 z-20 rounded-full border border-slate-600 bg-[#101521] p-2 text-slate-300 transition hover:border-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>

                <div className="border-b border-white/8 px-6 pb-4 pt-7 sm:px-8">
                  <AriaHeroAvatar />

                  <motion.div
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.22, duration: 0.42 }}
                    className="mx-auto max-w-sm rounded-[24px] border border-slate-700 bg-[#0b1220] px-4 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.38)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-teal-300 shadow-[0_0_16px_rgba(45,212,191,0.8)]" />
                      <div>
                        <p className="text-sm font-semibold leading-relaxed text-slate-100 sm:text-base">
                          Hey, welcome! I'm Aria, your AI assistant. Please sign in so I can help you.
                        </p>
                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="aria-typing-dot h-2 w-2 rounded-full bg-cyan-300" />
                          <span className="aria-typing-dot h-2 w-2 rounded-full bg-cyan-300" />
                          <span className="aria-typing-dot h-2 w-2 rounded-full bg-cyan-300" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42, duration: 0.42 }}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="flex items-center justify-between border-b border-white/8 px-6 py-4 sm:px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.28)]">
                        <Bot size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Aria</p>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                          <span className="text-xs text-slate-300">CentaurIQ Guide</span>
                        </div>
                      </div>
                    </div>
                    <p className="hidden text-xs uppercase tracking-[0.25em] text-slate-500 sm:block">Secure Assistant Welcome</p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 sm:px-8">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        {msg.sender === 'bot' && <AriaAvatar />}
                        <div className={`max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                            msg.sender === 'bot'
                              ? 'bg-[#121826] border border-slate-700 text-white rounded-tl-sm'
                              : 'bg-gradient-to-br from-primary to-secondary text-white rounded-tr-sm'
                          }`}>
                            {msg.text}
                          </div>

                          {msg.type === 'options' && msg.options && step === msg.stepId && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {msg.options.map(opt => (
                                <motion.button
                                  key={opt}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleOptionSelect(opt)}
                                  className="px-3 py-1.5 text-xs bg-[#08111d] border border-cyan-400/25 text-cyan-300 rounded-lg hover:bg-cyan-400/10 hover:border-cyan-300/55 transition-all duration-150 font-medium"
                                >
                                  {opt}
                                </motion.button>
                              ))}
                            </div>
                          )}

                          {msg.type === 'final' && submitted && (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={handleStartAssessment}
                              className="mt-2 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold shadow-glow-primary"
                            >
                              <Sparkles size={14} />
                              Start Assessment ->
                            </motion.button>
                          )}

                          {msg.type === 'intro' && step === 0 && (
                            <div className="flex gap-2 mt-1">
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={async () => { await proceedToStep(1); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-xs font-semibold"
                              >
                                <CheckCircle size={12} /> Let's Go!
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setOpen(false)}
                                className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs hover:text-white hover:border-slate-400 transition-colors"
                              >
                                Maybe Later
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    <AnimatePresence>
                      {typing && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2 items-center">
                          <AriaAvatar />
                          <div className="bg-[#121826] border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                            {[0, 1, 2].map(i => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 bg-primary rounded-full"
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {step > 0 && step < 8 && !submitted && currentStepData?.type !== 'options' && (
                    <div className="px-6 py-4 border-t border-white/8 flex-shrink-0 sm:px-8">
                      {error && (
                        <p className="text-xs text-danger mb-2 px-1">{error}</p>
                      )}
                      <div className="flex gap-2">
                        <input
                          ref={inputRef}
                          type={currentStepData?.type === 'password' ? 'password' : currentStepData?.type === 'email' ? 'email' : 'text'}
                          value={inputValue}
                          onChange={e => { setInputValue(e.target.value); setError(''); }}
                          onKeyDown={e => { if (e.key === 'Enter') handleNext(); }}
                          placeholder={
                            currentStepData?.type === 'password' ? 'Enter password...' :
                            currentStepData?.type === 'email' ? 'your@email.com' :
                            currentStepData?.field === 'name' ? 'Your name...' :
                            'Type your answer...'
                          }
                          className="flex-1 bg-[#0a1020] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/45 transition-colors"
                          style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', caretColor: '#67e8f9' }}
                          disabled={loading}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleNext}
                          disabled={loading}
                          className="p-2 bg-primary rounded-xl text-white hover:bg-primary/80 transition-colors disabled:opacity-50"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </motion.button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-1">
                          {STEPS.filter(s => s.id > 0 && s.id < 8).map(s => (
                            <div key={s.id} className={`h-1 w-5 rounded-full transition-all duration-300 ${s.id <= step ? 'bg-cyan-300' : 'bg-white/10'}`} />
                          ))}
                        </div>
                        <button onClick={handleSkip} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                          <SkipForward size={11} /> Skip
                        </button>
                      </div>
                    </div>
                  )}

                  {loading && step === 8 && !submitted && (
                    <div className="px-6 py-4 border-t border-white/8 flex-shrink-0 sm:px-8">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Creating your account...
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
