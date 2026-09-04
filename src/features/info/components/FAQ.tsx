import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useAuth } from '@/app/providers/AuthContext';

export function FAQ({ setActiveView }: { setActiveView: (v: string) => void }) {
  const { t } = useLanguage();
  const { role: userRole } = useAuth();

  const faqItems = userRole === 'manufacturer' ? [
    { q: 'How do I apply for a BIS ISI license?', a: 'Apply through the Manak Online portal at services.bis.gov.in. Submit product test reports from a BIS-recognized lab, factory details, and pay the fee. Process takes 60-90 days.' },
    { q: 'Which products require mandatory ISI certification?', a: 'Over 370+ products including steel, cement, packaged drinking water, LPG cylinders, electrical wires, helmets, and children toys. Ask the AI chat for your specific product.' },
    { q: 'What is the fee structure for BIS certification?', a: 'Fees vary by scheme and company turnover. MSMEs get concessions. Annual license fees range from Rs.1,000 to Rs.5 lakhs. Use the Fee Estimator in the sidebar.' },
    { q: 'What is CRS (Compulsory Registration Scheme)?', a: 'CRS covers electronics like mobiles, laptops, power banks, and LED lights. Unlike ISI it requires self-declaration and registration - no factory inspection for most products.' },
    { q: 'How often do BIS officials inspect manufacturing units?', a: 'Under regular surveillance, BIS officials inspect units at least once a year. High-risk products may have more frequent surprise inspections.' },
    { q: 'How do I renew my expired ISI License?', a: 'Renewal applications must be submitted via the Manak Online portal at least one month before expiration, along with the production details and renewal fee.' }
  ] : [
    { q: 'How do I verify an ISI mark or gold hallmark?', a: 'Use the Verify ISI/HUID tool in the sidebar. For HUID enter the 6-character code, for ISI enter the CM/L number. You can also verify at bis.gov.in.' },
    { q: 'What is gold hallmarking and why is it mandatory?', a: 'BIS Hallmarking certifies gold purity. Since January 2021 it is mandatory. Each piece has a unique 6-character HUID traceable to the jeweller and assay centre.' },
    { q: 'How do I file a complaint about poor quality products?', a: 'Navigate to the Complaints section in the sidebar. You can file a detailed report, which is assigned a Tracking ID for BIS officials to review.' },
    { q: 'How long does a complaint take to resolve?', a: 'Normal priority: 7-10 working days. High/urgent (safety risk): escalated within 24-48 hours. Track progress using your complaint Tracking ID.' },
    { q: 'How do I join a BIS Standards Club?', a: 'Use the Community & Labs section in the sidebar to find and request membership. Membership is free for students and requires admin approval within 3-5 working days.' },
    { q: 'What should I do if a retailer refuses to give a bill for hallmarked gold?', a: 'A proper GST bill with the HUID details is mandatory. You should immediately report the jeweller through the Complaints Hub.' }
  ];

  return (
    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <AlertCircle size={28} color="var(--accent)" /> {t('helpFaq')}
        </h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('faqSubtitle')}</p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800, marginBottom: 32 }}>
        {faqItems.map((item, i) => (
          <details key={i} className="faq-details" style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 16, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <summary style={{ fontWeight: 600, color: 'var(--text-primary)', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {item.q}
              <span className="faq-icon" style={{ color: 'var(--accent)', fontSize: '1.2rem', transition: 'transform 0.2s' }}>+</span>
            </summary>
            <p style={{ marginTop: 14, color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, paddingBottom: 4 }}>{item.a}</p>
          </details>
        ))}
      </div>
    </motion.div>
  );
}
