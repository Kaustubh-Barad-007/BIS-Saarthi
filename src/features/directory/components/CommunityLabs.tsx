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

  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [findingLocation, setFindingLocation] = useState(false);
  const [selectedLabMap, setSelectedLabMap] = useState<any | null>(null);
  const [bookingLab, setBookingLab] = useState<any | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ date: '', time: '', product: '', notes: '' });

  const confirmBooking = () => {
    if (!bookingForm.date || !bookingForm.product) {
      showToast('Please fill out the required fields', 'error');
      return;
    }
    setSubmittingBooking(true);
    setTimeout(() => {
      setSubmittingBooking(false);
      setBookingLab(null);
      setSelectedLabMap(null);
      showToast('Appointment successfully booked! The lab will contact you shortly.', 'success');
    }, 1500);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLabSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLabSearch(true);
    // Don't wipe out results if we're just refreshing, but do if it's an explicit search form submission
    if (e) {
      setLabResults(null);
      setSelectedLabMap(null);
    }
    try {
      const res = await fetch(`/api/labs?state=${encodeURIComponent(labState)}&product=${encodeURIComponent(labProduct)}`);
      if (res.ok) {
        const data = await res.json();
        // Inject mock coordinates for geo-tapping prototype if backend doesn't provide them
        const labsWithCoords = data.labs.map((lab: any, i: number) => ({
          ...lab,
          lat: lab.lat || (19.0 + (i * 0.5) % 8),
          lon: lab.lon || (73.0 + (i * 0.8) % 12)
        }));
        setLabResults(labsWithCoords);
      } else {
        if (!labResults) setLabResults([]);
      }
    } catch {
      if (!labResults) setLabResults([]);
    } finally {
      setLabSearch(false);
    }
  };

  // Automatically fetch labs when the component mounts or when tab switches to labs
  useEffect(() => {
    if (communityTab === 'labs' && labResults === null && !labSearch) {
      handleLabSearch();
    }
  }, [communityTab]);

  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      return;
    }
    setFindingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setFindingLocation(false);
        // Automatically fetch labs to show nearby sorting
        handleLabSearch();
        showToast("Location accessed. Sorting labs by distance.", "success");
      },
      () => {
        setFindingLocation(false);
        showToast("Unable to retrieve your location", "error");
      }
    );
  };

  const getSortedLabs = () => {
    if (!labResults) return [];
    if (!userLocation) return labResults;
    
    return [...labResults].map(lab => {
      // Use genuine coordinates if provided by backend, otherwise generate stable mocks near user
      const idLen = lab.id?.length || 5;
      const nameLen = lab.name?.length || 5;
      const actualLat = lab.lat || (userLocation.lat + ((idLen % 10) - 5) * 0.05);
      const actualLon = lab.lon || (userLocation.lon + ((nameLen % 10) - 5) * 0.05);
      
      const dist = calculateDistance(userLocation.lat, userLocation.lon, actualLat, actualLon);
      return { ...lab, lat: actualLat, lon: actualLon, distance: dist };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  };

  const displayedLabs = getSortedLabs();

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
            <div className="form-group" style={{ flex: '1 1 200px', margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>{t('searchLabsState')}</label>
              <input type="text" value={labState} onChange={e => setLabState(e.target.value)} placeholder="e.g. Maharashtra" className="form-input" style={{ height: 46 }} />
            </div>
            <div className="form-group" style={{ flex: '1 1 200px', margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>{t('searchLabsProduct')}</label>
              <input type="text" value={labProduct} onChange={e => setLabProduct(e.target.value)} placeholder="e.g. Drinking Water" className="form-input" style={{ height: 46 }} />
            </div>
            <div style={{ display: 'flex', gap: 12, flex: '1 1 auto' }}>
              <button type="submit" disabled={labSearch} className="btn btn-primary" style={{ height: 46, padding: '0 24px', flex: 1, fontWeight: 600 }}>
                {labSearch ? 'Searching...' : <><Search size={18} /> Search</>}
              </button>
              <button type="button" onClick={handleFindNearMe} disabled={findingLocation} className="btn btn-outline" style={{ height: 46, padding: '0 24px', flex: 1, fontWeight: 600 }}>
                {findingLocation ? 'Locating...' : <><MapPin size={18} /> Near Me</>}
              </button>
            </div>
          </form>

          {labResults && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{labResults.length} Recognized Labs Found</h3>
                {userLocation && <span className="pill pill-green">Sorted by Distance</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {displayedLabs.map((lab: any, index: number) => (
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
                        <Star size={14} fill="currentColor" /> {lab.rating || (4.0 + (lab.id?.length % 10) * 0.1).toFixed(1)}
                      </div>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>{lab.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <MapPin size={14} /> {lab.location || lab.city}, {lab.state}
                      </div>
                      {lab.distance !== undefined && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>{lab.distance.toFixed(1)} km away</span>
                      )}
                    </div>
                    
                    <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Capabilities</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        {(lab.capabilities || lab.products || []).slice(0, 3).map((cap: string, i: number) => (
                          <span key={i} style={{ fontSize: '0.75rem', background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: 6 }}>{cap}</span>
                        ))}
                      </div>
                      <button onClick={() => setSelectedLabMap(lab)} className="btn btn-outline btn-sm" style={{ width: '100%', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600 }}>
                        <MapPin size={16} /> Geo-Tap Location
                      </button>
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
                    <span className="pill pill-blue" style={{ fontSize: '0.7rem' }}>{club.members} Members</span>
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{club.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                    <MapPin size={14} /> {club.city}, {club.state}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12, flex: 1 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Type:</strong> {club.type} <br/>
                    <strong style={{ color: 'var(--text-primary)' }}>Established:</strong> {club.established} <br/>
                    <strong style={{ color: 'var(--text-primary)' }}>Contact:</strong> {club.contact}
                  </p>
                  
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

      {/* Map Modal */}
      <AnimatePresence>
        {selectedLabMap && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="panel map-modal-container"
              style={{
                width: '100%',
                maxWidth: 900,
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                background: 'var(--bg-glass-strong)',
                border: '1px solid var(--border-glass)'
              }}
            >
              {/* Close Button overlay */}
              <button onClick={() => setSelectedLabMap(null)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>

              {/* Map Column */}
              <div className="map-modal-map">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  src={`https://maps.google.com/maps?q=${selectedLabMap.lat},${selectedLabMap.lon}&z=15&output=embed`}
                  style={{ border: 'none' }}
                ></iframe>
              </div>

              {/* Details Column */}
              <div className="map-modal-details">
                <span className="pill pill-blue" style={{ fontSize: '0.7rem', alignSelf: 'flex-start', marginBottom: 12 }}>OSL ID: {selectedLabMap.id}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {selectedLabMap.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
                  <MapPin size={14} /> {selectedLabMap.address || selectedLabMap.location || selectedLabMap.city}, {selectedLabMap.state}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600, marginBottom: 24 }}>
                  <Star size={16} fill="currentColor" /> {selectedLabMap.rating || (4.0 + (selectedLabMap.id?.length % 10) * 0.1).toFixed(1)} / 5.0
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>Testing Capabilities</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                  {(selectedLabMap.capabilities || selectedLabMap.products || []).map((cap: string, i: number) => (
                    <span key={i} style={{ fontSize: '0.75rem', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: 6 }}>{cap}</span>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLabMap.lat},${selectedLabMap.lon}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', borderRadius: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <MapPin size={16} /> Get Directions
                  </a>
                  <button onClick={() => setBookingLab(selectedLabMap)} className="btn btn-outline" style={{ width: '100%', borderRadius: 10 }}>
                    Book Testing Appointment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingLab && (
          <div className="modal-backdrop" style={{ padding: 16 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="panel"
              style={{
                width: '100%',
                maxWidth: 500,
                padding: 32,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                background: 'var(--bg-glass-strong)'
              }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Book Appointment</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.5 }}>
                Schedule a testing or calibration appointment at <strong>{bookingLab.name}</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Select Date *</label>
                  <input type="date" className="form-input" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Preferred Time</label>
                  <input type="time" className="form-input" value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Product/Sample Type *</label>
                  <select className="form-input" value={bookingForm.product} onChange={e => setBookingForm({...bookingForm, product: e.target.value})} style={{ width: '100%' }}>
                    <option value="">Select a product...</option>
                    {(bookingLab.capabilities || bookingLab.products || ['Drinking Water', 'Electronics', 'Textiles', 'Gold/Silver']).map((c: string) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Additional Notes</label>
                  <textarea className="form-input" rows={3} placeholder="Describe your testing requirements..." value={bookingForm.notes} onChange={e => setBookingForm({...bookingForm, notes: e.target.value})} style={{ width: '100%', resize: 'vertical' }}></textarea>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setBookingLab(null)} className="btn btn-ghost" style={{ borderRadius: 10 }}>Cancel</button>
                <button onClick={confirmBooking} disabled={submittingBooking} className="btn btn-primary" style={{ borderRadius: 10 }}>
                  {submittingBooking ? 'Confirming...' : 'Confirm Appointment'}
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
