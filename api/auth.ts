import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-demo';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  try {
    if (action === 'delete' && req.method === 'DELETE') {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const targetUserId = (decoded.role === 'admin' && req.query.userId) ? (req.query.userId as string) : decoded.userId;
      
      await prisma.message.deleteMany({ where: { conversation: { userId: targetUserId } } });
      await prisma.conversation.deleteMany({ where: { userId: targetUserId } });
      await prisma.complaint.deleteMany({ where: { userId: targetUserId } });
      await prisma.clubJoinRequest.deleteMany({ where: { userId: targetUserId } });
      await prisma.license.deleteMany({ where: { userId: targetUserId } });
      await prisma.user.delete({ where: { id: targetUserId } });
      return res.status(200).json({ success: true, message: 'User record deleted successfully' });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (action === 'login') {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ userId: user.id, role: user.role, email: user.email, name: user.name, avatar: user.avatar }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ token, role: user.role, email: user.email, name: user.name, avatar: user.avatar });
    }

    if (action === 'register') {
      const { email, password, role, name, avatar } = req.body;
      if (!email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Email exists' });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = await prisma.user.create({ data: { email, password: hashedPassword, role, name: name || '', avatar: avatar || null } });
      const token = jwt.sign({ userId: user.id, role: user.role, email: user.email, name: user.name, avatar: user.avatar }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, role: user.role, email: user.email, name: user.name, avatar: user.avatar });
    }

    if (action === 'oauth') {
      const { provider, email, name, code, role } = req.body;
      let resolvedEmail = email;
      let resolvedName = name;

      if (provider === 'GitHub' && code) {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.error) return res.status(400).json({ error: tokenData.error_description });
        
        const userRes = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'BIS' }});
        const userData = await userRes.json();
        
        const emailRes = await fetch('https://api.github.com/user/emails', { headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'BIS' }});
        const emailData = await emailRes.json();
        resolvedEmail = emailData.find((e: any) => e.primary)?.email || emailData[0]?.email;
        if (!resolvedEmail) return res.status(400).json({ error: 'No email found' });
        resolvedName = userData.name || userData.login;
      }

      if (!resolvedEmail) return res.status(400).json({ error: 'Missing email' });
      let user = await prisma.user.findUnique({ where: { email: resolvedEmail } });
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const randomPass = Math.random().toString(36) + Math.random().toString(36);
        const hashedPassword = await bcrypt.hash(randomPass, salt);
        user = await prisma.user.create({ data: { email: resolvedEmail, password: hashedPassword, role: role || 'consumer', name: resolvedName || 'User' } });
      }
      const token = jwt.sign({ userId: user.id, role: user.role, email: user.email, name: user.name, avatar: user.avatar }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ token, role: user.role, email: user.email, name: user.name, avatar: user.avatar });
    }

    if (action === 'otp') {
      const { action: otpAction, email, code } = req.body;
      if (otpAction === 'send') {
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.otp.upsert({
          where: { email },
          update: { code: generatedCode, expiresAt: new Date(Date.now() + 10 * 60000) },
          create: { email, code: generatedCode, expiresAt: new Date(Date.now() + 10 * 60000) },
        });

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          try {
            const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BIS Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 30px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #003366 0%, #002244 100%); padding: 30px 24px; text-align: center; border-bottom: 4px solid #0284c7;">
              <div style="display: inline-block; background-color: #ffffff; padding: 6px 14px; border-radius: 6px; margin-bottom: 10px;">
                <span style="font-size: 14px; font-weight: 800; color: #003366; letter-spacing: 0.5px;">मानक: पथप्रदर्शक: | BIS</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
                Bureau of Indian Standards
              </h1>
              <p style="margin: 4px 0 0 0; color: #93c5fd; font-size: 13px; font-weight: 500;">
                National Standards Body of India | Government of India
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                One-Time Password (OTP) Verification
              </h2>
              <p style="margin: 0 0 18px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Dear User,<br><br>
                Thank you for registering on the <strong>BIS Intelligent Assistant Portal</strong>. To authenticate your email and complete registration, please use the following one-time code:
              </p>
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                  Your Verification Code
                </span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #003366; display: inline-block; padding-left: 10px;">
                  ${generatedCode}
                </span>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fefce8; border-radius: 8px; padding: 14px; margin-bottom: 20px; border-left: 4px solid #eab308;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #854d0e;">
                      🔒 Security Guidelines:
                    </p>
                    <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #713f12; line-height: 1.5;">
                      <li>Valid for <strong>10 minutes</strong> only.</li>
                      <li>Never share this code with anyone. BIS officials will never ask for your OTP.</li>
                      <li>If you did not make this request, please safely ignore this email.</li>
                    </ul>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                Warm regards,<br>
                <strong>Bureau of Indian Standards Portal</strong><br>
                <span style="font-size: 11px; color: #94a3b8;">SIH Problem Statement 26107</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Manak Bhawan, 9 Bahadur Shah Zafar Marg, New Delhi 110002 &bull; Automated notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

            const emailText = `Bureau of Indian Standards (BIS) — Government of India
One-Time Password (OTP) Verification

Dear User,

Your 6-digit verification code for the BIS Intelligent Assistant Portal is: ${generatedCode}

• Valid for 10 minutes only.
• Do not share this code with anyone.
• If you did not request this code, you can safely ignore this email.

Bureau of Indian Standards, Manak Bhawan, 9 Bahadur Shah Zafar Marg, New Delhi 110002`;

            await transporter.sendMail({
              from: `"Bureau of Indian Standards" <${process.env.SMTP_USER}>`,
              to: email,
              replyTo: process.env.SMTP_USER,
              subject: `BIS Portal — One-Time Password (OTP): ${generatedCode}`,
              text: emailText,
              html: emailHtml,
              headers: {
                'X-Priority': '1',
                'Importance': 'High',
                'X-MSMail-Priority': 'High',
                'X-Mailer': 'BIS-Portal-Mailer-v2',
                'Auto-Submitted': 'auto-generated',
              },
            });
            return res.status(200).json({ success: true, message: 'OTP sent' });
          } catch (e: any) {
            console.error('SMTP Send Error:', e);
          }
        }
        return res.status(200).json({ success: true, message: 'OTP stored', _demoCode: generatedCode });
      }
      if (otpAction === 'verify') {
        const otp = await prisma.otp.findUnique({ where: { email } });
        if (!otp || otp.code !== code || otp.expiresAt < new Date()) return res.status(400).json({ error: 'Invalid or expired OTP' });
        await prisma.otp.delete({ where: { email } });
        return res.status(200).json({ success: true, message: 'OTP verified' });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error: any) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

