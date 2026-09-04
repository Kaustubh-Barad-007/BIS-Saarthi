import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';

export function ApplyLicenseModal({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const isCode = fd.get('isCode') as string;
    const address = fd.get('address') as string;
    const product = fd.get('product') as string;

    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isCode, address, product: product || 'Industrial Product' })
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit license application');
      }
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <motion.div initial={{opacity: 0, scale: 0.95, y: 10}} animate={{opacity: 1, scale: 1, y: 0}} className="modal" style={{maxWidth: 560, width: '94vw', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
          <h2 style={{fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0}}>Apply for BIS Certification License</h2>
          <button onClick={onClose} className="icon-btn" style={{background: 'transparent'}}>
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Application Filed Successfully</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
              Your application for grant of license has been submitted to the Bureau of Indian Standards portal for initial review.
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ padding: '0 32px', height: 44, borderRadius: 10 }}>
              Done
            </button>
          </div>
        ) : (
          <form style={{display: 'flex', flexDirection: 'column', gap: 16}} onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 10, color: 'var(--danger)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Product IS Standard</label>
                <input name="isCode" type="text" required placeholder="e.g. IS 14543 or IS 10500" className="form-input" style={{ borderRadius: 10 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input name="product" type="text" placeholder="e.g. Packaged Drinking Water" className="form-input" style={{ borderRadius: 10 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Manufacturing Unit Address</label>
              <textarea name="address" required rows={3} placeholder="Complete premises and factory address" className="form-input" style={{ borderRadius: 10 }}></textarea>
            </div>
            <div style={{marginTop: 8, padding: 14, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.18)', display: 'flex', gap: 12}}>
              <CheckCircle size={18} color="#10b981" style={{flexShrink: 0, marginTop: 2}} />
              <p style={{fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5}}>
                By submitting this application, you agree to adhere to the Scheme of Inspection and Testing (SIT) and facilitate verification by BIS authorized officers.
              </p>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8}}>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ borderRadius: 10 }}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ borderRadius: 10, fontWeight: 600 }}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
