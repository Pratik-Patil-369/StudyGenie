const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Creates a reusable nodemailer transporter using Gmail SMTP.
 * Returns null if email is not configured.
 */
function createTransporter() {
    if (!config.emailUser || !config.emailPass) {
        console.warn('[Email] Email not configured. Set EMAIL_USER and EMAIL_PASS in .env');
        return null;
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.emailUser,
            pass: config.emailPass,
        },
    });
}

/**
 * Sends today's daily study plan reminder to a user.
 * @param {Object} user - { email, full_name }
 * @param {Array}  todayTopics - array of topic strings
 * @param {Object} plan - { title, subject }
 * @param {number} durationHours
 * @param {string} difficulty
 */
async function sendDailyReminderEmail(user, todayTopics, plan, durationHours = 2, difficulty = 'medium') {
    const transporter = createTransporter();
    if (!transporter) return { success: false, reason: 'Email not configured' };

    const topicListHTML = todayTopics
        .map(t => `<li style="margin:6px 0; color:#e2e8f0;">${t}</li>`)
        .join('');

    const diffColor = difficulty === 'hard' ? '#f87171' : difficulty === 'easy' ? '#2dd4bf' : '#f59e0b';

    const html = `
    <div style="font-family:'Inter',Arial,sans-serif;background:#020617;color:#f8fafc;max-width:600px;margin:auto;border-radius:16px;overflow:hidden;border:1px solid rgba(45,212,191,0.2);">
      <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(45,212,191,0.2);">
        <h1 style="color:#2dd4bf;font-size:28px;margin:0;font-weight:900;letter-spacing:-1px;">StudyGenie</h1>
        <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Your AI-powered smart study companion</p>
      </div>
      <div style="padding:36px 40px;">
        <h2 style="color:#f8fafc;font-size:22px;margin:0 0 8px;">📅 Today's Study Plan</h2>
        <p style="color:#94a3b8;margin:0 0 24px;">Hey ${user.full_name || 'Student'}, here's what you're studying today for <strong style="color:#2dd4bf;">${plan.title}</strong>:</p>
        
        <div style="background:rgba(30,41,59,0.7);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
            <span style="color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Duration</span>
            <span style="color:#2dd4bf;font-weight:700;">${durationHours} hrs</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
            <span style="color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Difficulty</span>
            <span style="color:${diffColor};font-weight:700;text-transform:capitalize;">${difficulty}</span>
          </div>
          <p style="color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Topics to Cover</p>
          <ul style="margin:0;padding-left:20px;">${topicListHTML}</ul>
        </div>

        <div style="text-align:center;margin-top:28px;">
          <a href="http://localhost:5173" style="display:inline-block;background:linear-gradient(135deg,#2dd4bf,#14b8a6);color:#000;font-weight:800;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;">Open StudyGenie</a>
        </div>
      </div>
      <div style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:#475569;font-size:12px;margin:0;">You're receiving this because you signed up for StudyGenie study reminders.</p>
      </div>
    </div>`;

    try {
        await transporter.sendMail({
            from: config.emailFrom || `StudyGenie <${config.emailUser}>`,
            to: user.email,
            subject: `📚 Today's Study Plan — ${plan.title}`,
            html,
        });
        console.log(`[Email] Daily reminder sent to ${user.email}`);
        return { success: true };
    } catch (err) {
        console.error('[Email] Failed to send daily reminder:', err.message);
        return { success: false, reason: err.message };
    }
}

/**
 * Sends a quiz result / progress update email.
 * @param {Object} user - { email, full_name }
 * @param {Object} quizResult - { score, total_questions, percentage }
 * @param {string} difficulty
 * @param {string[]} topics
 */
async function sendProgressEmail(user, quizResult, difficulty = 'medium', topics = []) {
    const transporter = createTransporter();
    if (!transporter) return { success: false, reason: 'Email not configured' };

    const { score, total_questions, percentage } = quizResult;
    const pct = Math.round(percentage);
    const rating = pct >= 80 ? '🏆 Excellent!' : pct >= 50 ? '👍 Good Progress!' : '📖 Keep Studying!';
    const barFill = Math.round((pct / 100) * 300);
    const barColor = pct >= 80 ? '#2dd4bf' : pct >= 50 ? '#f59e0b' : '#f87171';

    const html = `
    <div style="font-family:'Inter',Arial,sans-serif;background:#020617;color:#f8fafc;max-width:600px;margin:auto;border-radius:16px;overflow:hidden;border:1px solid rgba(45,212,191,0.2);">
      <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(45,212,191,0.2);">
        <h1 style="color:#2dd4bf;font-size:28px;margin:0;font-weight:900;letter-spacing:-1px;">StudyGenie</h1>
        <p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Quiz Results</p>
      </div>
      <div style="padding:36px 40px;text-align:center;">
        <p style="color:#94a3b8;margin:0 0 24px;">Hey ${user.full_name || 'Student'}, here are your latest quiz results:</p>
        
        <div style="font-size:64px;font-weight:900;color:${barColor};line-height:1;">${pct}%</div>
        <div style="font-size:20px;margin:8px 0 4px;">${rating}</div>
        <div style="color:#94a3b8;font-size:14px;margin-bottom:24px;">${score} out of ${total_questions} correct · <span style="text-transform:capitalize;color:${barColor};">${difficulty}</span> difficulty</div>
        
        <div style="background:rgba(30,41,59,0.7);border-radius:8px;height:8px;width:300px;margin:0 auto 24px;overflow:hidden;">
          <div style="height:100%;width:${barFill}px;background:${barColor};border-radius:8px;"></div>
        </div>

        ${topics.length > 0 ? `<p style="color:#64748b;font-size:13px;">Topics covered: <strong style="color:#e2e8f0;">${topics.slice(0, 3).join(', ')}${topics.length > 3 ? '...' : ''}</strong></p>` : ''}
        
        <a href="http://localhost:5173" style="display:inline-block;background:linear-gradient(135deg,#2dd4bf,#14b8a6);color:#000;font-weight:800;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;margin-top:20px;">Take Another Quiz</a>
      </div>
      <div style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:#475569;font-size:12px;margin:0;">You're receiving this because you submitted a quiz on StudyGenie.</p>
      </div>
    </div>`;

    try {
        await transporter.sendMail({
            from: config.emailFrom || `StudyGenie <${config.emailUser}>`,
            to: user.email,
            subject: `📊 Quiz Result: You scored ${pct}% — StudyGenie`,
            html,
        });
        console.log(`[Email] Progress email sent to ${user.email}`);
        return { success: true };
    } catch (err) {
        console.error('[Email] Failed to send progress email:', err.message);
        return { success: false, reason: err.message };
    }
}

module.exports = { sendDailyReminderEmail, sendProgressEmail };
