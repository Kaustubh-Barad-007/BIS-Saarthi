import { motion } from 'framer-motion';
import { ArrowLeft, Info, ShieldCheck, Activity, Globe, Building2 } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';

export function AboutBIS({ setActiveView }: { setActiveView: (v: string) => void }) {
  const { t } = useLanguage();

  const sections = [
    { icon: <ShieldCheck size={22} color="var(--accent)" />, title: 'Who We Are', body: 'The Bureau of Indian Standards (BIS) is the National Standard Body of India established under the BIS Act 2016. It operates under the Ministry of Consumer Affairs, Food & Public Distribution, Government of India.' },
    { icon: <Activity size={22} color="var(--accent)" />, title: 'Our Mission', body: 'To provide safe, reliable and quality goods and services through standardization, conformity assessment, and related services, thereby enhancing the quality of life of the people of India.' },
    { icon: <Globe size={22} color="var(--accent)" />, title: 'Core Activities', list: ['Standards Formulation', 'Product Certification (ISI Mark)', 'Hallmarking of Precious Metals', 'Laboratory Recognition & Testing', 'System Certification (ISO 9001)', 'Consumer Affairs & Awareness', 'Training & Skill Development'] },
    { icon: <Building2 size={22} color="var(--accent)" />, title: 'Key Statistics', stats: [{ label: 'IS Standards', value: '22,000+' }, { label: 'Certified Products', value: '370+' }, { label: 'Testing Labs', value: '800+' }, { label: 'Hallmarking Centres', value: '1,300+' }] },
  ];

  return (
    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Info size={28} color="var(--accent)" /> {t('aboutBis')}
        </h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('aboutSubtitle')}</p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
        {sections.map((section, i) => (
          <div key={i} style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 24, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ padding: 10, background: 'var(--accent-muted)', borderRadius: 12 }}>{section.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{section.title}</h3>
            </div>
            {section.body && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>{section.body}</p>}
            {section.list && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {section.list.map((item, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            )}
            {section.stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {section.stats.map((s, j) => (
                  <div key={j} style={{ background: 'var(--bg-hover)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
