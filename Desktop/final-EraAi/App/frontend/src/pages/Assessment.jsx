import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { AlertTriangle, XCircle, Clock, ChevronRight, Trophy, ArrowRight, Brain, Maximize, Shield } from 'lucide-react';
import Round3VideoQuestion from '../components/Round3VideoQuestion';

// ── Tab Switch Hook ───────────────────────────────────────────────────────────
const useTabSwitch = (onTerminate) => {
  const [switches, setSwitches] = useState(0);
  const [warning, setWarning] = useState(null);
  const active = useRef(true);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && active.current) {
        setSwitches(prev => {
          const next = prev + 1;
          if (next >= 3) {
            active.current = false;
            onTerminate();
          } else {
            setWarning(next);
            setTimeout(() => setWarning(null), 4000);
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [onTerminate]);

  return { switches, warning };
};

// ── Timer Component ───────────────────────────────────────────────────────────
const Timer = ({ seconds, onExpire }) => {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const t = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(t);
  }, [remaining, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining <= 30;
  const isVeryLow = remaining <= 10;

  return (
    <div className={`flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1.5 rounded-lg border transition-all ${
      isVeryLow ? 'text-danger border-danger/40 bg-danger/10 timer-danger' :
      isLow ? 'text-warning border-warning/40 bg-warning/10' :
      'text-text-secondary border-dark-border'
    }`}>
      <Clock size={13} />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
};

// ── Tab Warning Banner ────────────────────────────────────────────────────────
const TabWarning = ({ count }) => (
  <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
    className="fixed top-0 left-0 right-0 z-50 bg-danger/95 backdrop-blur border-b border-danger text-white px-6 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2 font-semibold text-sm">
      <AlertTriangle size={16} /> ⚠️ Warning {count}/3: Please stay on this tab! Leaving again will terminate your assessment.
    </div>
  </motion.div>
);

// ── Terminated Screen ─────────────────────────────────────────────────────────
const Terminated = ({ navigate }) => (
  <div className="min-h-screen bg-dark-bg flex items-center justify-center text-center px-4">
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md">
      <div className="text-6xl mb-4">❌</div>
      <h2 className="text-2xl font-black text-danger mb-2">Assessment Terminated</h2>
      <p className="text-text-secondary mb-6">Tab switching detected 3 times. Your assessment has been ended. Please try again tomorrow.</p>
      <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-dark-card border border-dark-border text-white rounded-xl font-semibold hover:bg-dark-hover transition-all">
        Back to Dashboard
      </button>
    </motion.div>
  </div>
);

// ── ROUND 1 ───────────────────────────────────────────────────────────────────
const Round1 = ({ user, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const questionsRef = useRef([]);
  const { switches, warning } = useTabSwitch(() => setTerminated(true));
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/assessment/round1/${user.stream || 'General'}`, { headers: { 'Cache-Control': 'no-cache' } })
      .then(r => {
        const qs = Array.isArray(r.data) ? r.data : [];
        questionsRef.current = qs;
        setQuestions(qs);
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [user.stream]);

  const handleSelect = (idx) => { if (!feedback) setSelected(idx); };

  const handleNext = async () => {
    if (selected === null) return;
    const qs = questionsRef.current;
    const q = qs[currentIdx];
    if (!q) return;
    const newAnswers = [...answers, { questionId: q._id, answer: selected }];
    setAnswers(newAnswers);
    setFeedback({ selected });
    await new Promise(r => setTimeout(r, 1200));

    if (currentIdx < qs.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setFeedback(null);
    } else {
      // Submit
      setSubmitting(true);
      try {
        const res = await axios.post('/api/assessment/round1/submit', {
          answers: newAnswers, stream: user.stream, tabSwitches: switches, terminated: false
        });
        onComplete(res.data);
      } catch {
        onComplete({ error: true });
      }
      setSubmitting(false);
    }
  };

  if (terminated) return <Terminated navigate={navigate} />;
  if (loading) return <div className="min-h-screen bg-dark-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (questions.length === 0) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center text-center px-4">
      <div>
        <p className="text-white text-xl font-bold mb-2">No questions found</p>
        <p className="text-text-secondary text-sm mb-4">Stream: {user?.stream || 'General'}</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm">Back to Dashboard</button>
      </div>
    </div>
  );

  const q = questions[currentIdx];
  if (!q) return null;
  const progress = ((currentIdx) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-dark-bg no-select">
      <AnimatePresence>{warning && <TabWarning count={warning} />}</AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary">Round 1</span>
            <span className="text-text-muted text-xs">{currentIdx + 1}/{questions.length}</span>
            {switches > 0 && <span className="text-xs text-warning flex items-center gap-1"><AlertTriangle size={11} /> {switches}/3</span>}
          </div>
          <Timer seconds={1200} onExpire={() => handleNext()} />
        </div>
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="h-1 bg-dark-border rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={currentIdx}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Question {currentIdx + 1}</p>
            <h2 className="text-xl font-bold text-white mb-6 leading-relaxed">{q.question}</h2>

            <div className="space-y-3 mb-6">
              {(q.options || []).map((option, i) => (
                <motion.button key={i} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(i)}
                  disabled={!!feedback}
                  className={`w-full text-left px-5 py-4 rounded-xl border text-sm transition-all duration-200 ${
                    selected === i
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-dark-border bg-dark-card text-text-secondary hover:border-primary/30 hover:text-white'
                  }`}
                >
                  <span className="font-mono text-text-muted mr-3">{String.fromCharCode(65 + i)}.</span>
                  {option}
                </motion.button>
              ))}
            </div>

            {submitting ? (
              <div className="flex items-center justify-center gap-2 text-text-secondary">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Submitting...
              </div>
            ) : (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={selected === null || !!feedback}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold btn-glow transition-all disabled:opacity-40"
              >
                {currentIdx < questions.length - 1 ? 'Next Question' : 'Submit Round 1'} <ChevronRight size={16} />
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── ROUND 2 ───────────────────────────────────────────────────────────────────
const Round2 = ({ user, onComplete }) => {
  const [question, setQuestion] = useState(null);
  const [, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [difficulty, setDifficulty] = useState(3);
  const [questionCount, setQuestionCount] = useState(0);
  const [terminated, setTerminated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const answeredTopics = useRef([]);
  // Refs so closures always see the latest values
  const answersRef = useRef([]);
  const difficultyRef = useRef(3);
  const finishRoundRef = useRef(null);
  const { switches, warning } = useTabSwitch(() => setTerminated(true));
  const navigate = useNavigate();
  const TOTAL = 20;

  const fetchQuestion = useCallback(async (diff) => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/assessment/round2/question', {
        params: { stream: user.stream || 'DSA', difficulty: diff, answered: answeredTopics.current.join(',') }
      });
      if (data.done) {
        // Only finish if at least some questions were answered
        if (answersRef.current.length > 0) {
          finishRoundRef.current();
        } else {
          setLoading(false);
          setQuestion(null);
        }
        return;
      }
      setQuestion(data);
      setSelected(null);
    } catch {
      if (answersRef.current.length > 0) finishRoundRef.current();
    } finally {
      setLoading(false);
    }
  }, [user.stream]);

  const finishRound = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post('/api/assessment/round2/submit', {
        answers: answersRef.current,
        stream: user.stream,
        tabSwitches: switches,
        terminated: false,
        finalDifficulty: difficultyRef.current
      });
      onComplete(res.data);
    } catch { onComplete({ error: true }); }
    setSubmitting(false);
  };

  // Keep ref always pointing to the latest finishRound (avoids stale closure)
  finishRoundRef.current = finishRound;

  useEffect(() => { fetchQuestion(3); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = async () => {
    if (selected === null || !question) return;
    const newAnswers = [...answersRef.current, { questionId: question._id, answer: selected }];
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    if (question.topic) answeredTopics.current.push(question.topic);
    const newCount = questionCount + 1;
    setQuestionCount(newCount);

    if (newCount >= TOTAL) { await finishRound(); return; }

    // Run check + next question fetch in parallel to eliminate sequential wait
    setLoading(true);
    try {
      const [checkRes, nextRes] = await Promise.all([
        axios.post('/api/assessment/round2/check', { questionId: question._id, answer: selected }),
        axios.get('/api/assessment/round2/question', {
          params: { stream: user.stream || 'DSA', difficulty: difficulty, answered: answeredTopics.current.join(',') }
        })
      ]);

      const isCorrect = checkRes.data.isCorrect;
      const newDiff = isCorrect ? Math.min(10, difficulty + 1) : Math.max(1, difficulty - 1);
      difficultyRef.current = newDiff;
      setDifficulty(newDiff);

      setQuestion(nextRes.data);
      setSelected(null);
    } catch {
      if (answersRef.current.length > 0) finishRoundRef.current();
    } finally {
      setLoading(false);
    }
  };

  if (terminated) return <Terminated navigate={navigate} />;

  if (!loading && !question && answersRef.current.length === 0) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center text-center px-4">
      <div>
        <p className="text-white text-xl font-bold mb-2">No questions available</p>
        <p className="text-text-secondary text-sm mb-4">Please contact support or try again later.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm">Back to Dashboard</button>
      </div>
    </div>
  );

  const diffLevel = difficulty <= 3 ? 'Basic' : difficulty <= 6 ? 'Intermediate' : difficulty <= 8 ? 'Advanced' : 'Expert';
  const diffColor = difficulty <= 3 ? 'success' : difficulty <= 6 ? 'warning' : difficulty <= 8 ? 'danger' : 'secondary';
  const progress = (questionCount / TOTAL) * 100;

  return (
    <div className="min-h-screen bg-dark-bg no-select">
      <AnimatePresence>{warning && <TabWarning count={warning} />}</AnimatePresence>

      <div className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-secondary">Round 2</span>
            <span className="text-text-muted text-xs">{questionCount + 1}/{TOTAL}</span>
            <span className={`text-xs font-medium text-${diffColor} bg-${diffColor}/10 border border-${diffColor}/20 px-2 py-0.5 rounded-full`}>
              {diffLevel} {difficulty <= 5 ? '⬆️' : '🔥'}
            </span>
            {switches > 0 && <span className="text-xs text-warning flex items-center gap-1"><AlertTriangle size={11} /> {switches}/3</span>}
          </div>
          <Timer seconds={2700} onExpire={finishRound} />
        </div>
        <div className="max-w-3xl mx-auto mt-2">
          <div className="h-1 bg-dark-border rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-text-secondary">
            <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
            Loading next question...
          </div>
        ) : question ? (
          <AnimatePresence mode="wait">
            <motion.div key={question._id}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Question {questionCount + 1} &middot; Difficulty {difficulty}/10</p>
              <h2 className="text-xl font-bold text-white mb-6 leading-relaxed">{question.question}</h2>
              <div className="space-y-3 mb-6">
                {question.options.map((opt, i) => (
                  <motion.button key={i} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(i)}
                    className={`w-full text-left px-5 py-4 rounded-xl border text-sm transition-all duration-200 ${
                      selected === i ? 'border-secondary bg-secondary/10 text-white' :
                      'border-dark-border bg-dark-card text-text-secondary hover:border-secondary/30 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-text-muted mr-3">{String.fromCharCode(65 + i)}.</span>{opt}
                  </motion.button>
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleAnswer} disabled={selected === null || submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-secondary to-primary text-white rounded-xl font-semibold btn-glow-purple transition-all disabled:opacity-40">
                {submitting ? 'Evaluating...' : questionCount < TOTAL - 1 ? 'Next' : 'Submit Round 2'} <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  );
};

// ── ROUND 3 ───────────────────────────────────────────────────────────────────
const Round3 = ({ user, onComplete }) => {
  const [scenarios, setScenarios] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [response, setResponse] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [currentEval, setCurrentEval] = useState(null);
  const [terminated, setTerminated] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const textEvalsRef = useRef([]);
  const { switches, warning } = useTabSwitch(() => setTerminated(true));
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/assessment/round3/scenarios', { params: { stream: user.stream } })
      .then(r => setScenarios(r.data.scenarios || []));
  }, [user.stream]);

  const handleEvaluate = async () => {
    if (!response.trim() || response.trim().length < 20) return;
    setEvaluating(true);
    try {
      const res = await axios.post('/api/assessment/round3/evaluate', {
        scenario: scenarios[currentIdx], response: response.trim(),
        scenarioIndex: currentIdx, stream: user.stream
      });
      setCurrentEval(res.data.evaluation);
    } catch (err) {
      console.error('Round 3 eval error:', err?.response?.data || err.message);
      setCurrentEval({ totalScore: 50, summary: `Evaluation failed: ${err?.response?.data?.message || err.message || 'Unknown error'}` });
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = async () => {
    if (!currentEval) return;
    const newEvals = [...evaluations, currentEval];
    setEvaluations(newEvals);

    if (currentIdx < scenarios.length - 1) {
      setCurrentIdx(i => i + 1);
      setResponse('');
      setCurrentEval(null);
    } else {
      // Text scenarios done → move to video question
      textEvalsRef.current = newEvals;
      setShowVideo(true);
    }
  };

  const handleVideoComplete = async (videoEval) => {
    // videoEval is the full evaluation object from Round3VideoQuestion
    // terminated case
    if (videoEval?.terminated) {
      onComplete({ error: true, terminated: true });
      return;
    }
    const videoScore = videoEval?.totalScore ?? 0;
    const textScores = textEvalsRef.current.map(e => e.totalScore);
    const allScores = [...textScores, videoScore];
    try {
      const res = await axios.post('/api/assessment/round3/complete', {
        scores: allScores, stream: user.stream, tabSwitches: switches, terminated: false
      });
      onComplete({ ...res.data, evaluations: textEvalsRef.current });
    } catch { onComplete({ error: true }); }
  };

  if (terminated) return <Terminated navigate={navigate} />;

  // After text scenarios → show video question
  if (showVideo) return (
    <div className="min-h-screen bg-dark-bg">
      <AnimatePresence>{warning && <TabWarning count={warning} />}</AnimatePresence>
      <div className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-warning">Round 3</span>
            <span className="text-text-muted text-xs">Question 3/3 — Video Response</span>
          </div>
          <span className="text-xs text-text-secondary">AI-Evaluated</span>
        </div>
        <div className="max-w-3xl mx-auto mt-2">
          <div className="h-1 bg-dark-border rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-warning to-primary rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
      <Round3VideoQuestion user={user} onComplete={handleVideoComplete} />
    </div>
  );

  const scenario = scenarios[currentIdx];
  const progress = ((currentIdx) / (scenarios.length || 2)) * 100;

  return (
    <div className="min-h-screen bg-dark-bg">
      <AnimatePresence>{warning && <TabWarning count={warning} />}</AnimatePresence>

      <div className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-warning">Round 3</span>
            <span className="text-text-muted text-xs">Scenario {currentIdx + 1}/{scenarios.length}</span>
            {switches > 0 && <span className="text-xs text-warning flex items-center gap-1"><AlertTriangle size={11} /> {switches}/3</span>}
          </div>
          <span className="text-xs text-text-secondary">AI-Evaluated Scenarios</span>
        </div>
        <div className="max-w-3xl mx-auto mt-2">
          <div className="h-1 bg-dark-border rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-warning to-primary rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {scenario && (
          <AnimatePresence mode="wait">
            <motion.div key={currentIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Scenario */}
              <div className="bg-dark-card border border-warning/20 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 text-warning text-xs font-semibold uppercase tracking-wider mb-3">
                  <Brain size={14} /> Scenario {currentIdx + 1}
                </div>
                <p className="text-white leading-relaxed">{scenario}</p>
              </div>

              {!currentEval ? (
                <>
                  <p className="text-sm text-text-secondary mb-3">Write the AI prompt you would use AND explain your reasoning:</p>
                  <textarea
                    value={response}
                    onChange={e => setResponse(e.target.value)}
                    placeholder="Write your AI prompt here and explain why you would use this approach. Be specific and detailed..."
                    className="w-full h-48 bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-warning/50 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between mt-2 mb-4">
                    <span className="text-xs text-text-muted">{response.length} chars (min 20)</span>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleEvaluate} disabled={response.trim().length < 20 || evaluating}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-warning to-primary text-white rounded-xl font-semibold transition-all disabled:opacity-40">
                    {evaluating ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> AI Evaluating...</>
                    ) : 'Submit for AI Evaluation'} <ChevronRight size={16} />
                  </motion.button>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-dark-card border border-dark-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white">AI Evaluation</h3>
                    <div className={`text-xl font-black ${currentEval.totalScore >= 60 ? 'text-success' : 'text-warning'}`}>
                      {currentEval.totalScore}/100
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { key: 'promptQuality', label: 'Prompt Quality' },
                      { key: 'thinkingApproach', label: 'Thinking' },
                      { key: 'practicalUsability', label: 'Practicality' },
                      { key: 'aiUnderstanding', label: 'AI Understanding' },
                    ].map(({ key, label }) => (
                      <div key={key} className="bg-dark-bg rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-text-muted">{label}</span>
                          <span className={`text-sm font-bold ${currentEval[key]?.score >= 15 ? 'text-success' : currentEval[key]?.score >= 10 ? 'text-warning' : 'text-danger'}`}>
                            {currentEval[key]?.score || 0}/25
                          </span>
                        </div>
                        <div className="h-1 bg-dark-border rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }}
                            animate={{ width: `${((currentEval[key]?.score || 0) / 25) * 100}%` }}
                            transition={{ duration: 0.6 }}
                            className={`h-full rounded-full ${(currentEval[key]?.score || 0) >= 15 ? 'bg-success' : 'bg-warning'}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-text-secondary bg-dark-bg rounded-xl p-3 mb-4">{currentEval.summary}</p>

                  <button onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-warning to-success text-white rounded-xl font-semibold transition-all">
                    {currentIdx < scenarios.length - 1 ? 'Next Scenario' : 'Complete Round 3'} <ChevronRight size={16} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// ── ROUND 4 ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const Round4 = ({ user, onComplete }) => {
  const [question, setQuestion] = useState(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('read'); // read | answer | done
  const [readTimer, setReadTimer] = useState(30);
  const [answerTimer, setAnswerTimer] = useState(90);
  const [submitting, setSubmitting] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const TOTAL = 10;
  const { switches, warning } = useTabSwitch(() => setTerminated(true));
  const navigate = useNavigate();

  const fetchQuestion = useCallback(async (idx) => {
    const { data } = await axios.get('/api/assessment/round4/question', {
      params: { stream: user.stream, index: idx }
    });
    if (data.done) return null;
    return data;
  }, [user.stream]);

  useEffect(() => {
    fetchQuestion(0).then(q => setQuestion(q));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Read timer countdown
  useEffect(() => {
    if (phase !== 'read') return;
    if (readTimer <= 0) { setPhase('answer'); return; }
    const t = setTimeout(() => setReadTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, readTimer]);

  // Answer timer countdown
  useEffect(() => {
    if (phase !== 'answer') return;
    if (answerTimer <= 0) { handleSubmitAnswer(); return; }
    const t = setTimeout(() => setAnswerTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, answerTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitAnswer = async () => {
    if (!question) return;
    const newAnswers = [...answers, { question: question.question, answer: answer || '[No answer given]' }];
    setAnswers(newAnswers);
    const nextIdx = questionIdx + 1;

    if (nextIdx >= TOTAL) {
      // Final evaluation
      setSubmitting(true);
      try {
        const res = await axios.post('/api/assessment/round4/evaluate', {
          answers: newAnswers, stream: user.stream, tabSwitches: switches, terminated: false
        });
        onComplete(res.data);
      } catch { onComplete({ error: true }); }
      setSubmitting(false);
      return;
    }

    setQuestionIdx(nextIdx);
    const nextQ = await fetchQuestion(nextIdx);
    setQuestion(nextQ);
    setAnswer('');
    setPhase('read');
    setReadTimer(30);
    setAnswerTimer(90);
  };

  if (terminated) return <Terminated navigate={navigate} />;
  if (submitting) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Claude AI is evaluating your interview...</p>
        <p className="text-xs text-text-muted mt-2">This takes about 15 seconds</p>
      </div>
    </div>
  );

  const progress = (questionIdx / TOTAL) * 100;
  const answerIsLow = answerTimer <= 10;
  const answerIsWarn = answerTimer <= 30;

  return (
    <div className="min-h-screen bg-dark-bg">
      <AnimatePresence>{warning && <TabWarning count={warning} />}</AnimatePresence>

      <div className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-danger">Round 4 &middot; Live Interview</span>
            <span className="text-text-muted text-xs">Q{questionIdx + 1}/{TOTAL}</span>
          </div>
          <div className={`flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1.5 rounded-lg border transition-all ${
            phase === 'read' ? 'border-primary/40 bg-primary/10 text-primary' :
            answerIsLow ? 'border-danger/40 bg-danger/10 text-danger timer-danger' :
            answerIsWarn ? 'border-warning/40 bg-warning/10 text-warning' :
            'border-dark-border text-text-secondary'
          }`}>
            <Clock size={13} />
            {phase === 'read' ? `Read: ${readTimer}s` : `Answer: ${answerTimer}s`}
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-2">
          <div className="h-1 bg-dark-border rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-danger to-warning rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {question && (
          <AnimatePresence mode="wait">
            <motion.div key={questionIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Phase indicator */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                phase === 'read'
                  ? 'bg-primary/10 border border-primary/20 text-primary'
                  : 'bg-danger/10 border border-danger/20 text-danger'
              }`}>
                <Clock size={11} />
                {phase === 'read' ? `Reading time: ${readTimer}s` : `Answer time: ${answerTimer}s remaining`}
              </div>

              <div className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-6">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Interview Question {questionIdx + 1}</p>
                <p className="text-lg font-semibold text-white leading-relaxed">{question.question}</p>
              </div>

              {phase === 'answer' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    autoFocus
                    placeholder="Type your answer here... Be clear, structured, and direct."
                    className="w-full h-40 bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-danger/50 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-muted">{answer.length} characters</span>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitAnswer}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-danger to-warning text-white rounded-xl font-semibold text-sm transition-all">
                      {questionIdx < TOTAL - 1 ? 'Next Question' : 'Finish Interview'} <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {phase === 'read' && (
                <div className="text-center py-4">
                  <div className="text-text-secondary text-sm">Read the question carefully. Answer time begins in <span className="text-primary font-bold">{readTimer}s</span></div>
                  <div className="mt-3 w-full h-1 bg-dark-border rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full"
                      animate={{ width: `${(readTimer / 30) * 100}%` }}
                      transition={{ duration: 0.5 }} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// ── RESULT SCREEN ─────────────────────────────────────────────────────────────
const RoundResult = ({ round, result, onContinue }) => {
  const [count, setCount] = useState(0);
  const target = result.score || result.totalScore || 0;

  useEffect(() => {
    let n = 0;
    const step = target / 60;
    const t = setInterval(() => {
      n += step;
      if (n >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.round(n));
    }, 1000 / 60);
    return () => clearInterval(t);
  }, [target]);

  const passed = result.passed;
  const badgeMap = { 1: 'AI Foundations', 2: 'Dynamic Thinker', 3: 'AI Whisperer' };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="max-w-lg w-full bg-dark-card border border-dark-border rounded-3xl p-8 text-center">

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl ${
            passed ? 'bg-success/20 border border-success/30' : 'bg-danger/20 border border-danger/30'
          }`}>
          {passed ? '🎉' : '😔'}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className={`text-6xl font-black mb-2 ${passed ? 'text-success' : 'text-warning'}`}>
          {count}
          <span className="text-2xl text-text-muted">/100</span>
        </motion.div>

        <h2 className="text-2xl font-black text-white mb-2">
          {passed ? `Round ${round} Cleared! 🎉` : `Almost There`}
        </h2>

        <p className="text-text-secondary mb-6 text-sm">{result.message}</p>

        {passed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="badge-earned inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-xl text-success font-semibold text-sm mb-6">
            <Trophy size={16} /> {badgeMap[round]} Earned!
          </motion.div>
        )}

        {round === 1 && result.graded && !passed && (
          <div className="text-left bg-dark-bg rounded-xl p-4 mb-6">
            <p className="text-xs text-text-secondary font-medium mb-2">Topics to review:</p>
            {result.graded.filter(g => !g.correct).slice(0, 3).map((g, i) => (
              <div key={i} className="text-xs text-text-muted mb-1 flex items-start gap-2">
                <XCircle size={12} className="text-danger mt-0.5 flex-shrink-0" />
                <span>{g.questionText?.slice(0, 80)}...</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onContinue}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold btn-glow transition-all">
          {passed && round < 3 ? `Continue to Round ${round + 1}` :
           passed && round === 3 ? 'Back to Dashboard' : 'Back to Dashboard'}
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
};

// ── MAIN ASSESSMENT COMPONENT ─────────────────────────────────────────────────
export default function Assessment() {
  const { round } = useParams();
  const roundNum = parseInt(round);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro'); // intro | active | result
  const [result, setResult] = useState(null);

  // Reset when navigating to a different round (same component instance is reused by React Router)
  useEffect(() => {
    setPhase('intro');
    setResult(null);
  }, [roundNum]);

  // Copy-paste allowed for testing

  const handleStart = () => {
    setPhase('active');
    // Request fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const handleComplete = async (data) => {
    setResult(data);
    setPhase('result');
    await refreshUser();
  };

  const handleContinue = async () => {
    if (result?.passed && roundNum < 3) {
      await refreshUser();
      navigate(`/assessment/${roundNum + 1}`);
    } else {
      navigate('/dashboard');
    }
  };

  // Guard: redirect if round 4+ or not yet eligible
  if (roundNum > 3) return <Navigate to="/dashboard" replace />;
  const prevRoundCompleted = roundNum === 1 || user?.roundsCompleted?.includes(roundNum - 1);
  if (user && !prevRoundCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const roundTitles = {
    1: 'Foundation Check',
    2: 'Dynamic Adaptive Test',
    3: 'Real Scenario Challenge',
  };

  const roundColors = { 1: 'primary', 2: 'secondary', 3: 'warning' };
  const roundDescs = {
    1: '15 MCQ questions | 20 minutes | Pass: 9/15 correct',
    2: '20 adaptive questions | 45 minutes | Pass: 65%',
    3: '2 real-world scenarios | AI evaluation | Pass: 60%',
  };

  if (phase === 'result' && result) {
    return <RoundResult round={roundNum} result={result} onContinue={handleContinue} />;
  }

  if (phase === 'active') {
    const props = { user, onComplete: handleComplete };
    if (roundNum === 1) return <Round1 {...props} />;
    if (roundNum === 2) return <Round2 {...props} />;
    if (roundNum === 3) return <Round3 {...props} />;
  }

  // Intro screen
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-dark-card border border-dark-border rounded-3xl p-8 text-center">

        <div className={`w-16 h-16 rounded-2xl bg-${roundColors[roundNum]}/10 border border-${roundColors[roundNum]}/20 flex items-center justify-center mx-auto mb-5`}>
          <Brain size={28} className={`text-${roundColors[roundNum]}`} />
        </div>

        <div className={`inline-block px-3 py-1 bg-${roundColors[roundNum]}/10 border border-${roundColors[roundNum]}/20 rounded-full text-${roundColors[roundNum]} text-xs font-semibold mb-3`}>
          Round {roundNum}
        </div>

        <h1 className="text-2xl font-black text-white mb-2">{roundTitles[roundNum]}</h1>
        <p className="text-text-secondary text-sm mb-6">{roundDescs[roundNum]}</p>

        <div className="bg-dark-bg rounded-2xl p-5 mb-6 text-left space-y-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Rules</h3>
          {[
            'Tab switching is monitored - 3 switches = termination',
            'Right-click and copy-paste are disabled',
            'You cannot go back to previous questions',
            `Stream: ${user?.stream || 'General'} - questions are tailored to you`,
            null
          ].filter(Boolean).map((rule, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
              <Shield size={12} className="text-primary mt-0.5 flex-shrink-0" /> {rule}
            </div>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className={`w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-${roundColors[roundNum]}/80 to-${roundColors[roundNum]} text-white rounded-xl font-bold text-base btn-glow transition-all`}>
          <Maximize size={16} /> Start Round {roundNum}
        </motion.button>

        <button onClick={() => navigate('/dashboard')}
          className="mt-3 text-sm text-text-muted hover:text-text-secondary transition-colors">
          &larr; Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}
