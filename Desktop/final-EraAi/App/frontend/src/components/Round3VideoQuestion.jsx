import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Mic, Clock, ChevronRight, CheckCircle, AlertTriangle, AlertCircle, RotateCcw, Trophy } from 'lucide-react';
import axios from 'axios';

const MAX_RETAKES = 2;

// ── Tab-switch hook (same pattern as Assessment.jsx) ──────────────────────────
function useTabSwitch(onTerminate) {
  const [switches, setSwitches] = useState(0);
  const [warning, setWarning] = useState(null);
  const active = useRef(true);
  const trackRef = useRef(false);

  const startTracking = useCallback(() => { trackRef.current = true; }, []);
  const stopTracking  = useCallback(() => { trackRef.current = false; }, []);

  useEffect(() => {
    const handle = () => {
      if (!trackRef.current || !active.current) return;
      if (document.hidden) {
        setSwitches(prev => {
          const next = prev + 1;
          if (next >= 3) { active.current = false; onTerminate(); }
          else { setWarning(next); setTimeout(() => setWarning(null), 4000); }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [onTerminate]);

  return { switches, warning, startTracking, stopTracking };
}

// ── Animated score counter ────────────────────────────────────────────────────
function AnimatedScore({ target }) {
  const [count, setCount] = useState(0);
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
  return <>{count}</>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Round3VideoQuestion({ user, onComplete }) {
  const [phase, setPhase] = useState('permission');
  // permission | instructions | read | record | review | uploading | result

  const [questionData, setQuestionData] = useState(null);
  const [permissionError, setPermissionError] = useState('');

  // Timers
  const [readTimer, setReadTimer]     = useState(30);
  const [recordTimer, setRecordTimer] = useState(60);
  const [elapsed, setElapsed]         = useState(0);

  // Recording state
  const [retakeCount, setRetakeCount]         = useState(0);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimText, setInterimText]         = useState('');
  const [shortWarning, setShortWarning]       = useState(false);
  // recordedBlobUrl state removed — blob URL stored in blobUrlRef only
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Evaluation result
  const [evaluation, setEvaluation]   = useState(null);
  const [uploadError, setUploadError] = useState('');

  // Refs
  const streamRef      = useRef(null);
  const recorderRef    = useRef(null);
  const chunksRef      = useRef([]);
  const recognitionRef = useRef(null);
  const transcriptRef  = useRef('');
  const blobUrlRef     = useRef(null);

  // Ref callbacks — fire the instant the DOM element mounts, no async delay
  const liveVideoRef = useCallback(node => {
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reviewVideoRef = useCallback(node => {
    if (node && blobUrlRef.current) {
      node.src = blobUrlRef.current;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { warning: tabWarning, startTracking, stopTracking } = useTabSwitch(() => {
    stopTracking();
    onComplete({ terminated: true, totalScore: 0, passed: false });
  });

  // Fetch question on mount
  useEffect(() => {
    axios.get('/api/assessment/round3/video-question', { params: { stream: user.stream } })
      .then(r => setQuestionData(r.data))
      .catch(() => setQuestionData({
        question: `Introduce yourself and explain how you would use AI tools in your day-to-day work as a ${user.stream} professional.`,
        instructions: [
          'Speak clearly and look directly at the camera',
          'Mention at least one specific AI tool by name',
          'Give a real-world example of how it helps you',
          'Structure your answer: Introduction → AI tool → Real example → Impact',
          'You have 30 seconds to read and 60 seconds to record',
        ],
        timeLimit: 60,
        readTime: 30,
      }));
  }, [user.stream]);

  // ── Read timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'read') return;
    if (readTimer <= 0) { beginRecording(); return; }
    const t = setTimeout(() => setReadTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, readTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Record countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'record') return;
    if (recordTimer <= 0) { stopRecording(); return; }
    const t = setTimeout(() => {
      setRecordTimer(r => r - 1);
      setElapsed(e => e + 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, recordTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  // stream/blob attachment is handled by ref callbacks (liveVideoRef / reviewVideoRef)

  // ── PERMISSION ──────────────────────────────────────────────────────────────
  const requestPermission = async () => {
    setPermissionError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      setPhase('instructions');
    } catch (err) {
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera or microphone access was denied. Please allow access in your browser settings and refresh.'
          : `Could not access camera/mic: ${err.message}`
      );
    }
  };

  // ── BEGIN RECORDING ─────────────────────────────────────────────────────────
  const beginRecording = useCallback(() => {
    // Reset for this attempt
    chunksRef.current = [];
    transcriptRef.current = '';
    setFinalTranscript('');
    setInterimText('');
    setShortWarning(false);
    setElapsed(0);
    setRecordTimer(questionData?.timeLimit || 60);

    // Revoke previous blob URL
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }

    startTracking();

    // MediaRecorder
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
      .find(m => MediaRecorder.isTypeSupported(m)) || '';
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
    recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start(250);
    recorderRef.current = recorder;

    // Web Speech API — best-effort live transcript display
    const w = /** @type {any} */ (window);
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = e => {
        let fin = '', int = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' ';
          else int += e.results[i][0].transcript;
        }
        if (fin) {
          transcriptRef.current += fin;
          setFinalTranscript(transcriptRef.current);
        }
        setInterimText(int);
      };
      rec.onerror = e => console.warn('SR error:', e.error);
      try { rec.start(); } catch(e) { console.warn('SR start failed:', e); }
      recognitionRef.current = rec;
    }

    setPhase('record');
  }, [questionData, startTracking]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── STOP RECORDING ──────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    stopTracking();
    setInterimText('');
    try { recognitionRef.current?.stop(); } catch(e) {}

    const secs = elapsed || (questionData?.timeLimit || 60) - recordTimer;
    setRecordingSeconds(secs);

    const finalize = () => {
      const mimeType = chunksRef.current[0]?.type || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      // Warn if transcript is very short
      const words = transcriptRef.current.trim().split(/\s+/).filter(Boolean);
      if (words.length < 15) setShortWarning(true);

      setPhase('review');
    };

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = finalize;
      recorderRef.current.stop();
    } else {
      finalize();
    }
  }, [elapsed, recordTimer, questionData, stopTracking]);

  // ── RETAKE ──────────────────────────────────────────────────────────────────
  const handleRetake = () => {
    setRetakeCount(c => c + 1);
    setReadTimer(questionData?.readTime || 30);
    setPhase('read');
  };

  // ── SUBMIT ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setUploadError('');
    setPhase('uploading');

    try {
      // Use the transcript already captured by Web Speech API
      const transcript = transcriptRef.current.trim().replace(/\s+/g, ' ');

      const res = await axios.post('/api/assessment/round3/evaluate-video', {
        transcript,
        duration: recordingSeconds,
        retakeNumber: retakeCount,
        stream: user.stream || '',
        videoRecorded: true,
      });

      setEvaluation(res.data);
      setPhase('result');
    } catch (err) {
      console.error('evaluate-video error:', err);
      setUploadError('Evaluation failed. Please try again.');
      setPhase('review');
    }
  };

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const retakesRemaining = MAX_RETAKES - retakeCount;
  const timeLimit = questionData?.timeLimit || 60;
  const readTime  = questionData?.readTime  || 30;

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Tab-switch warning banner */}
      <AnimatePresence>
        {tabWarning && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-danger/95 text-white px-6 py-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle size={16} /> ⚠️ Tab switching detected ({tabWarning}/3). Leave again to terminate.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* ── PHASE: permission ── */}
          {phase === 'permission' && (
            <motion.div key="permission" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-dark-card border border-dark-border rounded-2xl p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Video size={32} className="text-primary" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Video Question — Round 3</h2>
                <p className="text-text-secondary text-sm mb-6">Camera and microphone access is required to record your answer.</p>

                <div className="text-left space-y-2 mb-6">
                  {[
                    'Your video is only used for evaluation',
                    'Allow camera and microphone when browser prompts',
                    'Ensure good lighting and a quiet space',
                    'You have 2 retakes if unsatisfied',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle size={14} className="text-success mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>

                {permissionError && (
                  <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 rounded-xl p-3 mb-5 text-left">
                    <AlertCircle size={14} className="text-danger mt-0.5 shrink-0" />
                    <p className="text-danger text-sm">{permissionError}</p>
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={requestPermission}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                  <Mic size={16} /> Allow Camera &amp; Continue <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── PHASE: instructions ── */}
          {phase === 'instructions' && questionData && (
            <motion.div key="instructions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-dark-card border border-warning/20 rounded-2xl p-6 mb-4">
                <p className="text-xs text-warning font-semibold uppercase tracking-wider mb-2">Your Question</p>
                <p className="text-white text-base leading-relaxed font-medium">{questionData.question}</p>
              </div>

              <div className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-4">
                <p className="text-sm font-semibold text-white mb-3">Instructions</p>
                <ol className="space-y-2">
                  {questionData.instructions.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {ins}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-warning text-sm font-semibold mb-1">RETAKE POLICY</p>
                    <p className="text-text-secondary text-sm">You may retake this question up to 2 times. Watch your recording before submitting. Your <strong className="text-white">BEST score</strong> will be counted, not your last.</p>
                  </div>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setPhase('read')}
                className="w-full py-3.5 bg-gradient-to-r from-warning to-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                I'm Ready — Start Reading <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* ── PHASE: read ── */}
          {phase === 'read' && questionData && (
            <motion.div key="read" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary mb-4">
                <Clock size={11} /> Reading time — recording starts in {readTimer}s
              </div>

              <div className="bg-dark-card border border-warning/20 rounded-2xl p-6 mb-4">
                <p className="text-xs text-warning font-semibold uppercase tracking-wider mb-2">Your Question</p>
                <p className="text-white text-base leading-relaxed">{questionData.question}</p>
              </div>

              <div className="bg-dark-card border border-dark-border rounded-2xl p-6 text-center mb-4">
                <p className="text-text-secondary text-sm mb-3">Recording begins in</p>
                <div className="text-6xl font-black text-primary mb-4">{readTimer}</div>
                <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full"
                    animate={{ width: `${(readTimer / readTime) * 100}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-xl p-3 text-sm text-text-muted text-center">
                💡 Structure mentally: <span className="text-white">Introduction → AI tool → Real example → Impact</span>
              </div>
            </motion.div>
          )}

          {/* ── PHASE: record ── */}
          {phase === 'record' && (
            <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
                  <span className="text-danger text-sm font-bold">REC</span>
                  <span className="text-text-muted text-xs font-mono">
                    {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1.5 rounded-lg border ${
                  recordTimer <= 10 ? 'border-danger/40 bg-danger/10 text-danger' : 'border-dark-border text-text-secondary'
                }`}>
                  <Clock size={13} /> {recordTimer}s left
                </div>
              </div>

              {/* Camera feed — mirrored */}
              <div className="relative bg-black rounded-2xl overflow-hidden mb-3 aspect-video">
                <video ref={liveVideoRef} autoPlay muted playsInline
                  className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2 py-1 rounded-lg">
                  <Mic size={12} className="text-success" />
                  <span className="text-xs text-white">Live</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-dark-border rounded-full overflow-hidden mb-3">
                <motion.div className={`h-full rounded-full ${recordTimer <= 10 ? 'bg-danger' : 'bg-warning'}`}
                  animate={{ width: `${(recordTimer / timeLimit) * 100}%` }} transition={{ duration: 0.5 }} />
              </div>

              {/* Live transcript */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-4 min-h-[70px]">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Live Transcript</p>
                <p className="text-sm text-white leading-relaxed">
                  {finalTranscript}
                  {interimText && <span className="text-text-muted italic">{interimText}</span>}
                  {!finalTranscript && !interimText && (
                    <span className="text-text-muted italic">Speak now… your words will appear here</span>
                  )}
                </p>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={stopRecording}
                className="w-full py-3 bg-dark-card border border-danger/40 text-danger rounded-xl font-semibold text-sm hover:bg-danger/10 transition-all flex items-center justify-center gap-2">
                Stop &amp; Review <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* ── PHASE: review ── */}
          {phase === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h3 className="text-lg font-black text-white mb-4">Review Your Recording</h3>

              {/* Video playback */}
              <div className="bg-black rounded-2xl overflow-hidden mb-4 aspect-video">
                <video ref={reviewVideoRef} controls playsInline className="w-full h-full object-cover" />
              </div>

              {/* Transcript */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Captured Transcript</p>
                {shortWarning && (
                  <div className="flex items-start gap-2 bg-warning/10 border border-warning/20 rounded-lg p-2 mb-2">
                    <AlertTriangle size={13} className="text-warning mt-0.5 shrink-0" />
                    <p className="text-warning text-xs">We couldn't capture your speech clearly. Please retake or ensure your microphone is working.</p>
                  </div>
                )}
                <p className="text-sm text-text-secondary italic leading-relaxed">
                  {finalTranscript.trim() || 'No speech was captured.'}
                </p>
              </div>

              {/* Retakes badge */}
              <p className="text-xs text-text-muted text-center mb-3">Retakes remaining: <span className="text-white font-semibold">{retakesRemaining} of {MAX_RETAKES}</span></p>

              {/* Checklist */}
              <div className="bg-dark-card border border-dark-border rounded-2xl p-4 mb-5">
                <p className="text-sm font-semibold text-white mb-3">Ask yourself before deciding:</p>
                {[
                  'Did I mention a specific AI tool by name?',
                  'Did I give a real example of how I\'d use it?',
                  'Was I clear and structured?',
                  'Did I use most of the 60 seconds?',
                ].map((q, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-text-secondary mb-1.5">
                    <CheckCircle size={14} className="text-success mt-0.5 shrink-0" />
                    {q}
                  </div>
                ))}
                <p className="text-xs text-text-muted mt-3 italic">If NO to any → retake is recommended.</p>
              </div>

              {uploadError && (
                <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4">
                  <AlertCircle size={14} className="text-danger mt-0.5 shrink-0" />
                  <p className="text-danger text-sm">{uploadError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <motion.button whileHover={{ scale: retakesRemaining > 0 ? 1.02 : 1 }} whileTap={{ scale: retakesRemaining > 0 ? 0.98 : 1 }}
                  onClick={handleRetake} disabled={retakesRemaining === 0}
                  className={`py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all ${
                    retakesRemaining > 0
                      ? 'bg-dark-card border-dark-border text-white hover:bg-dark-hover'
                      : 'bg-dark-bg border-dark-border text-text-muted opacity-50 cursor-not-allowed'
                  }`}>
                  <RotateCcw size={14} /> Retake ({retakesRemaining} left)
                </motion.button>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                  Submit This Answer <ChevronRight size={14} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── PHASE: uploading ── */}
          {phase === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-lg font-bold text-white mb-2">Grok AI is evaluating your video answer…</h3>
              <p className="text-text-secondary text-sm">Analysing your transcript and delivery.</p>
              <p className="text-xs text-text-muted mt-1">This takes a few seconds.</p>
            </motion.div>
          )}

          {/* ── PHASE: result ── */}
          {phase === 'result' && evaluation && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Score hero */}
              <div className="text-center mb-6">
                <div className={`text-7xl font-black mb-2 ${evaluation.passed ? 'text-success' : 'text-warning'}`}>
                  <AnimatedScore target={evaluation.totalScore || 0} /><span className="text-3xl text-text-muted">/100</span>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${
                  evaluation.passed
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-danger/10 border-danger/30 text-danger'
                }`}>
                  {evaluation.passed ? <><CheckCircle size={14} /> Passed</> : <><AlertCircle size={14} /> Not Passed</>}
                </div>
              </div>

              {/* 4 dimension scores */}
              <div className="bg-dark-card border border-dark-border rounded-2xl p-5 mb-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-4">Score Breakdown</p>
                {[
                  { key: 'communicationClarity', label: 'Communication Clarity' },
                  { key: 'technicalAccuracy',    label: 'Technical Accuracy' },
                  { key: 'criticalThinking',     label: 'Critical Thinking' },
                  { key: 'confidenceDelivery',   label: 'Confidence & Delivery' },
                ].map(({ key, label }) => {
                  const s = evaluation[key]?.score || 0;
                  return (
                    <div key={key} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white">{label}</span>
                        <span className={`text-sm font-bold ${s >= 18 ? 'text-success' : s >= 12 ? 'text-warning' : 'text-danger'}`}>{s}/25</span>
                      </div>
                      <div className="h-1.5 bg-dark-border rounded-full overflow-hidden mb-1">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(s / 25) * 100}%` }} transition={{ duration: 0.6, delay: 0.1 }}
                          className={`h-full rounded-full ${s >= 18 ? 'bg-success' : s >= 12 ? 'bg-warning' : 'bg-danger'}`} />
                      </div>
                      <p className="text-xs text-text-muted leading-tight">{evaluation[key]?.feedback}</p>
                    </div>
                  );
                })}
              </div>

              {/* Strengths & improvements */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-dark-card border border-success/20 rounded-xl p-4">
                  <p className="text-xs text-success font-semibold uppercase tracking-wider mb-2">Strengths</p>
                  {(evaluation.strengths || []).map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-text-secondary mb-1">
                      <CheckCircle size={11} className="text-success mt-0.5 shrink-0" /> {s}
                    </div>
                  ))}
                </div>
                <div className="bg-dark-card border border-warning/20 rounded-xl p-4">
                  <p className="text-xs text-warning font-semibold uppercase tracking-wider mb-2">Improve</p>
                  {(evaluation.improvements || []).map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-text-secondary mb-1">
                      <Trophy size={11} className="text-warning mt-0.5 shrink-0" /> {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall feedback */}
              {evaluation.transcript && (
                <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-3">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Your Transcribed Answer</p>
                  <p className="text-sm text-text-secondary italic leading-relaxed">"{evaluation.transcript}"</p>
                </div>
              )}

              {evaluation.overallFeedback && (
                <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Overall Feedback</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{evaluation.overallFeedback}</p>
                </div>
              )}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => onComplete(evaluation)}
                className="w-full py-3.5 bg-gradient-to-r from-warning to-success text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                Continue to Round Results <ChevronRight size={16} />
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
