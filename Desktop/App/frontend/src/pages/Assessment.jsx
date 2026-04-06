import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { AlertTriangle, XCircle, Clock, ChevronRight, Trophy, ArrowRight, Brain, Maximize, Shield } from 'lucide-react';

// â”€â”€ Tab Switch Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Timer Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Tab Warning Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TabWarning = ({ count }) => (
  <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
    className="fixed top-0 left-0 right-0 z-50 bg-danger/95 backdrop-blur border-b border-danger text-white px-6 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2 font-semibold text-sm">
      <AlertTriangle size={16} /> âš ï¸ Warning {count}/3: Please stay on this tab! Leaving again will terminate your assessment.
    </div>
  </motion.div>
);

// â”€â”€ Terminated Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Terminated = ({ navigate }) => (
  <div className="min-h-screen bg-dark-bg flex items-center justify-center text-center px-4">
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md">
      <div className="text-6xl mb-4">âŒ</div>
      <h2 className="text-2xl font-black text-danger mb-2">Assessment Terminated</h2>
      <p className="text-text-secondary mb-6">Tab switching detected 3 times. Your assessment has been ended. Please try again tomorrow.</p>
      <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-dark-card border border-dark-border text-white rounded-xl font-semibold hover:bg-dark-hover transition-all">
        Back to Dashboard
      </button>
    </motion.div>
  </div>
);

