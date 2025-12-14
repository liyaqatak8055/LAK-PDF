import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Heart, ChevronRight, X, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from './Button';
import { AuthModal } from './AuthModal';
import { AboutModal } from './AboutModal';
import { ContactModal } from './ContactModal';
import { PrivacyModal } from './PrivacyModal';
import { TermsModal } from './TermsModal';
import { authService, User } from '../services/authService';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Modal State
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Merge PDF', path: '/merge' },
    { label: 'Split PDF', path: '/split' },
    { label: 'Compress PDF', path: '/compress' },
    { label: 'Convert PDF', path: '/convert' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f9]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-[#ff8a80] flex items-center justify-center text-white shadow-lg shadow-primary-400/20 transition-transform group-hover:scale-105">
                <Heart className="w-6 h-6 fill-current" strokeWidth={2} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">
                LAK <span className="text-primary-400">PDF</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    location.pathname === link.path 
                      ? 'text-slate-900 bg-slate-100' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                     <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-500">
                       <UserIcon className="w-3.5 h-3.5" />
                     </div>
                     <span className="text-sm font-medium text-slate-700">{user.name}</span>
                   </div>
                   <Button variant="ghost" size="sm" onClick={handleLogout} title="Log out">
                     <LogOut className="w-4 h-4 text-slate-400 hover:text-red-500" />
                   </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>Log in</Button>
                  <Button variant="primary" size="sm" onClick={() => openAuth('signup')}>Sign up</Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 p-4 flex flex-col gap-2 shadow-xl animate-in slide-in-from-top-2 duration-200 z-40">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium flex justify-between items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
            <div className="h-px bg-slate-100 my-2"></div>
            
            {user ? (
              <div className="space-y-3">
                <div className="px-4 py-2 flex items-center gap-3">
                   <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-500">
                     <UserIcon className="w-4 h-4" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900">{user.name}</p>
                     <p className="text-xs text-slate-500">{user.email}</p>
                   </div>
                </div>
                <Button variant="danger" className="w-full justify-start px-4" onClick={handleLogout}>
                   <LogOut className="w-4 h-4 mr-2" /> Log Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="w-full" onClick={() => openAuth('login')}>Log in</Button>
                <Button variant="primary" className="w-full" onClick={() => openAuth('signup')}>Sign up</Button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onLoginSuccess={(u) => setUser(u)}
      />

      {/* Info Modals */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-400 flex items-center justify-center text-white font-bold">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <span className="font-bold text-slate-800">LAK PDF</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                We make PDF handling easy. Merge, split, compress, and convert your documents securely in the browser.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/merge" className="hover:text-primary-400">Merge PDF</Link></li>
                <li><Link to="/split" className="hover:text-primary-400">Split PDF</Link></li>
                <li><Link to="/compress" className="hover:text-primary-400">Compress PDF</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <button onClick={() => setIsAboutOpen(true)} className="hover:text-primary-400 text-left">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsContactOpen(true)} className="hover:text-primary-400 text-left">
                    Contact
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-primary-400 text-left">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => setIsTermsOpen(true)} className="hover:text-primary-400 text-left">
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm flex items-center justify-center gap-1">
            <span>2024 LAK PDF. Made with</span>
            <Heart className="w-4 h-4 text-red-400 fill-current" />
            <span>for the web.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};