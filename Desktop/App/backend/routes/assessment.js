const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const AssessmentSession = require('../models/AssessmentSession');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// â”€â”€â”€ ROUND 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/assessment/round1/:stream â€” fetch 15 questions
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/assessment/round1/submit
router.post('/round1/submit', protect, async (req, res) => {
  try {
    const { answers, stream, tabSwitches, terminated } = req.body;
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
      student.badges.push('AI Foundations ðŸ…');
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
        ? `ðŸŽ‰ Passed! You scored ${correct}/15. Round 2 is now unlocked!`
        : `You scored ${correct}/15. Need 9 to pass. Try again tomorrow.`,
      weakTopics: graded.filter(g => !g.correct).map(g => qMap[g.questionId]?.topic).filter(Boolean)
    });
  } catch (error) {
    console.error('Round 1 submit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// â”€â”€â”€ ROUND 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/assessment/round2/question ??? dynamic adaptive
router.get('/round2/question', protect, async (req, res) => {
  try {
    const { stream, difficulty = 5, answered = '' } = req.query;
    const answeredIds = answered ? answered.split(',') : [];
    const diff = Math.min(Math.max(parseInt(difficulty, 10) || 5, 1), 10);
    const range = [Math.max(1, diff - 1), Math.min(10, diff + 1)];

    let questions = await Question.find({
      round: 2,
      stream: { $in: [stream, 'General'] },
      difficulty: { $gte: range[0], $lte: range[1] },
      _id: { $nin: answeredIds }
    }).lean();

    if (!questions.length) {
      questions = await Question.find({
        round: 2,
        _id: { $nin: answeredIds }
      }).lean();
    }

    if (!questions.length) {
      return res.json({ done: true });
    }

    const question = questions[Math.floor(Math.random() * questions.length)];
    const totalAvailable = await Question.countDocuments({
      round: 2,
      stream: { $in: [stream, 'General'] }
    });

    res.json({
      _id: question._id,
      question: question.question,
      options: question.options,
      difficulty: question.difficulty,
      topic: question.topic,
      totalAvailable
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/assessment/round2/answer ??? grade one answer and return next adaptive level
router.post('/round2/answer', protect, async (req, res) => {
  try {
    const { questionId, answer, currentDifficulty = 3 } = req.body;

    const question = await Question.findOne({ _id: questionId, round: 2 }).lean();
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const parsedDifficulty = Math.min(Math.max(parseInt(currentDifficulty, 10) || 3, 1), 10);
    const parsedAnswer = parseInt(answer, 10);
    const isCorrect = parsedAnswer === question.correct;
    const nextDifficulty = isCorrect
      ? Math.min(10, parsedDifficulty + 1)
      : Math.max(1, parsedDifficulty - 1);

    res.json({
      correct: isCorrect,
      nextDifficulty,
      gradedAnswer: {
        questionId: question._id.toString(),
        questionText: question.question,
        answer: parsedAnswer,
        correct: isCorrect,
        correctAnswer: question.correct,
        explanation: question.explanation,
        difficulty: question.difficulty,
        topic: question.topic
      }
    });
  } catch (error) {
    console.error('Round 2 answer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/assessment/round2/submit â€” submit entire round 2
router.post('/round2/submit', protect, async (req, res) => {
  try {
    const { answers, stream, tabSwitches, terminated, finalDifficulty } = req.body;

    if (terminated) {
      await AssessmentSession.create({
        studentId: req.user._id, round: 2, stream,
        tabSwitches: 3, terminated: true, completed: false, score: 0
      });
      return res.json({ terminated: true, message: 'Assessment terminated.' });
    }

    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const qMap = {};
    questions.forEach(q => { qMap[q._id.toString()] = q; });

    let weightedScore = 0;
    let totalWeight = 0;
    const graded = answers.map(a => {
      const q = qMap[a.questionId];
      if (!q) return { ...a, correct: false };
      const isCorrect = parseInt(a.answer) === q.correct;
      const weight = q.difficulty;
      if (isCorrect) weightedScore += weight;
      totalWeight += weight;
      return {
        questionId: a.questionId,
        questionText: q.question,
        answer: a.answer,
        correct: isCorrect,
        correctAnswer: q.correct,
        explanation: q.explanation,
        difficulty: q.difficulty
      };
    });

    const correct = graded.filter(g => g.correct).length;
    const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : Math.round((correct / answers.length) * 100);
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
      student.badges.push('Dynamic Thinker ðŸ§ ');
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
      score, correct, total: answers.length, passed,
      graded,
      message: passed
        ? `ðŸŽ‰ Passed Round 2 with ${score}/100! Round 3 unlocked!`
        : `You scored ${score}/100. Need 65 to pass.`
    });
  } catch (error) {
    console.error('Round 2 submit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// â”€â”€â”€ ROUND 3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ROUND3_SCENARIOS = {
  'DSA': [
    "You're a software engineer at a startup. Your team has a O(nÂ²) sorting algorithm causing timeout errors on large datasets. Write an AI prompt to help you optimize it and explain your reasoning.",
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
    const scenarios = ROUND3_SCENARIOS[stream] || ROUND3_SCENARIOS['AI/ML'];
    res.json({ scenarios });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/assessment/round3/evaluate
router.post('/round3/evaluate', protect, async (req, res) => {
  try {
    const { scenario, response, scenarioIndex, stream } = req.body;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a brutally honest, zero sugarcoating AI evaluator for CentaurIQ, India's AI proficiency platform.

A student is being assessed on their ability to use AI effectively in real work scenarios.

SCENARIO GIVEN TO STUDENT:
"${scenario}"

STUDENT'S RESPONSE:
"${response}"

Evaluate this response on 4 criteria, each out of 25 points (total 100):
1. Prompt Quality (clarity, specificity, context provided)
2. Thinking Approach (is the reasoning logical and structured?)
3. Practical Usability (would this actually work in a real workplace?)
4. AI Understanding (do they demonstrate genuine understanding of AI capabilities?)

Be HONEST. Not harsh but definitely not kind or sugarcoating.
Give specific examples from their response for each score.
No motivational fluff. Pure honest assessment.

Respond ONLY with valid JSON in this exact format:
{
  "promptQuality": { "score": 0-25, "feedback": "specific feedback here" },
  "thinkingApproach": { "score": 0-25, "feedback": "specific feedback here" },
  "practicalUsability": { "score": 0-25, "feedback": "specific feedback here" },
  "aiUnderstanding": { "score": 0-25, "feedback": "specific feedback here" },
  "totalScore": 0-100,
  "summary": "2-3 sentence honest overall assessment"
}`
      }]
    });

    let evaluation;
    try {
      const text = message.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      evaluation = {
        promptQuality: { score: 15, feedback: 'Response was partially evaluated.' },
        thinkingApproach: { score: 15, feedback: 'Some logical structure shown.' },
        practicalUsability: { score: 15, feedback: 'Partial practical value.' },
        aiUnderstanding: { score: 15, feedback: 'Basic AI understanding demonstrated.' },
        totalScore: 60,
        summary: 'Response evaluated with partial scoring due to format issues.'
      };
    }

    res.json({ evaluation, scenarioIndex });
  } catch (error) {
    console.error('Round 3 evaluate error:', error);
    res.status(500).json({ message: 'AI evaluation failed', error: error.message });
  }
});

// POST /api/assessment/round3/complete
router.post('/round3/complete', protect, async (req, res) => {
  try {
    const { scores, stream, tabSwitches, terminated } = req.body;
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
    if (passed && !student.roundsCompleted.includes(3)) {
      student.roundsCompleted.push(3);
      student.badges.push('AI Whisperer ðŸŽ¯');
      if (!student.roundsUnlocked.includes(4)) student.roundsUnlocked.push(4);
    }
    student.growthData.push({ date: new Date(), score, round: 3, label: 'Round 3' });
    const completedScores = [student.scores.round1, student.scores.round2, student.scores.round3, student.scores.round4].filter(s => s > 0);
    student.scores.overall = completedScores.length > 0
      ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
      : 0;
    await student.save();

    res.json({
      score, passed,
      message: passed
        ? `ðŸŽ¯ Round 3 cleared with ${score}/100! Round 4 is now unlocked!`
        : `You scored ${score}/100. Need 60 to pass.`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// â”€â”€â”€ ROUND 4 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/assessment/round4/evaluate
router.post('/round4/evaluate', protect, async (req, res) => {
  try {
    const { answers, stream, tabSwitches, terminated } = req.body;
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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a professional AI interviewer evaluating a ${stream} student's live interview performance on CentaurIQ.

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
  "totalScore": 0-100,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "overallFeedback": "3-4 sentence honest overall assessment",
  "certified": true/false (true if totalScore >= 70)
}`
      }]
    });

    let evaluation;
    try {
      const text = message.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : text);
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

    const score = evaluation.totalScore || 70;
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
      student.badges.push('CentaurIQ Certified ðŸ†');
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
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

