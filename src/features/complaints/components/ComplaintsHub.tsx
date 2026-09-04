import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Send, 
  ChevronRight, 
  Search, 
  Copy, 
  Check, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  FilePlus, 
  X, 
  MessageSquare,
  ShieldCheck,
  Tag,
  Building2,
  Package
} from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useAuth } from '@/app/providers/AuthContext';

interface ComplaintItem {
  id: string;
  subject: string;
  details: string;
  category: string;
  productName?: string | null;
  brand?: string | null;
  priority?: string;
  status: 'pending' | 'in-progress' | 'under-review' | 'resolved' | 'rejected' | string;
  adminNote?: string | null;
  createdAt: string;
  user?: { name: string; email: string };
}

export function ComplaintsHub({ setActiveView, viewParams = {} }: { setActiveView: (v: string) => void, viewParams?: any }) {
  const { t } = useLanguage();
  const { token } = useAuth();
  
  // Tabs & Views
  const [complaintTab, setComplaintTab] = useState<'file' | 'track'>(viewParams?.defaultTab || 'file');

  useEffect(() => {
    if (viewParams?.defaultTab) {
      setComplaintTab(viewParams.defaultTab);
    }
  }, [viewParams]);
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  
  // Submission State
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<{
    id: string;
    fullId: string;
    subject: string;
    date: string;
  } | null>(null);

  // Tracking List & Expanded Items
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);
  
  // Toast & Copy States
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text: string, label = 'Reference ID') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(text);
      showToast(`${label} copied to clipboard!`, 'success');
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  };

  // Fetch Complaints from Backend
  const fetchComplaints = async (query = '') => {
    setLoadingComplaints(true);
    const authToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('jwt_token') || localStorage.getItem('token') || '') : '');
    
    try {
      let url = '/api/complaints';
      if (query.trim()) {
        url += `?search=${encodeURIComponent(query.trim())}`;
      }
      
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const serverList: ComplaintItem[] = Array.isArray(data) ? data : (data.complaints || []);
        
        // Also merge any local session reference IDs stored on this device if not in list
        let storedList: any[] = [];
        try {
          storedList = JSON.parse(localStorage.getItem('bis_tracked_complaints') || '[]');
        } catch {}

        const mergedMap = new Map<string, ComplaintItem>();
        serverList.forEach(item => mergedMap.set(item.id, item));
        
        // For items stored locally that might not be returned in unauthenticated list
        if (!authToken && !query.trim() && storedList.length > 0) {
          storedList.forEach(item => {
            if (!mergedMap.has(item.id)) {
              mergedMap.set(item.id, {
                id: item.id,
                subject: item.subject || 'Registered Grievance',
                details: item.details || 'Grievance submitted from this device.',
                category: item.category || 'general',
                productName: item.productName || null,
                brand: item.brand || null,
                priority: item.priority || 'normal',
                status: item.status || 'pending',
                adminNote: item.adminNote || null,
                createdAt: item.date || new Date().toISOString()
              });
            }
          });
        }

        setComplaints(Array.from(mergedMap.values()));
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Could not fetch complaints.', 'error');
      }
    } catch {
      showToast('Network error while retrieving complaints.', 'error');
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    if (complaintTab === 'track') {
      fetchComplaints(activeSearchTerm);
    }
  }, [complaintTab, activeSearchTerm, token]);

  // Handle Search Submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchTerm(searchQuery);
    fetchComplaints(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearchTerm('');
    fetchComplaints('');
  };

  // Safe Complaint Submission
  const submitComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // Cache form element synchronously before async operation
    const formData = new FormData(form);
    
    const subject = (formData.get('subject') as string)?.trim();
    const details = (formData.get('details') as string)?.trim();
    const category = (formData.get('category') as string) || 'quality';
    const productName = (formData.get('productName') as string)?.trim() || null;
    const brand = (formData.get('brand') as string)?.trim() || null;
    const priority = (formData.get('priority') as string) || 'normal';

    if (!subject || !details) {
      showToast('Please fill in both the Subject and Details fields.', 'error');
      return;
    }

    setComplaintSubmitting(true);
    setComplaintSuccess(null);

    const payload = { subject, details, category, productName, brand, priority };
    const authToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('jwt_token') || localStorage.getItem('token') || '') : '');
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.ok && data.id) {
        const refId = `BIS-${data.id.slice(0, 8).toUpperCase()}`;
        setComplaintSuccess({
          id: refId,
          fullId: data.id,
          subject: data.subject || subject,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        });
        
        // Safely reset the form
        try {
          form.reset();
        } catch {}

        // Store in local history for easy tracking
        try {
          const stored = JSON.parse(localStorage.getItem('bis_tracked_complaints') || '[]');
          stored.unshift({
            id: data.id,
            refId,
            subject: data.subject || subject,
            details,
            category,
            productName,
            brand,
            priority,
            status: 'pending',
            date: new Date().toISOString()
          });
          localStorage.setItem('bis_tracked_complaints', JSON.stringify(stored.slice(0, 25)));
        } catch {}

        showToast('Official Grievance lodged successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to submit grievance. Please try again.', 'error');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      showToast('Could not reach the BIS server. Please check connection.', 'error');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  // Filtered complaints calculation
  const filteredComplaints = useMemo(() => {
    return complaints.filter(item => {
      if (statusFilter === 'pending') return item.status === 'pending';
      if (statusFilter === 'in-progress') return item.status === 'in-progress' || item.status === 'under-review';
      if (statusFilter === 'resolved') return item.status === 'resolved';
      return true;
    });
  }, [complaints, statusFilter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      inProgress: complaints.filter(c => c.status === 'in-progress' || c.status === 'under-review').length,
      resolved: complaints.filter(c => c.status === 'resolved').length
    };
  }, [complaints]);

  // Stepper Stage Calculator
  const getStageIndex = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 4;
      case 'in-progress':
      case 'under-review': return 2; // Step 3 active
      case 'rejected': return 1;
      case 'pending':
      default: return 1; // Step 1 active
    }
  };

  return (
    <motion.div initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} className="page-view" style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <ShieldAlert size={28} color="var(--accent)" /> {t('fileComplaint')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Official portal to report substandard products, counterfeit ISI marks, or track active investigations.
          </p>
        </div>
        <button 
          type="button" 
          onClick={() => setActiveView('chat')} 
          className="btn btn-secondary btn-sm" 
          style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '8px 16px', fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>

      {/* Main Tab Bar */}
      <div className="tab-container" style={{ marginBottom: 28 }}>
        <button 
          type="button" 
          className={`tab ${complaintTab === 'file' ? 'active' : ''}`} 
          onClick={() => setComplaintTab('file')} 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <FilePlus size={17} /> File Grievance
        </button>
        <button 
          type="button" 
          className={`tab ${complaintTab === 'track' ? 'active' : ''}`} 
          onClick={() => setComplaintTab('track')} 
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Search size={17} /> Track Status
          {counts.all > 0 && (
            <span style={{ 
              background: complaintTab === 'track' ? 'rgba(255,255,255,0.25)' : 'var(--bg-hover)', 
              padding: '2px 7px', 
              borderRadius: 12, 
              fontSize: '0.75rem',
              fontWeight: 700 
            }}>
              {counts.all}
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: FILE GRIEVANCE */}
      {complaintTab === 'file' && (
        <div className="panel" style={{ maxWidth: 840 }}>
          {complaintSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ 
                width: 76, 
                height: 76, 
                borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.15)', 
                border: '2px solid rgba(16, 185, 129, 0.3)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 20px' 
              }}>
                <CheckCircle size={40} color="#10b981" />
              </div>

              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                Grievance Registered Successfully
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto 24px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Your formal complaint has been cataloged in the National BIS Grievance Registry. An enforcement officer will examine the provided facts.
              </p>
              
              <div style={{ 
                background: 'var(--bg-glass-strong)', 
                border: '1px solid var(--border-glass)', 
                borderRadius: 18, 
                padding: '22px 32px', 
                display: 'inline-flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 32,
                boxShadow: 'var(--shadow-sm)' 
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Official Reference Number
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                    {complaintSuccess.id}
                  </span>
                  <button 
                    type="button"
                    onClick={() => copyToClipboard(complaintSuccess.id, 'Reference ID')}
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    title="Copy Reference ID"
                  >
                    {copiedId === complaintSuccess.id ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    <span style={{ fontSize: '0.8rem' }}>{copiedId === complaintSuccess.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered on: {complaintSuccess.date}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setComplaintTab('track');
                    setActiveSearchTerm(complaintSuccess.id);
                    setSearchQuery(complaintSuccess.id);
                    setExpandedComplaintId(complaintSuccess.fullId);
                  }} 
                  className="btn btn-primary" 
                  style={{ padding: '12px 28px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                >
                  <Search size={18} /> Track Grievance Status
                </button>
                <button 
                  type="button"
                  onClick={() => setComplaintSuccess(null)} 
                  className="btn btn-secondary" 
                  style={{ padding: '12px 28px', borderRadius: 12, fontWeight: 600 }}
                >
                  File Another Grievance
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={submitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>
                  Grievance Subject <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input 
                  name="subject" 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder="e.g. Spurious ISI mark on bottled drinking water or defective helmet" 
                  style={{ borderRadius: 12, fontSize: '0.95rem' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>Category</label>
                  <select name="category" className="form-input" style={{ borderRadius: 12, fontSize: '0.92rem' }}>
                    <option value="quality">Product Quality / Counterfeit ISI</option>
                    <option value="misleading">Misleading Advertisement / Claims</option>
                    <option value="hallmarking">Hallmarking & Gold Purity Violation</option>
                    <option value="lab_dispute">Laboratory Testing / Certificate Dispute</option>
                    <option value="other">Other Regulatory Violation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>Grievance Priority</label>
                  <select name="priority" className="form-input" style={{ borderRadius: 12, fontSize: '0.92rem' }}>
                    <option value="normal">Normal Priority (Standard Review)</option>
                    <option value="high">High Priority (Immediate Safety / Health Hazard)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                    Product or Standard Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input 
                    name="productName" 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Packaged Drinking Water (IS 14543)" 
                    style={{ borderRadius: 12 }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                    Brand or Manufacturer <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input 
                    name="brand" 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. AquaPure Beverages Ltd." 
                    style={{ borderRadius: 12 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>
                  Factual Details & Evidence <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea 
                  name="details" 
                  required 
                  rows={5} 
                  className="form-input" 
                  placeholder="State the facts clearly: date & location of purchase, store name, batch or CM/L license number if visible, and why you believe it violates BIS standards..."
                  style={{ borderRadius: 12, lineHeight: 1.6, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} color="var(--accent)" /> Grievances are officially reviewed under the BIS Act, 2016.
                </div>

                <button 
                  type="submit" 
                  disabled={complaintSubmitting} 
                  className="btn btn-primary" 
                  style={{ padding: '12px 32px', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {complaintSubmitting ? (
                    <>
                      <RefreshCw size={18} className="spin" /> Registering Grievance...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Submit Formal Grievance
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* VIEW 2: TRACK STATUS (REBUILT FROM SCRATCH) */}
      {complaintTab === 'track' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Search & Instant Lookup Bar */}
          <div className="panel">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 300px' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter BIS Reference (e.g. BIS-8F21A3B0) or search keyword..."
                  className="form-input"
                  style={{ paddingLeft: 42, paddingRight: searchQuery ? 38 : 14, borderRadius: 12, height: 46 }}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={clearSearch}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ height: 46, padding: '0 24px', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Search size={16} /> Track
              </button>

              <button 
                type="button" 
                onClick={() => fetchComplaints(activeSearchTerm)}
                className="btn btn-secondary" 
                style={{ height: 46, padding: '0 16px', borderRadius: 12 }}
                title="Refresh complaints"
              >
                <RefreshCw size={16} className={loadingComplaints ? 'spin' : ''} />
              </button>
            </form>

            {/* Quick Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 4 }}>
                Status Filter:
              </span>
              <button 
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{ 
                  padding: '5px 14px', 
                  borderRadius: 20, 
                  fontSize: '0.82rem', 
                  fontWeight: 600, 
                  border: statusFilter === 'all' ? '1px solid var(--accent)' : '1px solid var(--border-glass)',
                  background: statusFilter === 'all' ? 'var(--accent)' : 'var(--bg-glass-strong)',
                  color: statusFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                All ({counts.all})
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('pending')}
                style={{ 
                  padding: '5px 14px', 
                  borderRadius: 20, 
                  fontSize: '0.82rem', 
                  fontWeight: 600, 
                  border: statusFilter === 'pending' ? '1px solid #fbbf24' : '1px solid var(--border-glass)',
                  background: statusFilter === 'pending' ? 'rgba(245,158,11,0.2)' : 'var(--bg-glass-strong)',
                  color: statusFilter === 'pending' ? '#fbbf24' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Pending ({counts.pending})
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('in-progress')}
                style={{ 
                  padding: '5px 14px', 
                  borderRadius: 20, 
                  fontSize: '0.82rem', 
                  fontWeight: 600, 
                  border: statusFilter === 'in-progress' ? '1px solid #818cf8' : '1px solid var(--border-glass)',
                  background: statusFilter === 'in-progress' ? 'rgba(99,102,241,0.2)' : 'var(--bg-glass-strong)',
                  color: statusFilter === 'in-progress' ? '#818cf8' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                In Progress ({counts.inProgress})
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('resolved')}
                style={{ 
                  padding: '5px 14px', 
                  borderRadius: 20, 
                  fontSize: '0.82rem', 
                  fontWeight: 600, 
                  border: statusFilter === 'resolved' ? '1px solid #00d084' : '1px solid var(--border-glass)',
                  background: statusFilter === 'resolved' ? 'rgba(0,208,132,0.2)' : 'var(--bg-glass-strong)',
                  color: statusFilter === 'resolved' ? '#00d084' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Resolved ({counts.resolved})
              </button>
            </div>
          </div>

          {/* Results Area */}
          {loadingComplaints ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="panel" style={{ height: 110, borderRadius: 18, background: 'var(--bg-glass-strong)', opacity: 0.7, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '60px 24px', borderRadius: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-glass-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FileText size={32} color="var(--text-muted)" style={{ opacity: 0.6 }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                {activeSearchTerm ? 'No matching grievances found' : 'No grievances found'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 460, margin: '0 auto 24px' }}>
                {activeSearchTerm 
                  ? `No records match "${activeSearchTerm}". Try entering another Reference ID or clearing your filter.` 
                  : 'You have not submitted any complaints yet, or no record was found for this session.'}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {activeSearchTerm ? (
                  <button type="button" onClick={clearSearch} className="btn btn-secondary" style={{ borderRadius: 12, fontWeight: 600 }}>
                    Clear Search
                  </button>
                ) : (
                  <button type="button" onClick={() => setComplaintTab('file')} className="btn btn-primary" style={{ borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FilePlus size={16} /> File a New Grievance
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredComplaints.map(item => {
                const refCode = `BIS-${item.id.slice(0, 8).toUpperCase()}`;
                const isExpanded = expandedComplaintId === item.id;
                const stageIndex = getStageIndex(item.status);
                const isPending = item.status === 'pending';
                const isResolved = item.status === 'resolved';
                const isInProgress = item.status === 'in-progress' || item.status === 'under-review';

                return (
                  <div 
                    key={item.id} 
                    className="panel" 
                    style={{ 
                      padding: 0, 
                      borderRadius: 18, 
                      overflow: 'hidden', 
                      boxShadow: 'var(--shadow-sm)',
                      border: isExpanded ? '1px solid var(--border-hover)' : '1px solid var(--border-glass)',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    {/* Card Header Bar */}
                    <div 
                      onClick={() => setExpandedComplaintId(isExpanded ? null : item.id)}
                      style={{ 
                        padding: '18px 22px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        gap: 16,
                        background: isExpanded ? 'var(--bg-hover)' : 'transparent'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                          {/* Reference Number Badge */}
                          <span style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 800, 
                            color: 'var(--text-primary)', 
                            background: 'var(--bg-glass-strong)', 
                            border: '1px solid var(--border-glass)',
                            padding: '4px 10px', 
                            borderRadius: 14,
                            fontFamily: 'monospace'
                          }}>
                            {refCode}
                          </span>

                          {/* Status Badge */}
                          <span className={`pill ${isResolved ? 'pill-green' : isInProgress ? 'pill-blue' : 'pill-amber'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', textTransform: 'capitalize', fontWeight: 700 }}>
                            {isResolved ? <CheckCircle size={13} /> : isInProgress ? <RefreshCw size={13} /> : <Clock size={13} />}
                            {item.status.replace('-', ' ')}
                          </span>

                          {/* Priority Badge */}
                          {item.priority === 'high' && (
                            <span className="pill pill-red" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              Safety Hazard
                            </span>
                          )}

                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, wordBreak: 'break-word' }}>
                          {item.subject}
                        </h4>

                        {/* Metadata Pills */}
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Tag size={13} color="var(--accent)" /> {item.category}
                          </span>
                          {item.productName && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Package size={13} color="#10b981" /> {item.productName}
                            </span>
                          )}
                          {item.brand && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Building2 size={13} color="#818cf8" /> {item.brand}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(refCode, 'Reference ID');
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ borderRadius: 10, padding: '6px 10px' }}
                          title="Copy Reference ID"
                        >
                          {copiedId === refCode ? <Check size={16} color="#00d084" /> : <Copy size={16} />}
                        </button>
                        <ChevronRight 
                          size={20} 
                          color="var(--text-muted)" 
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} 
                        />
                      </div>
                    </div>

                    {/* Expandable Lifecycle & Details */}
                    {isExpanded && (
                      <div style={{ padding: '22px 24px', borderTop: '1px solid var(--border-glass)', background: 'var(--bg-glass-strong)' }}>
                        {/* 4-Stage Visual Lifecycle Stepper */}
                        <div style={{ marginBottom: 26 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                            BIS Grievance Investigation Lifecycle
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                            gap: 12,
                            position: 'relative'
                          }}>
                            {/* Step 1: Registered */}
                            <div style={{ 
                              background: 'var(--bg-card)', 
                              border: `1px solid ${stageIndex >= 1 ? 'var(--accent)' : 'var(--border-glass)'}`, 
                              borderRadius: 14, 
                              padding: '12px 14px' 
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <CheckCircle size={15} color="var(--accent)" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>1. Lodged</span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                                Registered in Central Registry
                              </p>
                            </div>

                            {/* Step 2: Triage */}
                            <div style={{ 
                              background: 'var(--bg-card)', 
                              border: `1px solid ${stageIndex >= 2 ? '#818cf8' : 'var(--border-glass)'}`, 
                              borderRadius: 14, 
                              padding: '12px 14px',
                              opacity: stageIndex >= 2 ? 1 : 0.65
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                {stageIndex >= 2 ? <CheckCircle size={15} color="#818cf8" /> : <Clock size={15} color="var(--text-muted)" />}
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>2. Triage & Review</span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                                Assigned to Enforcement Cell
                              </p>
                            </div>

                            {/* Step 3: Investigation */}
                            <div style={{ 
                              background: 'var(--bg-card)', 
                              border: `1px solid ${stageIndex >= 3 ? '#fbbf24' : 'var(--border-glass)'}`, 
                              borderRadius: 14, 
                              padding: '12px 14px',
                              opacity: stageIndex >= 3 ? 1 : 0.65
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                {stageIndex >= 3 ? <CheckCircle size={15} color="#fbbf24" /> : <Clock size={15} color="var(--text-muted)" />}
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>3. Inspection / Lab</span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                                Testing or Manufacturer Notice
                              </p>
                            </div>

                            {/* Step 4: Resolution */}
                            <div style={{ 
                              background: 'var(--bg-card)', 
                              border: `1px solid ${stageIndex >= 4 ? '#00d084' : 'var(--border-glass)'}`, 
                              borderRadius: 14, 
                              padding: '12px 14px',
                              opacity: stageIndex >= 4 ? 1 : 0.65
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                {stageIndex >= 4 ? <CheckCircle size={15} color="#00d084" /> : <Clock size={15} color="var(--text-muted)" />}
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>4. Action / Closed</span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                                Regulatory action finalized
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Full Complaint Statement */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                            Submitted Statement & Evidence
                          </div>
                          <div style={{ 
                            background: 'var(--bg-card)', 
                            border: '1px solid var(--border-glass)', 
                            borderRadius: 12, 
                            padding: '14px 18px', 
                            fontSize: '0.92rem', 
                            color: 'var(--text-primary)', 
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {item.details}
                          </div>
                        </div>

                        {/* Official Officer Note (If Available) */}
                        {item.adminNote && (
                          <div style={{ 
                            marginBottom: 20, 
                            padding: '16px 20px', 
                            background: 'rgba(59, 130, 246, 0.08)', 
                            border: '1px solid rgba(59, 130, 246, 0.25)', 
                            borderLeft: '4px solid #3b82f6', 
                            borderRadius: 12 
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <ShieldCheck size={17} color="#3b82f6" />
                              <span style={{ fontSize: '0.82rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                                Official Update from BIS Quality Enforcement Cell
                              </span>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                              {item.adminNote}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid var(--border-glass)' }}>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard(refCode, 'Reference ID')}
                            className="btn btn-secondary btn-sm"
                            style={{ borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                          >
                            <Copy size={15} /> Copy Reference Number
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => setActiveView('chat')}
                            className="btn btn-ghost btn-sm"
                            style={{ borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                          >
                            <MessageSquare size={15} color="var(--accent)" /> Ask BIS Saarthi About This Issue
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating In-App Toast System */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 16, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: 28,
              left: '50%',
              background: 'rgba(15, 23, 42, 0.95)',
              border: `1px solid ${toast.type === 'error' ? 'var(--danger)' : '#10b981'}`,
              color: '#ffffff',
              padding: '12px 22px',
              borderRadius: 14,
              fontWeight: 600,
              fontSize: '0.88rem',
              boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backdropFilter: 'blur(12px)'
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
