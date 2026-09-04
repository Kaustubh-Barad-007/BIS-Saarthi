import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';

export function CertificationGuide({ setActiveView }: { setActiveView: (v: string) => void }) {
  const { t } = useLanguage();
  
  return (
    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><FileText size={28} color="var(--accent)" /> {t('certGuide')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('certGuideSubtitle')}</p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>
      
      <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[
          { step: 1, title: 'Identify Applicable Standard', desc: 'Determine if your product falls under mandatory certification (QCO) and find the exact IS code using the Standards Directory.' },
          { step: 2, title: 'Prepare Manufacturing Infrastructure', desc: 'Ensure your factory has the required in-house testing facilities and competent quality control personnel as prescribed in the Scheme of Inspection and Testing (SIT).' },
          { step: 3, title: 'Submit Application via Manakonline', desc: 'Register on manakonline.in, fill out Form-I, upload necessary documents (factory layout, company registration, testing equipment calibration certificates), and pay the application fee.' },
          { step: 4, title: 'Factory Inspection & Testing', desc: 'A BIS officer will visit your premises, inspect manufacturing and testing capabilities, and draw independent samples for testing at a BIS-recognized lab.' },
          { step: 5, title: 'Grant of License', desc: 'If the inspection is satisfactory and the independent test report confirms conformity, BIS grants the license allowing you to use the Standard Mark (ISI).' }
        ].map(s => (
          <div key={s.step} style={{ padding: '20px 24px', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 16, display: 'flex', gap: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, flexShrink: 0 }}>
              {s.step}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{s.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.95rem' }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
