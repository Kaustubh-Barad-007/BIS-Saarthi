import { prisma } from '../src/server/db/client.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

try {
} catch (e) {
  console.error('Prisma init error:', e);
}

const JWT_SECRET = process.env.JWT_SECRET || 'bis-saarthi-fallback-secret-2024';

function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } catch (e) {
    console.error('SMTP transporter error:', e);
    return null;
  }
}

function signToken(user: any) {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email, name: user.name, avatar: user.avatar },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string;

  // ─── DELETE Account ───────────────────────────────────────────────────────
  if (action === 'delete' && req.method === 'DELETE') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized - missing token' });
      const token = authHeader.split(' ')[1];
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Unauthorized - invalid token' });
      }
      const targetUserId = (decoded.role === 'admin' && req.query.userId) ? (req.query.userId as string) : decoded.userId;
      if (!targetUserId) return res.status(400).json({ error: 'No user ID to delete' });

      try {
        await prisma.message.deleteMany({ where: { conversation: { userId: targetUserId } } });
        await prisma.conversation.deleteMany({ where: { userId: targetUserId } });
        await prisma.complaint.deleteMany({ where: { userId: targetUserId } });
        await prisma.clubJoinRequest.deleteMany({ where: { userId: targetUserId } });
        await prisma.license.deleteMany({ where: { userId: targetUserId } });
        await prisma.user.delete({ where: { id: targetUserId } });
      } catch (dbErr: any) {
        console.error('Delete DB error:', dbErr);
        return res.status(400).json({ error: 'Could not delete account. Please try again.' });
      }
      return res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (e: any) {
      return res.status(400).json({ error: e.message || 'Delete failed' });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ─── Login ────────────────────────────────────────────────────────────────
  if (action === 'login') {
    try {
      const { email, password } = req.body || {};
      const cleanEmail = email.toLowerCase().trim();

      // System Admin Auto-provisioning & Authentication
      if (cleanEmail === 'admin@bis.gov.in' && password === 'admin123') {
        let adminUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!adminUser) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin123', salt);
          adminUser = await prisma.user.create({
            data: {
              email: cleanEmail,
              password: hashedPassword,
              role: 'admin',
              name: 'System Administrator',
            }
          });
        } else if (adminUser.role !== 'admin') {
          adminUser = await prisma.user.update({
            where: { email: cleanEmail },
            data: { role: 'admin' }
          });
        }
        const token = signToken(adminUser);
        return res.status(200).json({ token, role: 'admin', email: adminUser.email, name: adminUser.name, avatar: adminUser.avatar });
      }

      let user: any;
      try {
        user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      } catch (dbErr: any) {
        console.error('Login DB error:', dbErr);
        return res.status(503).json({ error: 'Database temporarily unavailable. Please try again in a moment.' });
      }

      if (!user) return res.status(401).json({ error: 'No account found with this email. Please register first.' });

      let valid = false;
      try {
        valid = await bcrypt.compare(password, user.password);
      } catch {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!valid) return res.status(401).json({ error: 'Incorrect password. Please try again.' });

      const token = signToken(user);
      return res.status(200).json({ token, role: user.role, email: user.email, name: user.name, avatar: user.avatar });
    } catch (e: any) {
      console.error('Login error:', e);
      return res.status(400).json({ error: e.message || 'Login failed. Please try again.' });
    }
  }

  // ─── Register ─────────────────────────────────────────────────────────────
  if (action === 'register') {
    try {
      const { email, password, role, name, avatar } = req.body || {};
      if (!email || !password || !role) return res.status(400).json({ error: 'Email, password and role are required' });

      let existing: any;
      try {
        existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      } catch (dbErr: any) {
        console.error('Register lookup DB error:', dbErr);
        return res.status(503).json({ error: 'Database temporarily unavailable. Please try again in a moment.' });
      }

      if (existing) return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });

      let hashedPassword: string;
      try {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      } catch {
        return res.status(503).json({ error: 'Could not process password. Please try again.' });
      }

      let user: any;
      try {
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role,
            name: name?.trim() || '',
            avatar: avatar || null,
          },
        });
      } catch (dbErr: any) {
        console.error('Register create DB error:', dbErr);
        return res.status(503).json({ error: 'Could not create account. Please try again in a moment.' });
      }

      const token = signToken(user);
      return res.status(201).json({ token, role: user.role, email: user.email, name: user.name, avatar: user.avatar });
    } catch (e: any) {
      console.error('Register error:', e);
      return res.status(400).json({ error: e.message || 'Registration failed. Please try again.' });
    }
  }

  // ─── OAuth (Google / GitHub) ──────────────────────────────────────────────
  if (action === 'oauth') {
    try {
      const { provider, email, name, code, role } = req.body || {};
      let resolvedEmail = email;
      let resolvedName = name;

      if (provider === 'GitHub' && code) {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          return res.status(503).json({ error: 'GitHub OAuth is not configured on the server.' });
        }

        let tokenData: any;
        try {
          const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
          });
          tokenData = await tokenRes.json();
        } catch {
          return res.status(503).json({ error: 'Could not connect to GitHub. Please try again.' });
        }

        if (tokenData.error) {
          return res.status(400).json({ error: tokenData.error_description || 'GitHub authorization failed. The link may have expired.' });
        }

        try {
          const userRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'BIS-SAARTHI' },
          });
          const userData = await userRes.json();

          const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'BIS-SAARTHI' },
          });
          const emailData = await emailRes.json();

          resolvedEmail = (Array.isArray(emailData) ? emailData.find((e: any) => e.primary)?.email || emailData[0]?.email : null);
          if (!resolvedEmail) return res.status(400).json({ error: 'No email found on your GitHub account. Please add a public email.' });
          resolvedName = userData.name || userData.login;
        } catch {
          return res.status(503).json({ error: 'Could not fetch your GitHub profile. Please try again.' });
        }
      }

      if (!resolvedEmail) return res.status(400).json({ error: 'Email is required for authentication' });

      let user: any;
      try {
        user = await prisma.user.findUnique({ where: { email: resolvedEmail.toLowerCase().trim() } });
        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const randomPass = Math.random().toString(36) + Math.random().toString(36);
          const hashedPassword = await bcrypt.hash(randomPass, salt);
          user = await prisma.user.create({
            data: {
              email: resolvedEmail.toLowerCase().trim(),
              password: hashedPassword,
              role: role || 'consumer',
              name: resolvedName || 'User',
            },
          });
        }
      } catch (dbErr: any) {
        console.error('OAuth DB error:', dbErr);
        return res.status(503).json({ error: 'Database temporarily unavailable. Please try again in a moment.' });
      }

      const token = signToken(user);
      return res.status(200).json({ token, role: user.role, email: user.email, name: user.name, avatar: user.avatar });
    } catch (e: any) {
      console.error('OAuth error:', e);
      return res.status(400).json({ error: e.message || 'OAuth login failed. Please try again.' });
    }
  }

  // ─── OTP ──────────────────────────────────────────────────────────────────
  if (action === 'otp') {
    try {
      const { action: otpAction, email, code } = req.body || {};

      if (!email) return res.status(400).json({ error: 'Email is required' });

      if (otpAction === 'send') {
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

        try {
          await prisma.otp.upsert({
            where: { email: email.toLowerCase().trim() },
            update: { code: generatedCode, expiresAt: new Date(Date.now() + 10 * 60000) },
            create: { email: email.toLowerCase().trim(), code: generatedCode, expiresAt: new Date(Date.now() + 10 * 60000) },
          });
        } catch (dbErr: any) {
          console.error('OTP save DB error:', dbErr);
          return res.status(503).json({ error: 'Could not save OTP. Please try again.' });
        }

        const transporter = createTransporter();
        if (transporter) {
          try {
            const emailHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>BIS Verification Code</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;color:#0f172a;">
  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;padding:30px 12px;">
    <tr><td align="center">
      <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);border:1px solid #e2e8f0;">
        <tr><td style="background:linear-gradient(135deg,#003366,#002244);padding:30px 24px;text-align:center;border-bottom:4px solid #0284c7;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Bureau of Indian Standards</h1>
          <p style="margin:4px 0 0 0;color:#93c5fd;font-size:13px;">BIS SAARTHI — SIH 2026 | Team IntelliStd</p>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          <h2 style="margin:0 0 14px;color:#0f172a;font-size:18px;">One-Time Password (OTP)</h2>
          <p style="color:#475569;font-size:14px;">Your verification code for the BIS SAARTHI portal is:</p>
          <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px dashed #0284c7;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
            <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#003366;font-family:'Courier New',monospace;">${generatedCode}</span>
          </div>
          <p style="color:#64748b;font-size:13px;">Valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:11px;">Manak Bhawan, 9 Bahadur Shah Zafar Marg, New Delhi 110002</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

            await transporter.sendMail({
              from: `"BIS SAARTHI Portal" <${process.env.SMTP_USER}>`,
              to: email,
              subject: `BIS Portal — Your OTP: ${generatedCode}`,
              text: `Your BIS SAARTHI verification code is: ${generatedCode}. Valid for 10 minutes.`,
              html: emailHtml,
            });
            return res.status(200).json({ success: true, message: 'OTP sent to your email' });
          } catch (mailErr: any) {
            console.error('SMTP error:', mailErr);
            // Fall through — return demo code so user isn't blocked
          }
        }

        // No SMTP or SMTP failed — return demo code for testing
        return res.status(200).json({ success: true, message: 'OTP stored (demo mode)', _demoCode: generatedCode });
      }

      if (otpAction === 'verify') {
        if (!code) return res.status(400).json({ error: 'OTP code is required' });

        let otp: any;
        try {
          otp = await prisma.otp.findUnique({ where: { email: email.toLowerCase().trim() } });
        } catch (dbErr: any) {
          console.error('OTP verify DB error:', dbErr);
          return res.status(503).json({ error: 'Could not verify OTP. Please try again.' });
        }

        if (!otp) return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
        if (otp.code !== code.trim()) return res.status(400).json({ error: 'Incorrect OTP. Please check and try again.' });
        if (otp.expiresAt < new Date()) return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });

        try {
          await prisma.otp.delete({ where: { email: email.toLowerCase().trim() } });
        } catch { /* ignore cleanup error */ }

        return res.status(200).json({ success: true, message: 'OTP verified successfully' });
      }

      return res.status(400).json({ error: 'Invalid OTP action. Use "send" or "verify".' });
    } catch (e: any) {
      console.error('OTP error:', e);
      return res.status(400).json({ error: e.message || 'OTP process failed. Please try again.' });
    }
  }

  return res.status(400).json({ error: `Unknown action: "${action || 'none'}". Valid actions: login, register, oauth, otp, delete.` });
  } catch (err: any) {
    console.error('Unhandled Auth API Error:', err);
    return res.status(500).json({ error: 'A critical server error occurred. Please try again later.' });
  }
}



