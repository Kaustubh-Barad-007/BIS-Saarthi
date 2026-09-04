import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Plus, RefreshCcw } from 'lucide-react';
import { ApplyLicenseModal } from './ApplyLicenseModal';

interface LicensePortalProps {
  userLicenses: any[];
  loadingLicenses: boolean;
  fetchLicenses: () => void;
  setActiveView: (view: any) => void;
}

export function LicensePortal({
  userLicenses,
  loadingLicenses,
  fetchLicenses,
  setActiveView
}: LicensePortalProps) {
  const [showApplyLicenseModal, setShowApplyLicenseModal] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="page-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Award size={28} color="var(--accent)" /> Licensee Portal & Applications
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Manage active BIS licenses (CM/L), track application milestones, and file new certification grants.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => setActiveView('chat')}>
            ← Back to Chat
          </button>
          <button className="btn btn-primary" onClick={() => setShowApplyLicenseModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <Plus size={16} /> Apply for BIS License
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ padding: '20px 24px', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 20 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Total Applications</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{userLicenses.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Registered under your account</div>
        </div>
        <div style={{ padding: '20px 24px', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 20 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Active / Approved</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>
            {userLicenses.filter(l => l.status === 'active' || l.status === 'approved').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Compliant CM/L standard marks</div>
        </div>
        <div style={{ padding: '20px 24px', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 20 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>In Review / Pending</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            {userLicenses.filter(l => l.status === 'pending' || l.status === 'under_review').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Factory audit & lab testing stage</div>
        </div>
      </div>

      {/* License Table / List */}
      <div style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Registered Licenses & Grants</h3>
          <button className="btn btn-xs btn-ghost" onClick={fetchLicenses} style={{ borderRadius: 8 }}>
            <RefreshCcw size={13} style={{ marginRight: 4 }} /> Refresh
          </button>
        </div>

        {loadingLicenses ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 64, borderRadius: 12, background: 'var(--bg-hover)', opacity: 0.6 }} />
            ))}
          </div>
        ) : userLicenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-hover)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Award size={28} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No BIS Licenses Found</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 420, margin: '0 auto 20px' }}>
              You have not registered any product licenses under this account yet. Submit an application to begin conformity assessment.
            </p>
            <button className="btn btn-primary" onClick={() => setShowApplyLicenseModal(true)} style={{ fontWeight: 600 }}>
              <Plus size={16} style={{ marginRight: 6 }} /> Apply for New License
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', textAlign: 'left' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Application / License ID</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Product Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Standard (IS Code)</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Date Applied</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {userLicenses.map((lic: any) => (
                  <tr key={lic.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {lic.licenseNo || `APP-${lic.id.slice(0, 8).toUpperCase()}`}
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {lic.product}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className="pill pill-blue" style={{ fontWeight: 600 }}>{lic.isCode}</span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(lic.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className={`pill ${lic.status === 'active' || lic.status === 'approved' ? 'pill-green' : lic.status === 'rejected' ? 'pill-red' : 'pill-amber'}`}>
                        {lic.status === 'active' ? 'Active' : lic.status === 'approved' ? 'Approved' : lic.status === 'under_review' ? 'Under Review' : lic.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showApplyLicenseModal && (
        <ApplyLicenseModal onClose={() => setShowApplyLicenseModal(false)} />
      )}
    </motion.div>
  );
}
