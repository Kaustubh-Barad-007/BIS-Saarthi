import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Upload, Download, Trash2, ShieldCheck, Activity, Search } from 'lucide-react';

export function DocumentVault({ setActiveView }: { setActiveView: (v: string) => void }) {
  const documents = [
    { name: 'Factory_License_2024.pdf', size: '2.4 MB', date: 'Oct 12, 2024', category: 'License' },
    { name: 'Water_Quality_NABL_Report.pdf', size: '4.1 MB', date: 'Nov 05, 2024', category: 'Test Report' },
    { name: 'Machinery_Layout.png', size: '1.2 MB', date: 'Nov 18, 2024', category: 'Drawing' }
  ];

  return (
    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <FileText size={28} color="var(--accent)" /> Document Vault
        </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Securely manage your BIS application documents, test reports, and licenses.</p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>
      
      <div className="card" style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Stored Files</h3>
          <button className="btn btn-primary btn-sm" style={{ gap: 6, borderRadius: 'var(--radius-md)' }}>
            <Upload size={14} /> Upload Document
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {documents.map((file, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
              key={i} 
              className="panel"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 16, flexWrap: 'wrap', gap: 10 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 8, background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 10 }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{file.size}</span>
                    <span>{file.date}</span>
                    <span style={{ color: 'var(--accent)' }}>{file.category}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: '0 10px', height: 32 }}><Download size={14} /></button>
                <button className="btn btn-ghost btn-sm" style={{ padding: '0 10px', height: 32, color: 'var(--danger)' }}><Trash2 size={14} /></button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <ShieldCheck size={18} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--success)', lineHeight: 1.5, margin: 0 }}>
            <strong>End-to-End Encrypted.</strong> Documents uploaded to the vault are cryptographically secured and exclusively accessible by authorized BIS agents during your application review.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