// â”€â”€ ROUND 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Round1 = ({ user, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const { switches, warning } = useTabSwitch(() => setTerminated(true));
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/assessment/round1/${user.stream || 'General'}`)
      .then(r => { setQuestions(r.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [user.stream]);

  const handleSelect = (idx) => { if (!feedback) setSelected(idx); };

  const handleNext = async () => {
    if (selected === null) return;
    const q = questions[currentIdx];
    const newAnswers = [...answers, { questionId: q._id, answer: selected }];
    setAnswers(newAnswers);
    setFeedback({ selected });
    await new Promise(r => setTimeout(r, 1200));

    if (currentIdx < questions.length - 1) {
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
            {switches > 0 && <span className="text-xs text-warning">âš ï¸ Switches: {switches}/3</span>}
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
              {q.options.map((option, i) => (
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

// â”€â”€ ROUND 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Round2 = ({ user, onComplete }) => {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [difficulty, setDifficulty] = useState(3);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [terminated, setTerminated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const answeredIds = useRef([]);
  const { switches, warning } = useTabSwitch(() => setTerminated(true));
  const navigate = useNavigate();

  const finishRound = useCallback(async (finalAnswers = answers, finalDifficulty = difficulty) => {
    setSubmitting(true);
    try {
      const res = await axios.post('/api/assessment/round2/submit', {
        answers: finalAnswers,
        stream: user.stream,
        tabSwitches: switches,
        terminated: false,
        finalDifficulty
      });
      onComplete(res.data);
    } catch {
      onComplete({ error: true });
    }
    setSubmitting(false);
  }, [answers, difficulty, onComplete, switches, user.stream]);

  const fetchQuestion = useCallback(async (targetDifficulty, currentAnswers = answers) => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/assessment/round2/question', {
        params: {
          stream: user.stream,
          difficulty: targetDifficulty,
          answered: answeredIds.current.join(',')
        }
      });

      if (data.done) {
        await finishRound(currentAnswers, targetDifficulty);
        return;
      }

      setQuestion(data);
      setTotalQuestions(Math.max(1, Math.min(data.totalAvailable || 30, 30)));
      setSelected(null);
    } catch {
      await finishRound(currentAnswers, targetDifficulty);
    } finally {
      setLoading(false);
    }
  }, [answers, finishRound, user.stream]);

  useEffect(() => {
    fetchQuestion(difficulty, answers);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = async () => {
    if (selected === null || !question || submitting) return;

    setSubmitting(true);
    try {
      const { data } = await axios.post('/api/assessment/round2/answer', {
        questionId: question._id,
        answer: selected,
        currentDifficulty: difficulty
      });

      const newAnswers = [...answers, data.gradedAnswer];
      const targetTotal = Math.max(1, totalQuestions);
      const newCount = questionCount + 1;

      setAnswers(newAnswers);
      answeredIds.current.push(question._id);
      setQuestionCount(newCount);
      setDifficulty(data.nextDifficulty);

      if (newCount >= targetTotal) {
        await finishRound(newAnswers, data.nextDifficulty);
        return;
      }

      await fetchQuestion(data.nextDifficulty, newAnswers);
    } catch {
      await finishRound(answers, difficulty);
    } finally {
      setSubmitting(false);
    }
  };

  if (terminated) return <Terminated navigate={navigate} />;

  const activeDifficulty = question?.difficulty ?? difficulty;
  const diffLevel = activeDifficulty <= 3 ? 'Basic' : activeDifficulty <= 6 ? 'Intermediate' : activeDifficulty <= 8 ? 'Advanced' : 'Expert';
  const diffColor = activeDifficulty <= 3 ? 'success' : activeDifficulty <= 6 ? 'warning' : activeDifficulty <= 8 ? 'danger' : 'secondary';
  const progress = (questionCount / Math.max(totalQuestions, 1)) * 100;

  return (
    <div className="min-h-screen bg-dark-bg no-select">
      <AnimatePresence>{warning && <TabWarning count={warning} />}</AnimatePresence>

      <div className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-secondary">Round 2</span>
            <span className="text-text-muted text-xs">{Math.min(questionCount + 1, totalQuestions)}/{totalQuestions}</span>
            <span className={`text-xs font-medium text-${diffColor} bg-${diffColor}/10 border border-${diffColor}/20 px-2 py-0.5 rounded-full`}>
              {diffLevel} {activeDifficulty <= 5 ? '⬆️' : '🔥'}
            </span>
            {switches > 0 && <span className="text-xs text-warning">⚠️ {switches}/3</span>}
          </div>
          <Timer seconds={2700} onExpire={() => finishRound(answers, difficulty)} />
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
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Question {questionCount + 1} · Difficulty {question.difficulty}/10</p>
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
                {submitting ? 'Evaluating...' : questionCount < totalQuestions - 1 ? 'Next →' : 'Submit Round 2'} <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  );
};
// â”€â”€ ROUND 3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Round3 = ({ user, onComplete }) => {
  const [scenarios, setScenarios] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [response, setResponse] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [currentEval, setCurrentEval] = useState(null);
  const [terminated, setTerminated] = useState(false);
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
    } catch {
      setCurrentEval({ totalScore: 50, summary: 'Evaluation failed. Score set to 50.' });
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
      // Complete round 3
      const scores = newEvals.map(e => e.totalScore);
      try {
        const res = await axios.post('/api/assessment/round3/complete', {
          scores, stream: user.stream, tabSwitches: switches, terminated: false
        });
        onComplete({ ...res.data, evaluations: newEvals });
      } catch { onComplete({ error: true }); }
    }
  };

  if (terminated) return <Terminated navigate={navigate} />;

  const scenario = scenarios[currentIdx];
  const progress = ((currentIdx) / (scenarios.length || 5)) * 100;

  return (
    <div className="min-h-screen bg-dark-bg">
      <AnimatePresence>{warning && <TabWarning count={warning} />}</AnimatePresence>

      <div className="sticky top-0 z-20 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-warning">Round 3</span>
            <span className="text-text-muted text-xs">Scenario {currentIdx + 1}/{scenarios.length}</span>
            {switches > 0 && <span className="text-xs text-warning">âš ï¸ {switches}/3</span>}
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
                    ) : 'Submit for AI Evaluation â†’'}
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
                    {currentIdx < scenarios.length - 1 ? 'Next Scenario â†’' : 'Complete Round 3 â†’'}
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

// â”€â”€ ROUND 4 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            <span className="text-sm font-semibold text-danger">Round 4 Â· Live Interview</span>
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
                      {questionIdx < TOTAL - 1 ? 'Next Question â†’' : 'Finish Interview â†’'}
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

// â”€â”€ RESULT SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  const passed = result.passed || (round === 4 && (result.score || 0) >= 70);
  const badgeMap = { 1: 'AI Foundations ðŸ…', 2: 'Dynamic Thinker ðŸ§ ', 3: 'AI Whisperer ðŸŽ¯', 4: 'CentaurIQ Certified ðŸ†' };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="max-w-lg w-full bg-dark-card border border-dark-border rounded-3xl p-8 text-center">

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl ${
            passed ? 'bg-success/20 border border-success/30' : 'bg-danger/20 border border-danger/30'
          }`}>
          {passed ? 'ðŸŽ‰' : 'ðŸ˜”'}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className={`text-6xl font-black mb-2 ${passed ? 'text-success' : 'text-warning'}`}>
          {count}
          <span className="text-2xl text-text-muted">/100</span>
        </motion.div>

        <h2 className="text-2xl font-black text-white mb-2">
          {passed ? `Round ${round} Cleared! ðŸŽ‰` : `Almost There`}
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
          {passed && round < 4 ? `Continue to Round ${round + 1} â†’` :
           passed && round === 4 ? 'View Certificate ðŸ†' : 'Back to Dashboard'}
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
};

