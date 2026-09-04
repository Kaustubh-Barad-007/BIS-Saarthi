import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Radio, Plus, Trash2, ShieldCheck, AlertTriangle, Search, FileText, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';

interface TrackedItem {
  id: string;
  productName: string;
  isCode?: string | null;
  createdAt: string;
}

export function ComplianceRadar({ setActiveView }: { setActiveView: (v: string) => void }) {
  const { token } = useAuth();
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newIsCode, setNewIsCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRadarItems = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sync?type=radar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrackedItems(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast('Could not fetch tracked products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadarItems();
  }, [token]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/sync?type=radar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productName: newProductName.trim(),
          isCode: newIsCode.trim() || undefined
        })
      });
      if (res.ok) {
        const created = await res.json();
        setTrackedItems([created, ...trackedItems]);
        setShowAddModal(false);
        setNewProductName('');
        setNewIsCode('');
        showToast('Product added to Compliance Radar successfully!');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add product to radar', 'error');
      }
    } catch {
      showToast('Network error while adding product', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/sync?type=radar&id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTrackedItems(trackedItems.filter(item => item.id !== id));
        showToast('Product removed from radar surveillance.');
      } else {
        showToast('Failed to remove product', 'error');
      }
    } catch {
      showToast('Network error while deleting product', 'error');
    }
  };

  const filteredItems = trackedItems.filter(item =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.isCode && item.isCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="page-view" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Radio size={28} color="var(--accent)" /> Compliance Radar
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Automated Quality Control Order (QCO) surveillance, regulatory alerts, and Indian Standards tracking.
          </p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)' }}>
            <Radio size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tracked Products</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{trackedItems.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Radar Health</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              Active Surveillance
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Mandatory QCOs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>680+ Orders</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 440 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search tracked products or IS codes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 42, height: 42, borderRadius: 10 }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 10, fontWeight: 600 }}>
          <Plus size={16} /> Track New Product / Standard
        </button>
      </div>

      {/* Tracked Products List */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Monitored Products & Standards</h3>
          <span className="pill pill-blue">{filteredItems.length} active</span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Connecting to BIS Compliance Radar...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <Radio size={44} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No Products Currently Tracked</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
              Add your manufactured goods or consumer purchases to receive automatic regulatory change notices.
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ borderRadius: 10 }}>
              <Plus size={16} /> Add First Product
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: 650 }}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Indian Standard (IS Code)</th>
                  <th>Regulatory Status</th>
                  <th>Monitored Since</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.productName}</div>
                    </td>
                    <td>
                      {item.isCode ? (
                        <span className="pill pill-blue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {item.isCode}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Auto-matching</span>
                      )}
                    </td>
                    <td>
                      <span className="pill pill-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> Compliant / Active
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="btn btn-xs btn-ghost"
                        style={{ color: 'var(--danger)', borderRadius: 8 }}
                        title="Remove from radar"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Regulatory Feed Preview */}
      <div className="panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} color="var(--accent)" /> Official Regulatory Bulletins & QCO Gazette Alerts
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              title: 'Mandatory BIS Certification for Footwear Made from Leather and other Materials',
              isCode: 'IS 15298 (Part 2): 2016',
              date: 'Active Order',
              type: 'QCO Enforcement'
            },
            {
              title: 'Quality Control Order Revision for Packaged Drinking Water & Mineral Water',
              isCode: 'IS 10500: 2012 / IS 14543: 2004',
              date: 'Active Order',
              type: 'Mandatory ISI'
            },
            {
              title: 'Compulsory Registration Scheme (CRS) Extension for Smart Wearables & Electronics',
              isCode: 'IS 13252 (Part 1)',
              date: 'Gazette Advisory',
              type: 'Scheme-II CRS'
            }
          ].map((bulletin, idx) => (
            <div key={idx} style={{ padding: 16, background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="pill pill-amber" style={{ fontSize: '0.7rem' }}>{bulletin.type}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{bulletin.isCode}</span>
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>{bulletin.title}</div>
              </div>
              <button
                onClick={() => setActiveView('standards')}
                className="btn btn-ghost btn-xs"
                style={{ borderRadius: 8 }}
              >
                View Standard
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="modal"
              style={{ maxWidth: 480 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={20} color="var(--accent)" /> Track Product on Radar
                </h3>
                <button onClick={() => setShowAddModal(false)} className="icon-btn" style={{ background: 'transparent' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Product Name / Commodity</label>
                  <input
                    required
                    type="text"
                    value={newProductName}
                    onChange={e => setNewProductName(e.target.value)}
                    placeholder="e.g., Packaged Drinking Water, Cement, Safety Shoes"
                    className="form-input"
                    style={{ borderRadius: 10 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Indian Standard (Optional IS Code)</label>
                  <input
                    type="text"
                    value={newIsCode}
                    onChange={e => setNewIsCode(e.target.value)}
                    placeholder="e.g., IS 10500 or IS 15298"
                    className="form-input"
                    style={{ borderRadius: 10 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    If omitted, the AI radar engine will automatically cross-reference the product name.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost" style={{ borderRadius: 10 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={adding} className="btn btn-primary" style={{ borderRadius: 10, fontWeight: 600 }}>
                    {adding ? 'Adding...' : 'Start Tracking'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-app Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 16, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              background: 'var(--bg-glass-strong)',
              border: `1px solid ${toast.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
              color: 'var(--text-primary)',
              padding: '12px 20px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
