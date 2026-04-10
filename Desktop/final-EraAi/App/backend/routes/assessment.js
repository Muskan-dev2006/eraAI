const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const Question = require('../models/Question');
const AssessmentSession = require('../models/AssessmentSession');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const Groq = require('groq-sdk');
const SOURCE_QUESTIONS = require('../data/sourceQuestions');
const sendMentorEmail = require('../utils/sendMentorEmail');

// Multer setup for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/videos')),
  filename: (req, file, cb) => {
    const userId = req.user?._id || 'unknown';
    cb(null, `r3video_${userId}_${Date.now()}.webm`);
  }
});
const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) cb(null, true);
    else cb(new Error('Only video/audio files allowed'));
  }
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function groqGenerate(prompt) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return completion.choices[0].message.content;
}

// ─── TEMP: unlock all rounds for testing ────────────────────────────────────
router.post('/unlock-all', protect, async (req, res) => {
  await Student.findByIdAndUpdate(req.user._id, {
    roundsUnlocked: [1, 2, 3, 4],
    roundsCompleted: []
  });
  res.json({ message: 'All 4 rounds unlocked for testing.' });
});

// TEMP: test mentor email without completing Round 3
router.post('/test-mentor-email', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    await sendMentorEmail(student, student.stream || 'DSA', 75);
    res.json({ message: `Test email sent to ${student.email}` });
  } catch (err) {
    res.status(500).json({ message: 'Email failed', error: err.message });
  }
});

router.post('/reset-locks', protect, async (req, res) => {
  await Student.findByIdAndUpdate(req.user._id, {
    roundsUnlocked: [1],
    roundsCompleted: []
  });
  res.json({ message: 'Reset done. Only Round 1 is unlocked.' });
});

// ─── ROUND 1 ────────────────────────────────────────────────────────────────

