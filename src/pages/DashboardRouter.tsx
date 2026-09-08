import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { LogOut, Sun, Moon, LayoutDashboard, FileText, Library, AlertTriangle, Settings, Menu, X, Radio, Globe } from 'lucide-react';
import AdminDashboard from '@/features/dashboard/components/AdminDashboard';
import { GovReporting } from '@/features/dashboard/components/GovReporting';
import Chat from './Chat';
import Logo from '@/components/Logo';
import { AnimatePresence, motion } from 'framer-motion';

export default function DashboardRouter() {
  const { role, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  // Consumer and Manufacturer get the full-screen Chat UI  
  if (role === 'consumer') return <Chat userRole="consumer" />;
  if (role === 'manufacturer') return <Chat userRole="manufacturer" />;

  const [activeTab, setActiveTab] = useState('Dashboard');

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'Licenses', icon: <FileText size={16} /> },
    { label: 'Club Requests', icon: <Library size={16} /> },
    { label: 'Complaints', icon: <AlertTriangle size={16} /> },
    { label: 'Broadcasts', icon: <Radio size={16} /> },
    { label: 'Gov Audit', icon: <Globe size={16} /> },
    { label: 'Settings', icon: <Settings size={16} /> },
  ];

  const handleSignOutConfirm = () => {
    logout();
    navigate('/sign-in');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-body)', color: 'var(--text-primary)', overflow: 'hidden' }}>
      
      {/* Sign Out Confirmation Dialog */}
      <AnimatePresence>
        {showSignOutDialog && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowSignOutDialog(false)}
            />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'var(--bg-glass-strong)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', width: '90%', maxWidth: '400px', position: 'relative', zIndex: 101, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 600 }}>{t('signOut')}?</h3>
              <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)' }}>{t('signOutConfirm') || 'Are you sure you want to sign out of your account?'}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSignOutDialog(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
                  {t('cancel') || 'Cancel'}
                </button>
                <button onClick={handleSignOutConfirm} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--danger)', color: 'white', cursor: 'pointer', fontWeight: 500 }}>
                  {t('signOut') || 'Sign Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Topbar */}
      <div className="topbar mobile-only" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 60, background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-glass)', zIndex: 40, alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={20} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('admin')}</span>
        </div>
        <button className="icon-btn" style={{ background: 'transparent' }} onClick={() => setMobileMenuOpen(true)}>
          <Menu size={20} />
        </button>
      </div>

      <style>{`
        .mobile-only { display: none !important; }
        @media (max-width: 768px) {
          .mobile-only { display: flex !important; }
          .desktop-only { display: none !important; }
          .admin-desktop-topbar { display: none !important; }
          .main-area { margin-top: 60px; height: calc(100dvh - 60px) !important; overflow-y: auto; }
        }
      `}</style>

      {/* Admin Sidebar Desktop */}
      <aside className="sidebar desktop-only" style={{
        width: 240, background: 'var(--bg-glass)', borderRight: '1px solid var(--border-glass)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, backdropFilter: 'var(--blur-glass)'
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="app-logo" style={{ width: 32, height: 32, borderRadius: 10 }}>
            <Logo size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>BIS Saarthi</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Admin Console</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', padding: '0 10px 8px' }}>
            Platform Modules
          </div>
          {navItems.map(item => (
            <button key={item.label} onClick={() => setActiveTab(item.label)} className={`sidebar-item ${activeTab === item.label ? 'active' : ''}`} style={{ fontSize: '0.85rem' }}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="sidebar-item" onClick={toggleTheme} style={{ fontSize: '0.8125rem' }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="sidebar-item" onClick={() => setShowSignOutDialog(true)} style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>
            <LogOut size={15} /> {t('signOut')}
          </button>
        </div>
      </aside>

      {/* Admin Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'none', zIndex: 45 }} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }} style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 280, background: 'var(--bg-glass)', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 40px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Logo size={24} />
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t('admin')}</span>
                </div>
                <button className="icon-btn" onClick={() => setMobileMenuOpen(false)} style={{ background: 'transparent' }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', padding: '0 10px 8px' }}>Navigation</div>
                {navItems.map(item => (
                  <button key={item.label} onClick={() => { setActiveTab(item.label); setMobileMenuOpen(false); }} className={`sidebar-item ${activeTab === item.label ? 'active' : ''}`}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button className="sidebar-item" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button className="sidebar-item" onClick={() => { setMobileMenuOpen(false); setShowSignOutDialog(true); }} style={{ color: 'var(--danger)' }}>
                  <LogOut size={15} />{t('signOut')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Admin Main Layout with Laptop Header */}
      <div className="main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-body)' }}>
        
        {/* Desktop Laptop Topbar */}
        <header className="topbar admin-desktop-topbar" style={{
          height: 56,
          borderBottom: '1px solid var(--border-glass)',
          background: 'var(--bg-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Admin Portal</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{activeTab}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, color: '#10b981' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              Live DB Sync
            </div>

            <button onClick={toggleTheme} className="icon-btn" title="Toggle theme" style={{ width: 32, height: 32, borderRadius: 8 }}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--border-glass)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user?.name || 'Administrator'}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Superuser</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard View */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Routes>
            <Route path="/" element={
              activeTab === 'Gov Audit' ? <GovReporting /> : <AdminDashboard activeTab={activeTab} />
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}



