import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Search, CheckCircle2, Copy, ExternalLink, X } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';

export function LicenseVerifier({ setActiveView, setSidebarOpen }: { setActiveView: (view: any) => void, setSidebarOpen: (v: boolean) => void }) {
  const { t } = useLanguage();
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = (formData.get('code') as string).toUpperCase().replace(/\s/g, '');
    if (!code) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/verify?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
      } else {
        showToast('Verification failed.', 'error');
      }
    } catch {
      showToast('Error connecting to server.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view" style={{ position: 'relative' }}>
      
      {/* Local Toast Fallback if needed */}
      {toast && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)', color: '#fff', padding: '10px 16px', borderRadius: 8, zIndex: 100 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <ShieldCheck size={28} color="var(--accent)" /> {t('verifyISI')}
        </h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('verifySubtitle')}</p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: t('huidLabel'), example: 'A1B2C3', desc: '6-character code on jewellery', icon: '💍' }, 
          { label: t('isiLabel'), example: 'CM/L-1234567', desc: '7+ digit CM/L number on product', icon: '🏭' }
        ].map((tip, i) => (
          <div key={i} style={{ padding: '16px 20px', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 20, display: 'flex', gap: 14 }}>
            <span style={{ fontSize: '1.5rem' }}>{tip.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: 4 }}>{tip.label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 6 }}>{tip.desc}</div>
              <code style={{ background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 6, fontSize: '0.82rem', color: 'var(--accent)' }}>{tip.example}</code>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('verifyInputLabel')}</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input name="code" required className="form-input" style={{ flex: 1, fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: 2, height: 52 }} placeholder="e.g. A1B2C3 or CM/L-7654321" />
              <button type="submit" disabled={verifying} className="btn btn-primary" style={{ height: 52, padding: '0 24px', fontWeight: 600, gap: 8, flexShrink: 0 }}>
                {verifying ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> : <Search size={18} />}
                {t('verifyBtn')}
              </button>
            </div>
          </div>
        </form>
        {verifyResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 24, padding: 24, borderRadius: 20, background: verifyResult.valid ? 'rgba(16,163,127,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid` + (verifyResult.valid ? ' rgba(16,163,127,0.25)' : ' rgba(239,68,68,0.25)') }}>
            {verifyResult.valid ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}><CheckCircle2 size={22} /> Valid {verifyResult.type} - Authenticated by BIS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {Object.entries(verifyResult.details || {}).map(([k, v]: any) => (
                    <div key={k} style={{ background: 'var(--bg-hover)', borderRadius: 14, padding: '10px 14px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'capitalize', marginBottom: 3 }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ gap: 6, borderRadius: 'var(--radius-md)' }} onClick={() => { const txt = Object.entries(verifyResult.details || {}).map(([k,v]) => k + ': ' + v).join('\n'); navigator.clipboard?.writeText(txt).then(() => showToast('Copied!', 'success')); }}><Copy size={14} /> Copy Details</button>
                  <a href="https://www.bis.gov.in" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ gap: 6, borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit' }}><ExternalLink size={14} /> BIS Portal</a>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ padding: 10, borderRadius: 12, background: 'rgba(239,68,68,0.1)', flexShrink: 0 }}><X size={20} color="var(--danger)" /></div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>Not Verified</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{verifyResult.message}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>Suspect counterfeiting? <button onClick={() => { setActiveView('complaint'); if (typeof window !== 'undefined' && window.innerWidth <= 768) setSidebarOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontWeight: 600 }}>File a complaint →</button></p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
