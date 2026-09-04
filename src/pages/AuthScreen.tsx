import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sun, Moon, User, Factory, Mail, CheckCircle2, ArrowLeft, RefreshCw, Shield, Sparkles } from 'lucide-react';
import Logo from '@/components/Logo';
import { useGoogleLogin } from '@react-oauth/google';

export default function AuthScreen({ type }: { type: 'login' | 'register' }) {
  const { t } = useLanguage();

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState('consumer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);
  const [otpSentNotice, setOtpSentNotice] = useState(false);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    // Reset state when switching between login & register
    setError('');
    setStep('form');
    setOtpCode('');
  }, [type]);

  useEffect(() => {
    // Check for GitHub OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setOauthLoading('GitHub');
      fetch('/api/auth?action=oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'GitHub', code, role: params.get('state') }),
      })
      .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          login(data.token, data.role, data.email, data.name, data.avatar);
          navigate('/dashboard');
        } else {
          setError(data.error || 'GitHub login failed');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => {
        setOauthLoading(null);
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setOauthLoading('Google');
      setError('');
      try {
        let userInfo: any;
        try {
          const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          userInfo = await infoRes.json();
          if (!userInfo.email) throw new Error('Google did not return your email. Please check your Google account settings.');
        } catch (e: any) {
          throw new Error(e.message || 'Failed to fetch Google profile. Please try again.');
        }

        const res = await fetch('/api/auth?action=oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'Google', email: userInfo.email, name: userInfo.name, avatar: userInfo.picture, role }),
        });
        const data = await res.json();

        if (res.ok) {
          login(data.token, data.role, data.email, data.name, data.avatar || userInfo.picture);
          navigate('/dashboard');
        } else {
          throw new Error(data.error || 'Google sign-in failed. Please try again.');
        }
      } catch (err: any) {
        setError(err.message || 'Google sign-in failed. Please try again.');
      } finally {
        setOauthLoading(null);
      }
    },
    onError: (err: any) => {
      setOauthLoading(null);
      if (err?.type === 'popup_closed') {
        setError('Google sign-in popup was closed. Please try again.');
      } else if (err?.type === 'popup_failed_to_open') {
        setError('Could not open Google sign-in popup. Please allow popups for this site.');
      } else {
        setError('Google sign-in failed. Please ensure your Google account is configured at Google Cloud Console with this domain.');
      }
    }
  });

  const sendOtpRequest = async (targetEmail: string) => {
    const res = await fetch('/api/auth?action=otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', email: targetEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    if (data._demoCode) setDemoCode(data._demoCode);
    setResendTimer(30);
    setOtpSentNotice(true);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await sendOtpRequest(email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email.trim()) return setError('Please enter your email address.');
    if (type === 'login' && !password) return setError('Please enter your password.');
    if (type === 'register' && step === 'form') {
      if (!name.trim()) return setError('Please enter your full name.');
      if (password.length < 6) return setError('Password must be at least 6 characters.');
    }

    // ── REGISTER STEP 1: Send OTP ──────────────────────────────────────────
    if (type === 'register' && step === 'form') {
      setLoading(true);
      try {
        await sendOtpRequest(email.trim());
        setStep('otp');
      } catch (err: any) {
        setError(err.message || 'Failed to send verification code. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── REGISTER STEP 2: Verify OTP + Create Account ───────────────────────
    if (type === 'register' && step === 'otp') {
      if (!otpCode || otpCode.length < 6) return setError('Please enter the 6-digit code sent to your email.');
      setLoading(true);
      try {
        // Step A: Verify OTP
        const verifyRes = await fetch('/api/auth?action=otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', email: email.trim(), code: otpCode.trim() }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.error || 'Invalid verification code. Please try again.');

        // Step B: Create account
        const regRes = await fetch('/api/auth?action=register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password, role, name: name.trim(), avatar }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Account creation failed. Please try again.');

        login(regData.token, regData.role, regData.email, regData.name, regData.avatar);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── LOGIN ──────────────────────────────────────────────────────────────
    setLoading(true);
    try {
      const res = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed. Please check your credentials.');
      login(data.token, data.role, data.email, data.name, data.avatar);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    if (provider === 'Google') {
      googleLogin();
    } else if (provider === 'GitHub') {
      const clientId = 'Ov23liLRysxBX9AWvnlO';
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email&state=${role}`;
    }
  };

  return (
    <div className="auth-page">
      <nav className="landing-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'transparent', borderBottom: 'none' }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: 'pointer' }} onClick={() => navigate("/")}>
          <div className="app-logo"><Logo size={20} /></div>
          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>BIS SAARTHI</span>
          <span className="hide-mobile" style={{ fontSize: "0.7rem", color: "var(--accent)", marginLeft: 4, fontWeight: 600, padding: "2px 6px", background: "var(--accent-muted)", borderRadius: 8 }}>by IntelliStd</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            <span className="hide-mobile">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          {type === 'register' ? (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/sign-in")}>Sign In</button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => navigate("/register")}>Get Started</button>
          )}
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-card"
        style={{ maxWidth: 440 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {type === 'login' ? 'Sign in to BIS Portal' : (step === 'form' ? 'Create Account' : 'Verify Email')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {type === 'login' 
              ? 'Welcome back to BIS Intelligent Assistant' 
              : (step === 'form' ? 'Start navigating Indian Standards with AI' : `Enter the 6-digit code sent to ${email}`)}
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.875rem', marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* In-App UI Dialog / Notification Card for OTP */}
        {step === 'otp' && otpSentNotice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(30, 58, 138, 0.2) 100%)',
              border: '1px solid rgba(2, 132, 199, 0.35)',
              marginBottom: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Verification Code Sent!
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Delivered directly to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                </div>
              </div>
            </div>
            {demoCode && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-hover)', border: '1px solid var(--border-glass)', padding: '6px 10px', borderRadius: 8, fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Demo Code: <strong style={{ color: 'var(--accent)' }}>{demoCode}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoCode)}
                  style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Auto-fill
                </button>
              </div>
            )}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 'form' ? (
            <>
              {type === 'register' && (
                <div className="form-group">
                  <label className="form-label">Profile Photo (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {avatar ? <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="var(--text-muted)" />}
                    </div>
                    <label style={{ cursor: 'pointer', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Upload Photo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setAvatar(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                </div>
              )}
              {type === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" className="form-input" />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingRight: 42 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{type === 'login' ? 'Select Role (for New Google/GitHub Logins)' : 'I am a...'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { value: 'consumer', label: 'Consumer', icon: User },
                    { value: 'manufacturer', label: 'Manufacturer', icon: Factory },
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        padding: '12px 8px', borderRadius: 12,
                        border: `1.5px solid ${role === r.value ? 'var(--accent)' : 'var(--border-glass)'}`,
                        background: role === r.value ? 'var(--accent-muted)' : 'var(--bg-hover)',
                        color: role === r.value ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      <r.icon size={20} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>6-digit Verification Code</label>
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <ArrowLeft size={12} /> Edit Details
                  </button>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="form-input"
                  style={{ letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, padding: '14px' }}
                  maxLength={6}
                />
              </div>

              {/* Resend OTP Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Didn't receive code?</span>
                <button
                  type="button"
                  disabled={resendTimer > 0 || resending}
                  onClick={handleResendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--accent)',
                    cursor: resendTimer > 0 ? 'default' : 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : (resending ? 'Sending...' : 'Resend Code')}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9375rem', marginTop: 4, borderRadius: 'var(--radius-md)' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                {step === 'otp' ? 'Verifying...' : (type === 'login' ? 'Signing in...' : 'Sending Code...')}
              </span>
            ) : (step === 'otp' ? 'Verify & Create Account' : (type === 'login' ? 'Continue' : 'Send Verification Code'))}
          </button>
        </form>

        {step === 'form' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
              <span style={{ padding: '0 14px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>OR CONTINUE WITH</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => handleOAuth('Google')} disabled={!!oauthLoading} className="oauth-btn">
                {oauthLoading === 'Google' ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
                {oauthLoading === 'Google' ? 'Connecting...' : 'Continue with Google'}
              </button>
              <button onClick={() => handleOAuth('GitHub')} disabled={!!oauthLoading} className="oauth-btn">
                {oauthLoading === 'GitHub' ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.022A9.607 9.607 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>}
                {oauthLoading === 'GitHub' ? 'Connecting...' : 'Continue with GitHub'}
              </button>
            </div>
          </>
        )}

        {/* Direct Footer Navigation */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {type === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setError(''); setStep('form'); navigate('/sign-up'); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
              >
                Sign up
              </button>
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-hover)', borderRadius: 12, border: '1px solid var(--border-glass)', fontSize: '0.75rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Admin Demo:</strong> Use <code>admin@bis.gov.in</code> / <code>admin123</code>
              </div>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setError(''); setStep('form'); navigate('/sign-in'); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </motion.div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}





