import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';

export function FeeEstimator({ setActiveView }: { setActiveView: (v: string) => void }) {
  const { t } = useLanguage();
  const [feeTurnover, setFeeTurnover] = useState('');
  const [feeCategory, setFeeCategory] = useState('large');

  return (
    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><Calculator size={28} color="var(--accent)" /> {t('feeEstimator')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('calcSubtitle')}</p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>
      
      <div className="panel" style={{ maxWidth: 600, padding: 24, borderRadius: 24 }}>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">{t('enterpriseType')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
            {[t('microScale'), t('smallScale'), t('largeScale')].map((tLabel, i) => (
              <button 
                key={i} 
                onClick={() => setFeeCategory(['micro', 'small', 'large'][i])} 
                style={{ 
                  padding: '10px', 
                  borderRadius: 12, 
                  border: `1px solid ${feeCategory === ['micro', 'small', 'large'][i] ? 'var(--accent)' : 'var(--border-glass)'}`, 
                  background: feeCategory === ['micro', 'small', 'large'][i] ? 'var(--accent-muted)' : 'var(--bg-hover)', 
                  color: feeCategory === ['micro', 'small', 'large'][i] ? 'var(--accent)' : 'var(--text-secondary)', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  fontSize: '0.85rem' 
                }}
              >
                {tLabel}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">{t('turnoverLabel')}</label>
          <input type="number" placeholder="e.g. 5000000" value={feeTurnover} onChange={e => setFeeTurnover(e.target.value)} className="form-input" />
        </div>
        
        <div style={{ marginTop: 32, padding: 20, background: 'var(--bg-hover)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{t('feeBreakdown')}</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-secondary)' }}>
            <span>{t('appFee')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹1,000</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-secondary)' }}>
            <span>{t('inspectionFee')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹7,000</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: 'var(--text-secondary)' }}>
            <span>{t('markingFee')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {feeCategory === 'micro' ? '₹20,000 (with 80% concession)' : feeCategory === 'small' ? '₹40,000 (with 50% concession)' : '₹80,000+'}
            </span>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
            <span>{t('totalBaseline')}</span>
            <span>{feeCategory === 'micro' ? '₹28,000' : feeCategory === 'small' ? '₹48,000' : '₹88,000'}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>* Does not include independent lab testing charges or actual marking fee calculated on per-unit basis.</p>
        </div>
      </div>
    </motion.div>
  );
}
