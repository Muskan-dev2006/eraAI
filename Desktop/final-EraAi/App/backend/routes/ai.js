const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { protect } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/ai/generate-question — dynamically generate MCQ
router.post('/generate-question', protect, async (req, res) => {
  try {
    const { stream, difficulty, round, excludeTopics = [] } = req.body;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Generate a single multiple choice question for a ${stream} student assessment.
Difficulty: ${difficulty}/10 (1=basic, 10=expert)
Round: ${round}
Topic exclusions: ${excludeTopics.join(', ')}

Requirements:
- Question must be specific to ${stream}
- Must have exactly 4 options labeled 0-3
- One correct answer
- Brief but educational explanation

Respond ONLY with valid JSON:
{
  "question": "question text here",
  "options": ["option A", "option B", "option C", "option D"],
  "correct": 0,
  "explanation": "why this is correct",
  "topic": "topic name"
}`
      }]
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const question = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    res.json(question);
  } catch (error) {
    console.error('Generate question error:', error);
    res.status(500).json({ message: 'Failed to generate question' });
  }
});

// POST /api/ai/evaluate-prompt
router.post('/evaluate-prompt', protect, async (req, res) => {
  try {
    const { scenario, response } = req.body;
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Evaluate this AI prompt written by a student for a real work scenario.

Scenario: "${scenario}"
Student Response: "${response}"

Score on 4 criteria (each 0-25). Be honest, specific, no sugarcoating.

JSON format:
{
  "promptQuality": { "score": number, "feedback": "string" },
  "thinkingApproach": { "score": number, "feedback": "string" },
  "practicalUsability": { "score": number, "feedback": "string" },
  "aiUnderstanding": { "score": number, "feedback": "string" },
  "totalScore": number,
  "summary": "string"
}`
      }]
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Evaluation failed' });
  }
});

// POST /api/ai/interview-evaluate
router.post('/interview-evaluate', protect, async (req, res) => {
  try {
    const { answers, stream } = req.body;
    const answersText = answers.map((a, i) =>
      `Q${i + 1}: ${a.question}\nA: ${a.answer}`
    ).join('\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Evaluate this ${stream} student's interview. Score each dimension 0-25.

${answersText}

JSON:
{
  "communicationClarity": { "score": number, "feedback": "string" },
  "technicalAccuracy": { "score": number, "feedback": "string" },
  "criticalThinking": { "score": number, "feedback": "string" },
  "aiUnderstanding": { "score": number, "feedback": "string" },
  "totalScore": number,
  "strengths": ["string"],
  "improvements": ["string"],
  "overallFeedback": "string",
  "certified": boolean
}`
      }]
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    res.json(evaluation);
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Interview evaluation failed' });
  }
});

module.exports = router;
