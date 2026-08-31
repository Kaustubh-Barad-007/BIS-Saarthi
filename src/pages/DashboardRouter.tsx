import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useLanguage } from '@/lib/LanguageContext';
import { LogOut, Sun, Moon, Activity, FileText, Library, AlertTriangle, Settings, Menu, X } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import Chat from './Chat';
import Logo from '@/components/Logo';
import { AnimatePresence, motion } from 'framer-motion';

export default function DashboardRouter() {
  const { role, logout } = useAuth();
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
    { label: 'Dashboard', icon: <Activity size={16} /> },
    { label: 'Licenses', icon: <FileText size={16} /> },
    { label: 'Club Requests', icon: <Library size={16} /> },
    { label: 'Complaints', icon: <AlertTriangle size={16} /> },
    { label: 'RAG Evaluation', icon: <Activity size={16} /> },
    { label: 'Settings', icon: <Settings size={16} /> },
  ];

  const handleSignOutConfirm = () => {
    logout();
    navigate('/sign-in');
  };

  // Admin gets a dashboard layout
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
      <div className="admin-mobile-topbar" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 60, background: 'var(--bg-glass-strong)', backdropFilter: 'none', borderBottom: '1px solid var(--border-glass)', zIndex: 40, alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={20} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('admin')}</span>
        </div>
        <button className="icon-btn" style={{ background: 'transparent' }} onClick={() => setMobileMenuOpen(true)}>
          <Menu size={20} />
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-mobile-topbar { display: flex !important; }
          .admin-sidebar { display: none !important; }
          .admin-main { margin-top: 60px; height: calc(100vh - 60px) !important; }
        }
      `}</style>

      {/* Admin Sidebar Desktop */}
      <div className="admin-sidebar" style={{
        width: 250, background: 'var(--bg-glass-strong)', borderRight: '1px solid var(--border-glass)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, backdropFilter: 'var(--blur-glass)'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="app-logo" style={{ width: 32, height: 32, borderRadius: 12 }}>
            <Logo size={20} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('admin')}</span>
        </div>
        <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', padding: '0 10px 8px' }}>Navigation</div>
          {navItems.map(item => (
            <button key={item.label} onClick={() => setActiveTab(item.label)} className={`admin-nav-item ${activeTab === item.label ? 'active' : ''}`}>
              {item.icon} {t(item.label.toLowerCase().replace(' ', '')) || item.label}
            </button>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="admin-nav-item" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}
          </button>
          <button className="admin-nav-item" onClick={() => setShowSignOutDialog(true)} style={{ color: 'var(--danger)' }}>
            <LogOut size={15} />{t('signOut')}
          </button>
        </div>
      </div>

      {/* Admin Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'none', zIndex: 45 }} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.3 }} style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 280, background: 'var(--bg-glass-strong)', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 40px rgba(0,0,0,0.5)' }}>
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
                  <button key={item.label} onClick={() => { setActiveTab(item.label); setMobileMenuOpen(false); }} className={`admin-nav-item ${activeTab === item.label ? 'active' : ''}`}>
                    {item.icon} {t(item.label.toLowerCase().replace(' ', '')) || item.label}
                  </button>
                ))}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button className="admin-nav-item" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  {theme === 'dark' ? t('lightMode') || 'Light Mode' : t('darkMode') || 'Dark Mode'}
                </button>
                <button className="admin-nav-item" onClick={() => { setMobileMenuOpen(false); setShowSignOutDialog(true); }} style={{ color: 'var(--danger)' }}>
                  <LogOut size={15} />{t('signOut')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Admin Main */}
      <div className="admin-main" style={{ flex: 1, overflow: 'auto', height: '100vh', background: 'var(--bg-body)' }}>
        <Routes>
          <Route path="/" element={<AdminDashboard activeTab={activeTab} />} />
        </Routes>
      </div>
    </div>
  );
}