// GET /api/assessment/round1/:stream — fetch 15 questions
router.get('/round1/:stream', protect, async (req, res) => {
  try {
    const { stream } = req.params;
    let questions = await Question.find({ round: 1, stream }).limit(15);
    if (questions.length < 15) {
      const general = await Question.find({ round: 1, stream: 'General' }).limit(15 - questions.length);
      questions = [...questions, ...general];
    }
    // Shuffle
    questions = questions.sort(() => Math.random() - 0.5).slice(0, 15);
    // Remove correct answer before sending
    const safe = questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty
    }));
    res.json(safe);
  } catch (error) {
     console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/assessment/round1/submit
router.post('/round1/submit', protect, async (req, res) => {
  try {
    const { answers, tabSwitches, terminated } = req.body;
    const stream = req.body.stream || req.user.stream || 'General';
    // answers: [{ questionId, answer }]

    if (terminated) {
      await AssessmentSession.create({
        studentId: req.user._id, round: 1, stream,
        tabSwitches: 3, terminated: true, completed: false, score: 0
      });
      return res.json({ terminated: true, message: 'Assessment terminated due to tab switching.' });
    }

    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const qMap = {};
    questions.forEach(q => { qMap[q._id.toString()] = q; });

    let correct = 0;
    const graded = answers.map(a => {
      const q = qMap[a.questionId];
      if (!q) return { ...a, correct: false, explanation: '' };
      const isCorrect = parseInt(a.answer) === q.correct;
      if (isCorrect) correct++;
      return {
        questionId: a.questionId,
        questionText: q.question,
        answer: a.answer,
        correct: isCorrect,
        correctAnswer: q.correct,
        explanation: q.explanation
      };
    });

    const score = Math.round((correct / 15) * 100);
    const passed = correct >= 9;

    const session = await AssessmentSession.create({
      studentId: req.user._id, round: 1, stream,
      answers: graded, tabSwitches: tabSwitches || 0,
      completed: true, terminated: false,
      score, maxScore: 100, passed
    });

    // Update student
    const student = await Student.findById(req.user._id);
    student.scores.round1 = Math.max(student.scores.round1, score);
    if (passed && !student.roundsCompleted.includes(1)) {
      student.roundsCompleted.push(1);
      student.badges.push('AI Foundations');
      if (!student.roundsUnlocked.includes(2)) student.roundsUnlocked.push(2);
    }
    student.growthData.push({ date: new Date(), score, round: 1, label: 'Round 1' });
    student.scores.overall = Math.round(
      (student.scores.round1 + student.scores.round2 + student.scores.round3 + student.scores.round4) /
      Math.max(student.roundsCompleted.length || 1, 1)
    );
    await student.save();

    res.json({
      score, correct, total: 15, passed,
      graded, sessionId: session._id,
      message: passed
        ? `Passed! You scored ${correct}/15. Round 2 is now unlocked!`
        : `You scored ${correct}/15. Need 9 to pass.`,
      weakTopics: graded.filter(g => !g.correct).map(g => qMap[g.questionId]?.topic).filter(Boolean)
    });
  } catch (error) {
    console.error('Round 1 submit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── ROUND 2 ────────────────────────────────────────────────────────────────

// GET /api/assessment/round2/question — Gemini-generated, GFG/Sanfoundry style
router.get('/round2/question', protect, async (req, res) => {
  try {
    const { stream, difficulty = 5, answered = '' } = req.query;
    const diff = Math.min(Math.max(parseInt(difficulty), 1), 10);
    const usedTopics = answered ? answered.split(',').filter(Boolean) : [];

    const sourcePool = SOURCE_QUESTIONS[stream] || SOURCE_QUESTIONS['DSA'];
    const examples = [...sourcePool].sort(() => Math.random() - 0.5).slice(0, 3);

    const STREAM_TOPICS = {
      'DSA': 'Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting Algorithms, Searching, Dynamic Programming, Heaps, Hashing, Recursion',
      'AI/ML': 'Neural Networks, Supervised Learning, Unsupervised Learning, Model Evaluation, Regularization, Deep Learning, Feature Engineering, NLP, Clustering, Dimensionality Reduction, Gradient Descent',
      'Web Dev': 'JavaScript, React, Node.js, HTML, CSS, HTTP/REST, Authentication/JWT, Browser APIs, Security, MongoDB/SQL',
      'CS Fundamentals': 'Operating Systems (scheduling, paging, deadlock, memory management, process vs thread), DBMS (normalization, indexing, SQL queries, ACID, transactions), Computer Networks (OSI model, TCP/UDP, IP addressing, DNS, routing protocols), Linux (shell commands, file permissions, process management, grep/awk/sed)'
    };

    const allowedTopics = STREAM_TOPICS[stream] || STREAM_TOPICS['DSA'];

    const prompt = `You are a strict technical MCQ question generator for a student assessment platform.

STREAM: ${stream}
ALLOWED TOPICS (you MUST pick from these ONLY): ${allowedTopics}

CRITICAL RULES:
- Generate questions ONLY about the allowed topics listed above
- For CS Fundamentals: questions must be from OS, DBMS, Computer Networks, or Linux — NEVER from DSA, Python, or algorithms
- For DSA: questions must be from data structures and algorithms — NEVER from OS or networking
- Use the style of GeeksforGeeks/Sanfoundry: specific, tricky, with plausible distractors
- Be specific, not vague

Difficulty: ${diff}/10 (1=beginner, 10=expert)
${usedTopics.length ? `Do NOT repeat these already-covered topics: ${usedTopics.join(', ')}` : ''}

Here are example questions showing the correct style and topic scope for this stream:
${JSON.stringify(examples, null, 2)}

Generate ONE new original question strictly within the allowed topics above. Do NOT duplicate examples.

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "question": "question text here",
  "options": ["option A", "option B", "option C", "option D"],
  "correct": 0,
  "explanation": "why this answer is correct",
  "topic": "topic name",
  "difficulty": ${diff}
}`;

    const text = await groqGenerate(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON in Gemini response');
    const question = JSON.parse(jsonMatch[0]);

    // Cache correct answer server-side — client never sees it
    if (!req.app.locals.round2Cache) req.app.locals.round2Cache = {};
    const cacheKey = `${req.user._id}_${Date.now()}`;
    req.app.locals.round2Cache[cacheKey] = {
      correct: question.correct,
      explanation: question.explanation || '',
      topic: question.topic || '',
      difficulty: question.difficulty || diff,
      questionText: question.question
    };

    res.json({
      _id: cacheKey,
      question: question.question,
      options: question.options,
      difficulty: question.difficulty || diff,
      topic: question.topic || ''
    });
  } catch (error) {
    console.error('Gemini round2 question error:', error);
    res.status(500).json({ message: 'Failed to generate question. Please try again.' });
  }
});

// POST /api/assessment/round2/check — grade against server-cached Gemini answer
router.post('/round2/check', protect, async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const cache = req.app.locals.round2Cache || {};
    const cached = cache[questionId];

    if (!cached) {
      return res.status(400).json({ message: 'Question expired or not found. Please refresh.' });
    }

    const isCorrect = parseInt(answer) === cached.correct;

    // Move to graded store so submit can use it
    if (!req.app.locals.round2Graded) req.app.locals.round2Graded = {};
    if (!req.app.locals.round2Graded[req.user._id.toString()]) {
      req.app.locals.round2Graded[req.user._id.toString()] = [];
    }
    req.app.locals.round2Graded[req.user._id.toString()].push({
      questionId,
      questionText: cached.questionText,
      answer: parseInt(answer),
      correct: isCorrect,
      correctAnswer: cached.correct,
      explanation: cached.explanation,
      difficulty: cached.difficulty,
      topic: cached.topic
    });

    // Remove from pending cache
    delete req.app.locals.round2Cache[questionId];

    res.json({ isCorrect });
  } catch (error) {
    console.error('Round 2 check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/assessment/round2/submit — submit entire round 2
router.post('/round2/submit', protect, async (req, res) => {
  try {
    const { tabSwitches, terminated, finalDifficulty } = req.body;
    const stream = req.body.stream || req.user.stream || 'General';

    if (terminated) {
      await AssessmentSession.create({
        studentId: req.user._id, round: 2, stream,
        tabSwitches: 3, terminated: true, completed: false, score: 0
      });
      return res.json({ terminated: true, message: 'Assessment terminated.' });
    }

    // Use graded answers accumulated during round2/check calls
    const studentId = req.user._id.toString();
    const graded = (req.app.locals.round2Graded || {})[studentId] || [];

    // Clean up graded store for this student
    if (req.app.locals.round2Graded) {
      delete req.app.locals.round2Graded[studentId];
    }

    let weightedScore = 0;
    let totalWeight = 0;
    graded.forEach(a => {
      const weight = a.difficulty || 5;
      if (a.correct) weightedScore += weight;
      totalWeight += weight;
    });

    const correct = graded.filter(g => g.correct).length;
    const score = totalWeight > 0
      ? Math.round((weightedScore / totalWeight) * 100)
      : graded.length > 0 ? Math.round((correct / graded.length) * 100) : 0;
    const passed = score >= 65;

    await AssessmentSession.create({
      studentId: req.user._id, round: 2, stream,
      answers: graded, tabSwitches: tabSwitches || 0,
      completed: true, terminated: false,
      score, maxScore: 100, passed,
      currentDifficulty: finalDifficulty || 5
    });

    const student = await Student.findById(req.user._id);
    student.scores.round2 = Math.max(student.scores.round2, score);
    if (passed && !student.roundsCompleted.includes(2)) {
      student.roundsCompleted.push(2);
      student.badges.push('Dynamic Thinker');
      if (!student.roundsUnlocked.includes(3)) student.roundsUnlocked.push(3);
    }
    student.growthData.push({ date: new Date(), score, round: 2, label: 'Round 2' });
    student.scores.overall = Math.round(
      [student.scores.round1, student.scores.round2, student.scores.round3, student.scores.round4]
        .filter(s => s > 0).reduce((a, b) => a + b, 0) /
      Math.max([student.scores.round1, student.scores.round2, student.scores.round3, student.scores.round4].filter(s => s > 0).length, 1)
    );
    await student.save();

    res.json({
      score, correct, total: graded.length, passed,
      graded,
      message: passed
        ? `Passed Round 2 with ${score}/100! Round 3 unlocked!`
        : `You scored ${score}/100. Need 65 to pass.`
    });
  } catch (error) {
    console.error('Round 2 submit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── ROUND 3 ────────────────────────────────────────────────────────────────

const ROUND3_SCENARIOS = {
  'DSA': [
    "You're a software engineer at a startup. Your team has a O(n²) sorting algorithm causing timeout errors on large datasets. Write an AI prompt to help you optimize it and explain your reasoning.",
    "A recruiter wants you to solve a graph traversal problem in an interview. Write an AI prompt to help you practice this and explain your learning approach.",
    "You need to implement a LRU Cache for a high-traffic API. Write the AI prompt you'd use and explain your design thinking.",
    "Your binary search tree is becoming unbalanced with large inputs. Write a prompt to get AI help and explain how you'd approach the solution.",
    "You need to explain dynamic programming to a junior dev on your team. Write an AI prompt to generate teaching material and explain why."
  ],
  'AI/ML': [
    "You are a data analyst. Your manager wants insights from 10,000 rows of sales data by end of day. Write the AI prompt you would use and explain your approach.",
    "Your ML model has 95% training accuracy but only 62% on test data. Write an AI prompt to diagnose the issue and explain what you suspect.",
    "You need to build a sentiment analysis tool for customer reviews with no labeled data. Write your AI prompt and explain your strategy.",
    "Your client wants to predict customer churn using historical data. Write the AI prompt to start this project and explain your pipeline.",
    "An AI model in your company is showing bias against certain demographics. Write a prompt to investigate this and explain your ethical approach."
  ],
  'Web Dev': [
    "Your React app is rendering slowly with a 1000-item list. Write an AI prompt to optimize it and explain your performance approach.",
    "A client wants a real-time chat feature in their Node.js app. Write your AI prompt and explain the architecture you'd use.",
    "Your REST API is getting 500 errors randomly in production. Write an AI prompt to debug it and explain your debugging process.",
    "You need to make a web app accessible for screen readers. Write an AI prompt to audit it and explain your accessibility strategy.",
    "A new microservices architecture needs to be designed for an e-commerce platform. Write your prompt and explain the design decisions."
  ],
  'CS Fundamentals': [
    "Your database queries are taking 8 seconds on a table with 1 million rows. Write an AI prompt to optimize it and explain your approach.",
    "You need to explain the difference between TCP and UDP to a non-technical client. Write an AI prompt to help you prepare and explain why.",
    "A deadlock is occurring in your multi-threaded application. Write the AI prompt to debug it and explain your concurrency understanding.",
    "You need to design the OS scheduling algorithm for a real-time system. Write your AI prompt and explain your design rationale.",
    "A SQL injection vulnerability was found in the codebase. Write an AI prompt to audit and fix it, explaining your security approach."
  ]
};

// GET /api/assessment/round3/scenarios
router.get('/round3/scenarios', protect, async (req, res) => {
  try {
    const { stream } = req.query;
    const all = ROUND3_SCENARIOS[stream] || ROUND3_SCENARIOS['AI/ML'];
    const shuffled = all.sort(() => Math.random() - 0.5);
    const scenarios = shuffled.slice(0, 2);
    res.json({ scenarios });
  } catch (error) {
     console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/assessment/round3/evaluate
router.post('/round3/evaluate', protect, async (req, res) => {
  try {
    const { scenario, response, scenarioIndex, stream } = req.body;

    const rawText = await groqGenerate(`You are a fair and accurate AI skills evaluator for eraAI, India's AI proficiency platform.

A student is being assessed on their ability to use AI effectively in real work scenarios.

SCENARIO GIVEN TO STUDENT:
"${scenario}"

STUDENT'S RESPONSE:
"${response}"

Evaluate this response on 4 criteria, each scored 0-25 (total 100):
1. Prompt Quality: Is the AI prompt clear, specific, and does it include enough context to get a useful response?
2. Thinking Approach: Is the reasoning logical, structured, and does it show understanding of the problem?
3. Practical Usability: Would this prompt and approach actually work in a real workplace?
4. AI Understanding: Do they show genuine understanding of what AI can and cannot do?

Scoring rubric for each criterion:
- 20-25: Excellent — clear, specific, demonstrates strong understanding
- 15-19: Good — solid with minor gaps
- 10-14: Average — partially meets expectations, some gaps
- 5-9: Below average — significant gaps but shows some understanding
- 0-4: Poor — does not demonstrate the skill

Be accurate and fair. Reference specific parts of their response in feedback. Do not inflate or deflate scores — reward genuine effort and penalise vague or off-topic responses proportionally.

Respond ONLY with valid JSON in this exact format:
{
  "promptQuality": { "score": <number 0-25>, "feedback": "specific feedback referencing their response" },
  "thinkingApproach": { "score": <number 0-25>, "feedback": "specific feedback referencing their response" },
  "practicalUsability": { "score": <number 0-25>, "feedback": "specific feedback referencing their response" },
  "aiUnderstanding": { "score": <number 0-25>, "feedback": "specific feedback referencing their response" },
  "summary": "2-3 sentence overall assessment"
}`);

    let evaluation;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      evaluation = {
        promptQuality: { score: 15, feedback: 'Response was partially evaluated.' },
        thinkingApproach: { score: 15, feedback: 'Some logical structure shown.' },
        practicalUsability: { score: 15, feedback: 'Partial practical value.' },
        aiUnderstanding: { score: 15, feedback: 'Basic AI understanding demonstrated.' },
        summary: 'Response evaluated with partial scoring due to format issues.'
      };
    }

    // Always compute totalScore server-side from the 4 criteria to avoid Claude miscalculating
    evaluation.totalScore =
      (evaluation.promptQuality?.score || 0) +
      (evaluation.thinkingApproach?.score || 0) +
      (evaluation.practicalUsability?.score || 0) +
      (evaluation.aiUnderstanding?.score || 0);

    res.json({ evaluation, scenarioIndex });
  } catch (error) {
    console.error('Round 3 evaluate error:', error);
    res.status(500).json({ message: 'AI evaluation failed', error: error.message });
  }
});

// POST /api/assessment/round3/complete
router.post('/round3/complete', protect, async (req, res) => {
  try {
    const { scores, tabSwitches, terminated } = req.body;
    const stream = req.body.stream || req.user.stream || 'General';
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const score = Math.round(avg);
    const passed = score >= 60;

    await AssessmentSession.create({
      studentId: req.user._id, round: 3, stream,
      tabSwitches: tabSwitches || 0, terminated: terminated || false,
      completed: !terminated, score, maxScore: 100, passed
    });

    const student = await Student.findById(req.user._id);
    student.scores.round3 = Math.max(student.scores.round3, score);
    const firstTimePass = passed && !student.roundsCompleted.includes(3);
    if (firstTimePass) {
      student.roundsCompleted.push(3);
      student.badges.push('AI Whisperer');
      if (!student.roundsUnlocked.includes(4)) student.roundsUnlocked.push(4);
      // Boost rating on first-time Round 3 pass
      student.streak = (student.streak || 0) + 5;
    }
    student.growthData.push({ date: new Date(), score, round: 3, label: 'Round 3' });
    const completedScores = [student.scores.round1, student.scores.round2, student.scores.round3, student.scores.round4].filter(s => s > 0);
    student.scores.overall = completedScores.length > 0
      ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
      : 0;
    await student.save();

    // Send mentor email on first-time pass (non-blocking)
    if (firstTimePass) {
      sendMentorEmail(student, stream, score)
        .then(() => console.log(`Mentor email sent to ${student.email}`))
        .catch(err => console.error('Mentor email failed:', err.message));
    }

    res.json({
      score, passed,
      mentorEmailSent: firstTimePass,
      message: passed
        ? `Round 3 cleared with ${score}/100! Round 4 is now unlocked! Check your email for your mentor session details. 📧`
        : `You scored ${score}/100. Need 60 to pass.`
    });
  } catch (error) {
     console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ROUND 3 VIDEO QUESTION ──────────────────────────────────────────────────

const OpenAI = require('openai');
const xaiClient = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1',
});

async function xaiEvaluate(prompt) {
  // Fallback to groq if XAI key not set
  if (!process.env.XAI_API_KEY || process.env.XAI_API_KEY.startsWith('xai-placeholder')) {
    return groqGenerate(prompt);
  }
  const completion = await xaiClient.chat.completions.create({
    model: 'grok-3-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1024,
  });
  return completion.choices[0].message.content;
}

// GET /api/assessment/round3/video-question
router.get('/round3/video-question', protect, async (req, res) => {
  try {
    const stream = req.query.stream || req.user.stream || 'General';
    res.json({
      question: `Introduce yourself and explain how you would use AI tools in your day-to-day work as a ${stream} professional.`,
      instructions: [
        'Speak clearly and look directly at the camera',
        'Mention at least one specific AI tool by name',
        'Give a real-world example of how it helps you',
        'Structure your answer: Introduction → AI tool → Real example → Impact',
        'You have 30 seconds to read and 60 seconds to record',
      ],
      timeLimit: 60,
      readTime: 30,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/assessment/round3/evaluate-video
// Accepts multipart: video blob + metadata fields
// Transcribes with Groq Whisper, then evaluates with LLM
const fs = require('fs');
router.post('/round3/evaluate-video', protect, async (req, res) => {
  try {
    const { transcript: rawTranscript, duration, retakeNumber, stream, videoRecorded } = req.body;
    const studentStream = stream || req.user.stream || 'General';
    const transcript = (rawTranscript || '').trim();

    const prompt = `You are a strict but fair professional interviewer evaluating a ${studentStream} student's video response for eraAI, India's AI proficiency assessment platform.

QUESTION GIVEN TO STUDENT:
Introduce yourself and explain how you would use AI tools in your day-to-day work as a ${studentStream} professional.

STUDENT'S SPOKEN TRANSCRIPT:
${transcript || '[No transcript captured]'}

VIDEO QUALITY INDICATORS:
- Video captured: ${videoRecorded}
- Retake number: ${retakeNumber || 0} of 2
- Recording duration: ${duration || 0} seconds

EVALUATION RULES:
- If transcript is empty, under 20 words, or just filler words → score everything 0-5 maximum
- If student did not mention any specific AI tool → cap technicalAccuracy at 10/25
- If student gave only a generic answer with no real-world example → cap criticalThinking at 12/25
- Be HONEST. A weak answer must get a weak score. No sugarcoating.

SCORE ON 4 DIMENSIONS (0-25 each):
1. communicationClarity — clear, structured, no excessive filler words
2. technicalAccuracy — named a specific real AI tool, accurate and relevant to their stream
3. criticalThinking — explained WHY the tool helps with a real-world example
4. confidenceDelivery — sounded confident and professional, prepared

Respond ONLY with valid JSON:
{
  "communicationClarity": { "score": 0-25, "feedback": "specific feedback referencing what they actually said" },
  "technicalAccuracy": { "score": 0-25, "feedback": "specific feedback" },
  "criticalThinking": { "score": 0-25, "feedback": "specific feedback" },
  "confidenceDelivery": { "score": 0-25, "feedback": "specific feedback" },
  "totalScore": 0-100,
  "strengths": ["one genuine strength", "another if applicable"],
  "improvements": ["most important thing to fix", "second thing if applicable"],
  "overallFeedback": "3 sentence honest summary. First: what they did well. Second: biggest weakness. Third: one actionable tip.",
  "passed": true or false
}`;

    const rawText = await xaiEvaluate(prompt);

    let evaluation;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      evaluation = {
        communicationClarity: { score: 10, feedback: 'Could not fully parse evaluation.' },
        technicalAccuracy: { score: 10, feedback: 'Could not fully parse evaluation.' },
        criticalThinking: { score: 10, feedback: 'Could not fully parse evaluation.' },
        confidenceDelivery: { score: 10, feedback: 'Could not fully parse evaluation.' },
        totalScore: 40,
        strengths: ['Attempted the question'],
        improvements: ['Provide more specific details'],
        overallFeedback: 'Evaluation was partially processed. Please ensure your answer is clear and specific.',
        passed: false,
      };
    }

    // Always recompute totalScore from components to prevent LLM errors
    const computed =
      (evaluation.communicationClarity?.score || 0) +
      (evaluation.technicalAccuracy?.score || 0) +
      (evaluation.criticalThinking?.score || 0) +
      (evaluation.confidenceDelivery?.score || 0);
    evaluation.totalScore = computed;
    evaluation.passed = computed >= 60;
    evaluation.transcript = transcript;

    res.json(evaluation);
  } catch (error) {
    console.error('evaluate-video error:', error);
    res.status(500).json({ message: 'Evaluation failed', error: error.message });
  }
});

// ─── MENTOR SESSION COMPLETE ────────────────────────────────────────────────

router.post('/mentor-session/complete', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student.roundsCompleted.includes(3)) {
      return res.status(400).json({ message: 'Round 3 not completed yet.' });
    }
    if (!student.badges.includes('eraAI Certified')) {
      student.badges.push('eraAI Certified');
    }
    if (!student.roundsCompleted.includes(4)) {
      student.roundsCompleted.push(4); // use 4 as mentor session marker
    }
    await student.save();
    res.json({ message: 'Certified!', badges: student.badges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ROUND 4 REMOVED — replaced by Mentor Session ───────────────────────────

const INTERVIEW_QUESTIONS = {
  'DSA': [
    "Explain the difference between a stack and a queue, and give a real-world use case for each.",
    "What is the time complexity of QuickSort in the best, average, and worst case? Why?",
    "How does a hash table work, and what happens during a collision?",
    "You're given an unsorted array. Walk me through how you'd find the kth largest element efficiently.",
    "What is memoization and how does it differ from tabulation in dynamic programming?",
    "Explain graph BFS vs DFS and when you'd use each.",
    "What is a balanced BST and why does balance matter for performance?",
    "If an AI gives you wrong pseudocode in an interview prep session, how do you handle it?",
    "Should AI tools be used during live coding interviews? What are the ethical implications?",
    "Where do you think AI will change software engineering most in the next 3 years?"
  ],
  'AI/ML': [
    "Explain the concept of overfitting in simple terms and how you prevent it.",
    "What is the difference between supervised and unsupervised learning?",
    "How do transformer models work at a high level?",
    "You trained a model with 98% accuracy but it fails in production. What went wrong?",
    "What is gradient descent and why is learning rate important?",
    "Explain bias-variance tradeoff with an example.",
    "How would you handle a highly imbalanced dataset in a classification problem?",
    "If an AI gives incorrect predictions on critical medical data, what steps do you take?",
    "Should AI be used in hiring decisions without human oversight? Defend your position.",
    "What does responsible AI mean to you personally?"
  ],
  'Web Dev': [
    "Explain the event loop in JavaScript with an example.",
    "What is the difference between REST and GraphQL APIs?",
    "How does React's virtual DOM improve performance?",
    "Explain the concept of CORS and why it exists.",
    "What are WebSockets and when would you use them over HTTP?",
    "How would you optimize a slow-loading React application?",
    "What is the difference between authentication and authorization?",
    "If an AI-generated component has an XSS vulnerability, how do you catch it in code review?",
    "Should web developers trust AI-generated code without review? Why or why not?",
    "How do you see AI changing the role of frontend developers in 5 years?"
  ],
  'CS Fundamentals': [
    "Explain the difference between a process and a thread.",
    "What is a deadlock? How can you prevent it?",
    "Explain TCP's three-way handshake.",
    "What is database normalization and why is it important?",
    "What is the difference between a primary key and a foreign key?",
    "Explain virtual memory and why operating systems use it.",
    "What is an index in a database and when would adding one hurt performance?",
    "If an AI suggests disabling ACID properties for performance, how do you evaluate that advice?",
    "Should AI be used to auto-generate SQL queries in production? What are the risks?",
    "What CS concept do you find most fascinating and why?"
  ]
};

// GET /api/assessment/round4/question
router.get('/round4/question', protect, async (req, res) => {
  try {
    const { stream, index = 0 } = req.query;
    const questions = INTERVIEW_QUESTIONS[stream] || INTERVIEW_QUESTIONS['AI/ML'];
    const idx = parseInt(index);
    if (idx >= questions.length) {
      return res.json({ done: true });
    }
    res.json({
      question: questions[idx],
      index: idx,
      total: questions.length
    });
  } catch (error) {
     console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/assessment/round4/evaluate
router.post('/round4/evaluate', protect, async (req, res) => {
  try {
    const { answers, tabSwitches, terminated } = req.body;
    const stream = req.body.stream || req.user.stream || 'General';
    // answers: [{ question, answer, timeTaken }]

    if (terminated) {
      await AssessmentSession.create({
        studentId: req.user._id, round: 4, stream,
        tabSwitches: 3, terminated: true, completed: false, score: 0
      });
      return res.json({ terminated: true, message: 'Assessment terminated.' });
    }

    const answersText = answers.map((a, i) =>
      `Q${i + 1}: ${a.question}\nAnswer: ${a.answer || '[No answer given]'}`
    ).join('\n\n');

    const rawText = await groqGenerate(`You are a professional AI interviewer evaluating a ${stream} student's live interview performance on eraAI.

Stream: ${stream}
Interview Q&A:
${answersText}

Evaluate the COMPLETE interview performance on 4 dimensions, each out of 25 points:
1. Communication Clarity (were answers clear, structured, concise?)
2. Technical Accuracy (were the technical facts correct?)
3. Critical Thinking (did they show deeper reasoning beyond surface answers?)
4. AI Understanding (do they understand AI's role in their field?)

Be honest and direct. No sugarcoating. Identify strengths AND specific weaknesses.
For each weak answer, name which question and why it was weak.

Respond ONLY with valid JSON:
{
  "communicationClarity": { "score": 0-25, "feedback": "specific detailed feedback" },
  "technicalAccuracy": { "score": 0-25, "feedback": "specific detailed feedback" },
  "criticalThinking": { "score": 0-25, "feedback": "specific detailed feedback" },
  "aiUnderstanding": { "score": 0-25, "feedback": "specific detailed feedback" },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "overallFeedback": "3-4 sentence honest overall assessment"
}`);

    let evaluation;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      evaluation = {
        communicationClarity: { score: 18, feedback: 'Communication was evaluated.' },
        technicalAccuracy: { score: 18, feedback: 'Technical knowledge assessed.' },
        criticalThinking: { score: 17, feedback: 'Reasoning evaluated.' },
        aiUnderstanding: { score: 17, feedback: 'AI understanding assessed.' },
        totalScore: 70,
        strengths: ['Completed the interview'],
        improvements: ['Practice more specific technical answers'],
        overallFeedback: 'Interview completed and evaluated.',
        certified: true
      };
    }

    evaluation.totalScore =
      (evaluation.communicationClarity?.score || 0) +
      (evaluation.technicalAccuracy?.score || 0) +
      (evaluation.criticalThinking?.score || 0) +
      (evaluation.aiUnderstanding?.score || 0);
    evaluation.certified = evaluation.totalScore >= 70;

    const score = evaluation.totalScore;
    const passed = score >= 70;

    await AssessmentSession.create({
      studentId: req.user._id, round: 4, stream,
      answers: answers.map(a => ({ questionText: a.question, answer: a.answer })),
      tabSwitches: tabSwitches || 0, completed: true, terminated: false,
      score, maxScore: 100, passed, aiFeedback: evaluation.overallFeedback
    });

    const student = await Student.findById(req.user._id);
    student.scores.round4 = Math.max(student.scores.round4, score);
    if (passed && !student.roundsCompleted.includes(4)) {
      student.roundsCompleted.push(4);
      student.badges.push('eraAI Certified');
    }
    student.growthData.push({ date: new Date(), score, round: 4, label: 'Round 4' });
    const completedScores = [student.scores.round1, student.scores.round2, student.scores.round3, student.scores.round4].filter(s => s > 0);
    student.scores.overall = completedScores.length > 0
      ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
      : 0;
    await student.save();

    res.json({ evaluation, score, passed });
  } catch (error) {
    console.error('Round 4 evaluate error:', error);
    res.status(500).json({ message: 'AI evaluation failed', error: error.message });
  }
});

// GET /api/assessment/results/:studentId
router.get('/results/:studentId', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const sessions = await AssessmentSession.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 }).limit(20);
    res.json({ student, sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