// â”€â”€ MAIN ASSESSMENT COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Assessment() {
  const { round } = useParams();
  const roundNum = parseInt(round);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro'); // intro | active | result
  const [result, setResult] = useState(null);

  // Disable right-click and copy-paste
  useEffect(() => {
    const noCtx = e => e.preventDefault();
    const noCopy = e => { if (e.ctrlKey && ['c', 'v', 'x'].includes(e.key.toLowerCase())) e.preventDefault(); };
    document.addEventListener('contextmenu', noCtx);
    document.addEventListener('keydown', noCopy);
    return () => { document.removeEventListener('contextmenu', noCtx); document.removeEventListener('keydown', noCopy); };
  }, []);

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

  const handleContinue = () => {
    if (result?.passed && roundNum < 4) {
      navigate(`/assessment/${roundNum + 1}`);
    } else if (result?.passed && roundNum === 4) {
      navigate('/results');
    } else {
      navigate('/dashboard');
    }
  };

  const roundTitles = {
    1: 'Foundation Check',
    2: 'Dynamic Adaptive Test',
    3: 'Real Scenario Challenge',
    4: 'Live AI Interview'
  };

  const roundColors = { 1: 'primary', 2: 'secondary', 3: 'warning', 4: 'danger' };
  const roundDescs = {
    1: '15 MCQ questions Â· 20 minutes Â· Pass: 9/15 correct',
    2: '30 adaptive questions Â· 45 minutes Â· Pass: 65%',
    3: '5 real-world scenarios Â· AI evaluation Â· Pass: 60%',
    4: '10 interview questions Â· Timed answers Â· Pass: 70%'
  };

  if (phase === 'result' && result) {
    return <RoundResult round={roundNum} result={result} onContinue={handleContinue} />;
  }

  if (phase === 'active') {
    const props = { user, onComplete: handleComplete };
    if (roundNum === 1) return <Round1 {...props} />;
    if (roundNum === 2) return <Round2 {...props} />;
    if (roundNum === 3) return <Round3 {...props} />;
    if (roundNum === 4) return <Round4 {...props} />;
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
            'Tab switching is monitored â€” 3 switches = termination',
            'Right-click and copy-paste are disabled',
            'You cannot go back to previous questions',
            `Stream: ${user?.stream || 'General'} â€” questions are tailored to you`,
            roundNum === 4 ? '30 seconds to read, 90 seconds to answer each question' : null
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
          â† Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}




