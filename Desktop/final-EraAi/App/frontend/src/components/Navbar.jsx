import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Zap, Trophy, LogOut, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import AuthModal from './AuthModal';

const CentaurLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="15" stroke="#00BCD4" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M8 22 C8 18 10 16 12 14 L14 10 L16 8 L18 10 L20 14 C22 16 24 18 24 22" stroke="#00BCD4" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M12 22 L12 26 M16 22 L16 27 M20 22 L20 26" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="16" cy="8" r="3" fill="#00BCD4" opacity="0.8"/>
    <path d="M14 14 L18 14" stroke="#00BCD4" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function Navbar({ transparent = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !transparent
          ? 'bg-dark-bg/90 backdrop-blur-xl border-b border-dark-border shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <CentaurLogo />
            </motion.div>
            <span className="text-xl font-black gradient-text tracking-tight">eraAI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Home', path: '/' },
              { label: 'Leaderboard', path: '/leaderboard' },
              { label: 'For Recruiters', path: '/recruiters' },
            ].map(item => (
              <Link key={item.path} to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-primary bg-primary/10'
                    : 'text-primary hover:bg-primary/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-card border border-dark-border hover:border-primary/40 transition-all duration-200 text-sm font-medium"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`text-text-secondary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden"
                    >
                      <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-dark-hover transition-colors">
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <Link to="/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-dark-hover transition-colors">
                        <User size={15} /> AI Passport
                      </Link>
                      <Link to="/results" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-dark-hover transition-colors">
                        <Trophy size={15} /> Results
                      </Link>
                      <div className="border-t border-dark-border" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-danger hover:bg-danger/10 transition-colors">
                        <LogOut size={15} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAuthModal({ open: true, tab: 'login' })}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold btn-glow transition-all duration-200">
                  Login
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (location.pathname === '/') {
                      window.dispatchEvent(new CustomEvent('openChatbot'));
                    } else {
                      navigate('/', { state: { openChatbot: true } });
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold btn-glow transition-all duration-200"
                >
                  <Zap size={14} />
                  Get Started
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-text-secondary hover:text-white transition-colors">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-card border-t border-dark-border"
          >
            <div className="px-4 py-3 space-y-1">
              {[
                { label: 'Home', path: '/' },
                { label: 'Leaderboard', path: '/leaderboard' },
                { label: 'For Recruiters', path: '/recruiters' },
              ].map(item => (
                <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-white hover:bg-dark-hover transition-colors">
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-primary hover:bg-dark-hover transition-colors">Dashboard</Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors">Logout</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); setAuthModal({ open: true, tab: 'login' }); }}
                    className="w-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-white hover:bg-dark-hover rounded-lg transition-colors text-left"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('openChatbot')); }}
                    className="w-full px-3 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-sm font-semibold mt-2"
                  >
                    Get Started →
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>

    <AuthModal
      isOpen={authModal.open}
      onClose={() => setAuthModal(p => ({ ...p, open: false }))}
      defaultTab={authModal.tab}
    />
    </>
  );
}
