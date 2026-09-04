import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Layers, Users, Beaker, MapPin, Search, Star, CheckCircle, X } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useAuth } from '@/app/providers/AuthContext';

export function CommunityLabs({ setActiveView, viewParams = {} }: { setActiveView: (v: string) => void, viewParams?: any }) {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [communityTab, setCommunityTab] = useState<'clubs' | 'labs'>(viewParams?.defaultTab || 'clubs');

  useEffect(() => {
    if (viewParams?.defaultTab) {
      setCommunityTab(viewParams.defaultTab);
    }
  }, [viewParams]);
  const [labSearch, setLabSearch] = useState(false);
  const [labResults, setLabResults] = useState<any[] | null>(null);
  const [labState, setLabState] = useState('');
  const [labProduct, setLabProduct] = useState('');
  
  const [clubsSearch, setClubsSearch] = useState('');
  const [clubsResults, setClubsResults] = useState<any[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);

  // In-app Join Club Dialog
  const [clubToJoin, setClubToJoin] = useState<any | null>(null);
  const [submittingJoin, setSubmittingJoin] = useState(false);

  useEffect(() => {
    if (communityTab === 'clubs') {
      const fetchClubs = async () => {
        setLoadingClubs(true);
        try {
          const headers: any = {};
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(`/api/clubs?q=${encodeURIComponent(clubsSearch)}`, { headers });
          if (res.ok) {
            const data = await res.json();
            const reqMap: any = {};
            if (data.userRequests) {
              data.userRequests.forEach((r: any) => { reqMap[r.clubId] = r.status; });
            }
            setClubsResults(data.clubs.map((c: any) => ({ ...c, __status: reqMap[c.id] })));
          }
        } catch {} finally { setLoadingClubs(false); }
      };
      const debounceTimeout = setTimeout(fetchClubs, 300);
      return () => clearTimeout(debounceTimeout);
    }
  }, [clubsSearch, communityTab, token]);

  const confirmJoinClub = async () => {
    if (!clubToJoin) return;
    if (!token) {
      showToast('Please sign in to join a Standards Club', 'error');
      setClubToJoin(null);
      return;
    }
    setSubmittingJoin(true);
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clubId: clubToJoin.id })
      });
      if (res.ok) {
        showToast('Join request submitted to BIS Administrator!', 'success');
        setClubsResults(prev => prev.map(c => c.id === clubToJoin.id ? { ...c, __status: 'pending' } : c));
        setClubToJoin(null);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to submit join request', 'error');
      }
    } catch {
      showToast('Network error while joining club', 'error');
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleLabSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLabSearch(true);
    setLabResults(null);
    try {
      const res = await fetch(`/api/labs?state=${encodeURIComponent(labState)}&product=${encodeURIComponent(labProduct)}`);
      if (res.ok) {
        const data = await res.json();
        setLabResults(data.labs);
      } else {
        setLabResults([]);
      }
    } catch {
      setLabResults([]);
    } finally {
      setLabSearch(false);
    }
  };

  return (
    <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} className="page-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Layers size={28} color="var(--accent)" /> {t('communityLabs')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Find BIS-recognized conformity testing laboratories and join educational Standards Clubs in your region.
          </p>
        </div>
        <button onClick={() => setActiveView('chat')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10 }}>
          <ArrowLeft size={16} /> Back to Chat
        </button>
      </div>

      <div className="tab-container" style={{ marginBottom: 28, maxWidth: 420 }}>
        <button className={`tab ${communityTab === 'clubs' ? 'active' : ''}`} onClick={() => setCommunityTab('clubs')} style={{ flex: 1, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Users size={16} /> Standards Clubs
        </button>
        <button className={`tab ${communityTab === 'labs' ? 'active' : ''}`} onClick={() => setCommunityTab('labs')} style={{ flex: 1, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Beaker size={16} /> Testing Labs
        </button>
      </div>

      {communityTab === 'labs' && (
        <div style={{ maxWidth: 1000 }}>
          <form onSubmit={handleLabSearch} className="panel" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', padding: '24px' }}>
            <div className="form-group" style={{ flex: '1 1 250px', margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>{t('searchLabsState')}</label>
              <input type="text" value={labState} onChange={e => setLabState(e.target.value)} placeholder="e.g. Maharashtra" className="form-input" style={{ height: 46 }} />
            </div>
            <div className="form-group" style={{ flex: '1 1 250px', margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>{t('searchLabsProduct')}</label>
              <input type="text" value={labProduct} onChange={e => setLabProduct(e.target.value)} placeholder="e.g. Drinking Water" className="form-input" style={{ height: 46 }} />
            </div>
            <button type="submit" disabled={labSearch} className="btn btn-primary" style={{ height: 46, padding: '0 28px', flex: '0 0 auto', fontWeight: 600 }}>
              {labSearch ? 'Searching...' : <><Search size={18} /> Search Labs</>}
            </button>
          </form>

          {labResults && (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>{labResults.length} Recognized Labs Found</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {labResults.map((lab: any, index: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                    key={lab.id} 
                    className="panel" 
                    style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span className="pill pill-blue" style={{ fontSize: '0.7rem' }}>OSL ID: {lab.id}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Star size={14} fill="currentColor" /> {lab.rating}
                      </div>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>{lab.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                      <MapPin size={14} /> {lab.city}, {lab.state}
                    </div>
                    
                    <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Capabilities</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {lab.capabilities.map((cap: string, i: number) => (
                          <span key={i} style={{ fontSize: '0.75rem', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: 6 }}>{cap}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {communityTab === 'clubs' && (
        <div style={{ maxWidth: 1000 }}>
          <div style={{ position: 'relative', marginBottom: 24, maxWidth: 600 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" value={clubsSearch} onChange={e => setClubsSearch(e.target.value)} placeholder="Search Standards Clubs by school or region..." className="form-input" style={{ paddingLeft: 48, height: 48 }} />
          </div>

          {loadingClubs ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>{[1,2,3,4].map(i => <div key={i} style={{ height: 180, borderRadius: 20, background: 'var(--bg-glass-strong)', opacity: 0.6 }} />)}</div>
          ) : clubsResults.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No Standards Clubs found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {clubsResults.map((club, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                  key={club.id} 
                  className="panel" 
                  style={{ padding: 24, display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={24} color="#3b82f6" />
                    </div>
                    <span className="pill pill-blue" style={{ fontSize: '0.7rem' }}>{club.membersCount} Members</span>
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{club.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                    <MapPin size={14} /> {club.school}, {club.region}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20, flex: 1 }}>{club.description}</p>
                  
                  {club.__status === 'approved' ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600 }}>
                      <CheckCircle size={18} /> Member
                    </div>
                  ) : club.__status === 'pending' ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '10px 0', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600 }}>
                      Request Pending
                    </div>
                  ) : (
                    <button onClick={() => setClubToJoin(club)} className="btn btn-primary" style={{ width: '100%', borderRadius: 10, height: 42, fontWeight: 600 }}>
                      Join Club
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* In-app Join Confirmation Dialog */}
      <AnimatePresence>
        {clubToJoin && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="modal"
              style={{ maxWidth: 460 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={22} color="var(--accent)" /> Join Standards Club
                </h3>
                <button onClick={() => setClubToJoin(null)} className="icon-btn" style={{ background: 'transparent' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {clubToJoin.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  {clubToJoin.school}, {clubToJoin.region}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {clubToJoin.description}
                </p>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                Submitting this request will register you for BIS student activities, exposure visits to testing laboratories, and youth standards competitions.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setClubToJoin(null)} className="btn btn-ghost" style={{ borderRadius: 10 }}>
                  Cancel
                </button>
                <button onClick={confirmJoinClub} disabled={submittingJoin} className="btn btn-primary" style={{ borderRadius: 10, fontWeight: 600 }}>
                  {submittingJoin ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-app Toast Dialog */}
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
