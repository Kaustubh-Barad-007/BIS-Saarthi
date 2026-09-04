import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MessageSquare, Activity, AlertTriangle, CheckCircle2, TrendingUp, Shield, Library, FileText, Upload, Settings, Info, X, Megaphone } from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { useLanguage } from "@/app/providers/LanguageContext";

interface Stats {
  totalUsers: number;
  totalComplaints: number;
  queriesToday: number;
  activeSessions: number;
  recentComplaints?: any[];
}


export default function AdminDashboard({ activeTab = "Dashboard" }: { activeTab?: string }) {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalComplaints: 0, queriesToday: 0, activeSessions: 0 });
  const [loading, setLoading] = useState(true);
  const { token: contextToken } = useAuth();
  const token = contextToken || (typeof window !== "undefined" ? (localStorage.getItem("jwt_token") || localStorage.getItem("token") || "") : "");
  const { t } = useLanguage();

  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [allLicenses, setAllLicenses] = useState<any[]>([]);
  const [clubRequests, setClubRequests] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [bTitle, setBTitle] = useState("");
  const [bContent, setBContent] = useState("");
  const [bCodes, setBCodes] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [selectedClubReq, setSelectedClubReq] = useState<any>(null);
  const [updateNote, setUpdateNote] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [showBroadcastSuccessModal, setShowBroadcastSuccessModal] = useState(false);
  const [lastBroadcastInfo, setLastBroadcastInfo] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  const [grantModalLicense, setGrantModalLicense] = useState<{ id: string; licenseNo: string } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setStats(await res.json());
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Realtime polling every 5s
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const fetchTabData = async () => {
      const authToken = token || (typeof window !== "undefined" ? (localStorage.getItem("jwt_token") || localStorage.getItem("token") || "") : "");
      if (activeTab === "Licenses") {
        fetch("/api/licenses", { headers: { Authorization: `Bearer ${authToken}` } })
          .then(res => res.json())
          .then(data => setAllLicenses(Array.isArray(data) ? data : []))
          .catch(err => console.error(err));
      } else if (activeTab === "Complaints") {
        fetch("/api/complaints", { headers: { Authorization: `Bearer ${authToken}` } })
          .then(res => res.json())
          .then(data => setAllComplaints(Array.isArray(data) ? data : (data.complaints || [])))
          .catch(err => console.error(err));
      } else if (activeTab === "Club Requests") {
        fetch("/api/clubs", { headers: { Authorization: `Bearer ${authToken}` } })
          .then(res => res.json())
          .then(data => setClubRequests(Array.isArray(data.userRequests) ? data.userRequests : []))
          .catch(err => console.error(err));
      } else if (activeTab === "Broadcasts") {
        fetch("/api/sync?type=broadcast", { headers: { Authorization: `Bearer ${authToken}` } })
          .then(res => res.json())
          .then(data => setBroadcasts(Array.isArray(data) ? data : []))
          .catch(err => console.error(err));
      }
    };
    
    fetchTabData();
    const interval = setInterval(fetchTabData, 5000);
    return () => clearInterval(interval);
  }, [activeTab, token]);

  const saveModalComplaint = async () => {
    if (!selectedComplaint) return;
    const activeToken = token || (typeof window !== "undefined" ? (localStorage.getItem("jwt_token") || localStorage.getItem("token") || "") : "");
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeToken}` },
        body: JSON.stringify({ id: selectedComplaint.id, status: updateStatus, adminNote: updateNote })
      });
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (res.ok) {
        setAllComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, status: updateStatus, adminNote: updateNote } : c));
        setSelectedComplaint(null);
        setUpdateNote("");
        setUpdateStatus("");
        showToast("Complaint updated successfully!", "success");
      } else {
        showToast(data.error || `Failed to update complaint. Status: ${res.status}`, "error");
      }
    } catch (err: any) { showToast(`Network error: ${err.message || 'Could not connect to server'}`, "error"); }
  };

  const saveModalClubReq = async () => {
    if (!selectedClubReq) return;
    const activeToken = token || (typeof window !== "undefined" ? (localStorage.getItem("jwt_token") || localStorage.getItem("token") || "") : "");
    try {
      const res = await fetch("/api/clubs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeToken}` },
        body: JSON.stringify({ requestId: selectedClubReq.id, status: updateStatus })
      });
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (res.ok) {
        setClubRequests(prev => prev.map(r => r.id === selectedClubReq.id ? { ...r, status: updateStatus } : r));
        setSelectedClubReq(null);
        setUpdateStatus("");
        showToast("Club request updated successfully!", "success");
      } else {
        showToast(data.error || `Failed to update club request. Status: ${res.status}`, "error");
      }
    } catch (err: any) { showToast(`Network error: ${err.message || 'Could not connect to server'}`, 'error'); }
  };

  const handleUpdateLicense = async (id: string, status: string, customLicenseNo?: string) => {
    if (status === "active" && !customLicenseNo) {
      setGrantModalLicense({ id, licenseNo: `CM/L-${Math.floor(1000000 + Math.random() * 9000000)}` });
      return;
    }
    const activeToken = token || (typeof window !== "undefined" ? (localStorage.getItem("jwt_token") || localStorage.getItem("token") || "") : "");
    try {
      const res = await fetch("/api/licenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeToken}` },
        body: JSON.stringify({ id, status, licenseNo: customLicenseNo })
      });
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (res.ok) {
        setAllLicenses(prev => prev.map(l => l.id === id ? { ...l, status, licenseNo: customLicenseNo || l.licenseNo } : l));
        showToast("License status updated successfully!", "success");
        setGrantModalLicense(null);
      } else {
        showToast(data.error || `Failed to update license. Status: ${res.status}`, "error");
      }
    } catch (err: any) { showToast(`Network error: ${err.message || 'Could not connect to server'}`, "error"); }
  };
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle || !bContent) return;
    const activeToken = token || (typeof window !== "undefined" ? (localStorage.getItem("jwt_token") || localStorage.getItem("token") || "") : "");
    if (!activeToken) {
      showToast("Session expired. Please refresh the page or sign in again.", "error");
      return;
    }
    setIsBroadcasting(true);
    try {
      const res = await fetch("/api/sync?type=broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${activeToken}` },
        body: JSON.stringify({ title: bTitle, content: bContent, affectedISCodes: bCodes })
      });
      
      let data;
      try { data = await res.json(); } catch { data = {}; }
      
      if (res.ok) {
        setBroadcasts([data, ...broadcasts]);
        setLastBroadcastInfo({ title: bTitle, content: bContent, affectedISCodes: bCodes });
        setShowBroadcastSuccessModal(true);
        setBTitle(""); setBContent(""); setBCodes("");
      } else {
        showToast(data.error || `Failed to publish broadcast. Status: ${res.status}`, "error");
      }
    } catch (err: any) { 
      showToast(`Network error: ${err.message || 'Could not connect to server'}`, 'error');
    } finally { 
      setIsBroadcasting(false); 
    }
  };

  const cards = [
    { icon: <Users size={20} />, label: "Registered Users", value: stats.totalUsers, change: "+12%", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
    { icon: <MessageSquare size={20} />, label: "Queries Today", value: stats.queriesToday, change: "+8%", color: "#00d084", bg: "rgba(0,208,132,0.1)" },
    { icon: <Activity size={20} />, label: "Active Sessions", value: stats.activeSessions, change: "+3%", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
    { icon: <AlertTriangle size={20} />, label: "Complaints Filed", value: stats.totalComplaints, change: "-5%", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  ];

  const Skeleton = () => (
    <div style={{ height: 24, borderRadius: 6, background: "var(--bg-hover)", animation: "shimmer 1.5s infinite ease-in-out", width: "60%" }} />
  );

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{activeTab}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: 4 }}>
          {activeTab === "Dashboard" ? "Real-time metrics from your BIS database" : "Manage your " + activeTab}
        </p>
      </div>


      {activeTab === "Licenses" && (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-glass)" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Manufacturer Licenses</h2>
          </div>
          <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="data-table" style={{ width: "100%", minWidth: 780 }}>
            <thead>
              <tr><th>Req ID</th><th>Manufacturer</th><th>IS Code / Product</th><th>License No</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {allLicenses.map((l: any) => (
                <tr key={l.id}>
                  <td><span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--text-muted)" }}>#{l.id.slice(0,8).toUpperCase()}</span></td>
                  <td style={{ fontWeight: 500 }}>{l.user?.name || l.user?.email || "Unknown"}</td>
                  <td><span className="pill pill-blue" style={{ marginBottom: 4 }}>{l.isCode}</span><br /><span style={{ fontSize: "0.8rem", color: "var(--text-muted)"}}>{l.product}</span></td>
                  <td>{l.licenseNo ? <span style={{ fontFamily: "monospace", color: "var(--accent)", fontWeight: 700 }}>{l.licenseNo}</span> : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Pending</span>}</td>
                  <td>
                    <select
                      value={l.status}
                      onChange={(e) => handleUpdateLicense(l.id, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid var(--border-glass)", background: "var(--bg-glass-strong)", color: "var(--text-primary)", fontSize: "0.8125rem", cursor: "pointer" }}
                    >
                      <option value="pending">Pending Review</option>
                      <option value="active">Active (Granted)</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                    {l.validUntil ? new Date(l.validUntil).toLocaleDateString("en-IN") : "-"}
                  </td>
                </tr>
              ))}
              {allLicenses.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><p>No licenses found.</p></div></td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {activeTab === "Complaints" && (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-glass)" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>All Consumer Complaints</h2>
          </div>
          <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="data-table" style={{ width: "100%", minWidth: 780 }}>
            <thead>
              <tr><th>ID</th><th>User</th><th>Subject</th><th>Status</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              {allComplaints.map((c: any) => (
                <tr key={c.id}>
                  <td><span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--text-muted)", cursor: "pointer" }} title={c.id}>#{c.id.slice(0,8).toUpperCase()}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.user?.name || c.user?.email || "Unknown"}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.details}>{c.subject}</td>
                  <td>
                    <span className='pill pill-amber' style={{ textTransform: 'capitalize' }}>{c.status.replace('_', ' ')}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                     <button className="btn btn-xs btn-ghost" style={{ borderRadius: 8 }} onClick={() => { setSelectedComplaint(c); setUpdateStatus(c.status); setUpdateNote(c.adminNote || ""); }}>View & Update</button>
                  </td>
                </tr>
              ))}
              {allComplaints.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon"><Shield size={24} style={{ opacity: 0.4 }} /></div><p>No complaints found.</p></div></td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {activeTab === "Club Requests" && (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-glass)" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Standards Club Join Requests</h2>
          </div>
          <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="data-table" style={{ width: "100%", minWidth: 780 }}>
            <thead>
              <tr><th>Request ID</th><th>User</th><th>Club Name</th><th>Status</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              {clubRequests.map((r: any) => (
                <tr key={r.id}>
                  <td><span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--text-muted)" }}>#{r.id.slice(0,8).toUpperCase()}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.user?.name || r.user?.email || "Unknown"}</td>
                  <td>{r.clubName}</td>
                  <td>
                    <span className='pill pill-amber' style={{ textTransform: 'capitalize' }}>{r.status}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                     <button className="btn btn-xs btn-ghost" style={{ borderRadius: 8 }} onClick={() => { setSelectedClubReq(r); setUpdateStatus(r.status); }}>View & Update</button>
                  </td>
                </tr>
              ))}
              {clubRequests.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon"><Users size={24} style={{ opacity: 0.4 }} /></div><p>No club requests found.</p></div></td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {activeTab === "Broadcasts" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="panel" style={{ padding: "28px" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Megaphone size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em" }}>Publish New Broadcast</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>Dispatches instantaneous advisories to all citizens, consumers, and manufacturers.</p>
              </div>
            </div>

            <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Announcement Title</label>
                <input required value={bTitle} onChange={e => setBTitle(e.target.value)} type="text" className="form-input" style={{ borderRadius: 10 }} placeholder="e.g., Mandatory QCO Notification for Footwear Products" />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Broadcast Content</label>
                <textarea required value={bContent} onChange={e => setBContent(e.target.value)} rows={4} className="form-input" style={{ borderRadius: 10, resize: 'vertical' }} placeholder="Provide thorough details, enforcement dates, gazette notifications, or consumer advisories..."></textarea>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Affected IS Codes (Optional)</label>
                <input value={bCodes} onChange={e => setBCodes(e.target.value)} type="text" className="form-input" style={{ borderRadius: 10 }} placeholder="e.g. IS 10500, IS 15298" />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Leave blank to broadcast to all users, or enter comma-separated IS codes for targeted radar alerts.</p>
              </div>
              <button disabled={isBroadcasting} type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', borderRadius: 10, height: 44, padding: '0 24px', fontWeight: 600 }}>
                {isBroadcasting ? "Publishing..." : "Publish Broadcast"}
              </button>
            </form>
          </div>

          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-glass)" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Recent Broadcasts</h2>
            </div>
            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="data-table" style={{ width: "100%", minWidth: 640 }}>
              <thead>
                <tr><th>Date</th><th>Title</th><th>Affected Codes</th></tr>
              </thead>
              <tbody>
                {broadcasts.map((b: any) => (
                  <tr key={b.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>{new Date(b.createdAt).toLocaleDateString("en-IN")}</td>
                    <td style={{ fontWeight: 500 }}>{b.title}</td>
                    <td>{b.affectedISCodes ? <span className='pill pill-blue'>{b.affectedISCodes}</span> : <span style={{color: 'var(--text-muted)'}}>General</span>}</td>
                  </tr>
                ))}
                {broadcasts.length === 0 && (
                  <tr><td colSpan={3}><div className="empty-state"><p>No broadcasts found.</p></div></td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Dashboard" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
            {cards.map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
                <div className="stat-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{card.label}</div>
                  {loading ? <Skeleton /> : (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: "1.625rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{card.value.toLocaleString()}</span>
                      <span style={{ fontSize: "0.75rem", color: card.change.startsWith("+") ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{card.change}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Recent Complaints</h2>
              <span className="pill pill-blue">{stats.recentComplaints?.length || 0} recent</span>
            </div>
            {loading ? (
              <div className="chat-loading"><span className="spinner" /> Loading data...</div>
            ) : (
              <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table className="data-table" style={{ width: "100%", minWidth: 680 }}>
                <thead><tr><th>ID</th><th>User</th><th>Subject</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {(stats.recentComplaints || []).map((c: any) => (
                    <tr key={c.id}>
                      <td><span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--text-muted)" }}>#{c.id}</span></td>
                      <td style={{ fontWeight: 500 }}>{c.user}</td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject}</td>
                      <td><span className='pill pill-amber'>{c.status}</span></td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>{new Date(c.date).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                  {(!stats.recentComplaints || stats.recentComplaints.length === 0) && (
                    <tr><td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state-icon"><CheckCircle2 size={24} style={{ color: "var(--success)" }} /></div>
                        <p style={{ fontWeight: 600 }}>All clear - no complaints yet</p>
                        <p style={{ fontSize: "0.8125rem" }}>When users file complaints, they'll appear here</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {[
              { name: "ISI Mark Scheme", count: "16,000+", icon: <Shield size={18} />, color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
              { name: "Hallmarking Scheme", count: "1.2L+", icon: <CheckCircle2 size={18} />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
              { name: "CRS (Electronics)", count: "240+", icon: <Activity size={18} />, color: "#00d084", bg: "rgba(0,208,132,0.1)" },
              { name: "FMCS Scheme", count: "89+", icon: <TrendingUp size={18} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.name}</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginTop: 2 }}>{s.count}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </>
      )}
      {activeTab === "Settings" && (
        <div className="panel" style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}><Settings size={28} color="var(--accent)" /> Admin Settings</h2>
            <p style={{ color: "var(--text-secondary)" }}>Manage your administrator account and global platform configurations.</p>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = fd.get('name') as string;
            const password = fd.get('password') as string;
            try {
              const res = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, password: password || undefined })
              });
              let data;
              try { data = await res.json(); } catch(e) { throw new Error("Invalid server response format"); }
              if (res.ok) showToast("Settings saved successfully.", "success");
              else throw new Error(data.error || `HTTP Error ${res.status}`);
            } catch (err: any) { showToast(`Failed to save settings: ${err.message || 'Unknown network error'}`, "error"); }
          }}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Administrator Name</label>
              <input name="name" className="form-input" placeholder="Update your name" defaultValue="" />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">New Password</label>
              <input name="password" type="password" className="form-input" placeholder="Leave blank to keep current password" />
            </div>
            
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 32, marginBottom: 16, borderBottom: '1px solid var(--border-glass)', paddingBottom: 12 }}>Platform Configuration</h3>
            
            <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-glass-strong)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Maintenance Mode</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Temporarily disable user access for system upgrades.</div>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 20, height: 20, accentColor: 'var(--accent)' }} />
                </label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-glass-strong)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Debug Logs</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enable detailed logging for AI Retrieval Pipeline.</div>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ width: 20, height: 20, accentColor: 'var(--accent)' }} />
                </label>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ padding: '0 32px', height: 48, fontWeight: 600, borderRadius: 12 }}>Save Settings</button>
          </form>
        </div>
      )}

      {/* Modals with Consumer-matched Design & Animations */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="modal-backdrop">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              transition={{ duration: 0.2 }} 
              className="modal" style={{ maxWidth: 560, maxHeight: "calc(100vh - 48px)", overflowY: "auto" }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                  <Shield size={22} color="var(--accent)" />
                  Complaint #{selectedComplaint.id.slice(0,8).toUpperCase()}
                </h2>
                <button 
                  onClick={() => setSelectedComplaint(null)} 
                  style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24, background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: 16 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Complainant</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                    {selectedComplaint.user?.name || selectedComplaint.user?.email || "Unknown"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Subject</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                    {selectedComplaint.subject}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Complaint Details</span>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, background: 'var(--bg-body)', padding: 12, borderRadius: 10, border: '1px solid var(--border-glass)', maxHeight: 150, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                    {selectedComplaint.details}
                  </div>
                </div>
                {(selectedComplaint.productName || selectedComplaint.brand) && (
                  <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border-glass)', paddingTop: 10 }}>
                    {selectedComplaint.productName && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Product: </span>
                        <strong style={{ fontSize: '0.85rem' }}>{selectedComplaint.productName}</strong>
                      </div>
                    )}
                    {selectedComplaint.brand && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Brand: </span>
                        <strong style={{ fontSize: '0.85rem' }}>{selectedComplaint.brand}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Update Status</label>
                <select className="form-input" value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} style={{ borderRadius: 10 }}>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Admin Note (Dispatched to User)</label>
                <textarea className="form-input" rows={3} value={updateNote} onChange={e => setUpdateNote(e.target.value)} placeholder="Type a note explaining resolution or current status..." style={{ borderRadius: 10 }} />
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" style={{ padding: '0 20px', height: 44 }} onClick={() => setSelectedComplaint(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ padding: '0 24px', height: 44, fontWeight: 600 }} onClick={saveModalComplaint}>Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedClubReq && (
          <div className="modal-backdrop">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              transition={{ duration: 0.2 }} 
              className="modal" style={{ maxWidth: 480, maxHeight: "calc(100vh - 48px)", overflowY: "auto" }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                  <Library size={22} color="var(--accent)" />
                  Club Request #{selectedClubReq.id.slice(0,8).toUpperCase()}
                </h2>
                <button 
                  onClick={() => setSelectedClubReq(null)} 
                  style={{ background: 'var(--bg-hover)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, background: 'var(--bg-glass-strong)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: 16 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Applicant</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{selectedClubReq.user?.name || selectedClubReq.user?.email || "Unknown"}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Standards Club</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{selectedClubReq.clubName}</div>
                </div>
                {selectedClubReq.schoolName && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Institution / School</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{selectedClubReq.schoolName}</div>
                  </div>
                )}
                {selectedClubReq.district && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>District</span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{selectedClubReq.district}</div>
                  </div>
                )}
              </div>
              
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Update Status</label>
                <select className="form-input" value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} style={{ borderRadius: 10 }}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" style={{ padding: '0 20px', height: 44 }} onClick={() => setSelectedClubReq(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ padding: '0 24px', height: 44, fontWeight: 600 }} onClick={saveModalClubReq}>Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Broadcast Success Modal */}
      <AnimatePresence>
        {showBroadcastSuccessModal && (
          <div className="modal-backdrop">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              transition={{ duration: 0.2 }} 
              className="modal" style={{ maxWidth: 460, maxHeight: "calc(100vh - 48px)", overflowY: "auto" }}
            >
              <div style={{ textAlign: "center", padding: "12px 8px 16px" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(16,185,129,0.12)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <CheckCircle2 size={32} />
                </div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  Broadcast Published Successfully
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
                  This official broadcast announcement is now live and dispatched to all user feeds and notifications.
                </p>

                {lastBroadcastInfo && (
                  <div style={{ textAlign: "left", background: "var(--bg-glass-strong)", border: "1px solid var(--border-glass)", borderRadius: 14, padding: "14px 16px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>Announcement Title</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{lastBroadcastInfo.title}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>Target Scope</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 2 }}>
                        {lastBroadcastInfo.affectedISCodes ? `Products tracking IS ${lastBroadcastInfo.affectedISCodes} + All Users` : 'All Registered Users & Public Citizens'}
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%", height: 44, fontWeight: 600, borderRadius: 10 }} 
                  onClick={() => setShowBroadcastSuccessModal(false)}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}



