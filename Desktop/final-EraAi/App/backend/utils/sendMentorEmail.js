const nodemailer = require('nodemailer');
const MENTORS = require('../data/mentors.js');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function pickMentor(stream) {
  const pool = MENTORS[stream] || MENTORS['CS Fundamentals'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildEmailHTML(studentName, stream, score, mentor) {
  const slotsHTML = mentor.slots.map(s =>
    `<tr>
      <td style="padding:8px 16px;border-bottom:1px solid #2a2a3a;color:#a0a0b0;">${s.day}</td>
      <td style="padding:8px 16px;border-bottom:1px solid #2a2a3a;color:#ffffff;font-weight:600;">${s.time}</td>
    </tr>`
  ).join('');

  const expertiseHTML = mentor.expertise.map(e =>
    `<span style="display:inline-block;background:#1e1e2e;border:1px solid #3a3a5a;color:#7c6cfc;padding:4px 10px;border-radius:20px;font-size:12px;margin:3px;">${e}</span>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#7c6cfc,#5eead4);padding:2px;border-radius:16px;">
        <div style="background:#0a0a12;border-radius:14px;padding:16px 32px;">
          <h1 style="margin:0;font-size:24px;font-weight:900;background:linear-gradient(135deg,#7c6cfc,#5eead4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">eraAI</h1>
        </div>
      </div>
    </div>

    <!-- Congratulations Banner -->
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #7c6cfc40;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:12px;">🎉</div>
      <h2 style="margin:0 0 8px;color:#ffffff;font-size:22px;font-weight:800;">Congratulations, ${studentName}!</h2>
      <p style="margin:0 0 16px;color:#a0a0b0;font-size:15px;">You cleared <strong style="color:#5eead4;">Round 3 — AI Prompt Challenge</strong> with a score of</p>
      <div style="display:inline-block;background:linear-gradient(135deg,#7c6cfc,#5eead4);border-radius:50%;width:72px;height:72px;line-height:72px;font-size:22px;font-weight:900;color:#ffffff;margin-bottom:16px;">${score}</div>
      <p style="margin:0;color:#7c6cfc;font-size:14px;font-weight:600;">🏅 Badge Earned: AI Whisperer</p>
    </div>

    <!-- What's Next -->
    <div style="background:#111120;border:1px solid #2a2a3a;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <h3 style="margin:0 0 8px;color:#5eead4;font-size:16px;">🚀 What happens next?</h3>
      <p style="margin:0;color:#a0a0b0;font-size:14px;line-height:1.6;">
        Your performance has unlocked a <strong style="color:#ffffff;">1-on-1 mentorship session</strong> with an industry expert in <strong style="color:#7c6cfc;">${stream}</strong>. Use this session to ask questions, get career advice, and learn from real-world experience.
      </p>
    </div>

    <!-- Mentor Card -->
    <div style="background:#111120;border:1px solid #2a2a3a;border-radius:16px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 20px;color:#ffffff;font-size:16px;font-weight:700;">👤 Your Assigned Mentor</h3>
      <div style="display:flex;align-items:center;margin-bottom:16px;">
        <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#7c6cfc,#5eead4);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;flex-shrink:0;">
          ${mentor.name.charAt(0)}
        </div>
        <div style="margin-left:16px;">
          <p style="margin:0;color:#ffffff;font-size:17px;font-weight:700;">${mentor.name}</p>
          <p style="margin:4px 0 0;color:#7c6cfc;font-size:13px;">${mentor.title} @ ${mentor.company}</p>
        </div>
      </div>
      <p style="margin:0 0 16px;color:#a0a0b0;font-size:13px;line-height:1.6;">${mentor.bio}</p>
      <div style="margin-bottom:8px;">${expertiseHTML}</div>
    </div>

    <!-- Meeting Details -->
    <div style="background:#111120;border:1px solid #2a2a3a;border-radius:16px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;color:#ffffff;font-size:16px;font-weight:700;">📅 Available Meeting Slots</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#1a1a2e;">
            <th style="padding:8px 16px;text-align:left;color:#7c6cfc;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Day</th>
            <th style="padding:8px 16px;text-align:left;color:#7c6cfc;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Time (IST)</th>
          </tr>
        </thead>
        <tbody>${slotsHTML}</tbody>
      </table>
      <p style="margin:16px 0 0;color:#a0a0b0;font-size:12px;">* Sessions are 60 minutes. Please join on time.</p>
    </div>

    <!-- Meeting Link Button -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${mentor.meetLink}" style="display:inline-block;background:linear-gradient(135deg,#7c6cfc,#5eead4);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.5px;">
        🎥 Join Meeting
      </a>
      <p style="margin:10px 0 0;color:#a0a0b0;font-size:12px;">or copy this link: <span style="color:#7c6cfc;">${mentor.meetLink}</span></p>
    </div>

    <!-- Preparation Tips -->
    <div style="background:#0f1a0f;border:1px solid #1a3a1a;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <h3 style="margin:0 0 12px;color:#4ade80;font-size:15px;">✅ How to prepare for your session</h3>
      <ul style="margin:0;padding-left:20px;color:#a0a0b0;font-size:13px;line-height:2;">
        <li>Write down 3-5 specific questions you want answered</li>
        <li>Review your Round 3 assessment feedback</li>
        <li>Have your resume/portfolio ready to share if needed</li>
        <li>Join the meeting 2 minutes early</li>
        <li>Keep a notepad handy for notes</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:20px;border-top:1px solid #1a1a2a;">
      <p style="margin:0 0 4px;color:#606080;font-size:12px;">eraAI — AI Proficiency Assessment Platform</p>
      <p style="margin:0;color:#404060;font-size:11px;">This email was sent because you cleared Round 3. Reply if you have any issues.</p>
    </div>

  </div>
</body>
</html>`;
}

async function sendMentorEmail(student, stream, score) {
  const mentor = pickMentor(stream);

  const mailOptions = {
    from: `"eraAI" <${process.env.EMAIL_USER}>`,
    to: student.email,
    subject: `🎉 You cleared Round 3! Your mentor session is ready — eraAI`,
    html: buildEmailHTML(student.name, stream, score, mentor)
  };

  await transporter.sendMail(mailOptions);
  return mentor;
}

module.exports = sendMentorEmail;
