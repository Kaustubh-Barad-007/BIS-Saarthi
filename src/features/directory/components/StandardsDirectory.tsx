import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Library, Search } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';

export function StandardsDirectory({ setActiveView }: { setActiveView: (v: string) => void }) {
  const { t } = useLanguage();
  const [standardsSearch, setStandardsSearch] = useState('');
  const [loadingStandards, setLoadingStandards] = useState(true);
  const [standardsResults, setStandardsResults] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/standards')
      .then(res => res.json())
      .then(data => {
        if (data.standards) {
          setStandardsResults(data.standards.map((s: any) => ({
            code: s.code,
            title: s.title,
            mandatory: s.mandatory,
            scheme: s.scheme || 'Scheme-I',
            category: s.category || 'General'
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStandards(false));
  }, []);

  const filteredResults = standardsResults.filter(s => 
    s.code.toLowerCase().includes(standardsSearch.toLowerCase()) || 
    s.title.toLowerCase().includes(standardsSearch.toLowerCase())
  );

  return (
    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><Library size={28} color="var(--accent)" /> {t('standardsDir')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('standardsSubtitle')}</p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>
      
      <div style={{ position: 'relative', maxWidth: 800, marginBottom: 24 }}>
        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" placeholder={t('standardsSearchPlaceholder')} className="form-input" style={{ paddingLeft: 48, height: 52 }} value={standardsSearch} onChange={e => setStandardsSearch(e.target.value)} />
      </div>

      {loadingStandards ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 20, background: 'var(--bg-glass-strong)', opacity: 0.6 }} />)}</div>
      ) : filteredResults.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>{t('noStandards')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
          {filteredResults.map((std: any, i: number) => (
            <div key={i} style={{ padding: 20, background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent)' }}>{std.code}</h3>
                {std.mandatory && <span className="pill pill-red" style={{ fontSize: '0.7rem' }}>{t('mandatory')} ({std.scheme})</span>}
                {!std.mandatory && <span className="pill pill-blue" style={{ fontSize: '0.7rem' }}>{t('voluntary')}</span>}
              </div>
              <p style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>{std.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Library size={14} /> {std.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
