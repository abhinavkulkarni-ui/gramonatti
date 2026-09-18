import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserCircle, LogOut, Menu, X, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import RuralRiseLogo from './RuralRiseLogo';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
    localStorage.removeItem('user');
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Dashboard', path: user ? '/dashboard' : '/login' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdfbf7]/90 backdrop-blur-md text-[#1a281f] border-b border-[#e2eae3] shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Gramonnati Rural Rise Realistic Brand Logo */}
          <Link to="/" className="flex items-center group transition-transform hover:scale-[1.02]">
            <RuralRiseLogo size="md" showText={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? 'text-[#143d24] bg-[#e6f1e8] shadow-xs'
                    : 'text-[#415b49] hover:text-[#143d24] hover:bg-[#eef4ee]'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#1b6b3b] rounded-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-[#143d24] bg-white/90 hover:bg-[#f0f7f2] px-3.5 py-1.5 rounded-full border border-[#cddfc0] shadow-xs transition"
                >
                  <UserCircle className="h-4 w-4 text-[#2d6a4f]" />
                  <span className="max-w-[120px] truncate">{user.name || 'User'}</span>
                  <span className="text-[10px] bg-gradient-to-r from-[#14532d] to-[#15803d] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#5f7365] hover:text-red-600 hover:bg-red-50 rounded-full transition"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-[#143d24] hover:text-[#166534] px-3 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#14532d] via-[#166534] to-[#15803d] hover:brightness-110 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span>Register</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#fde047]" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#143d24] hover:bg-[#eef4ee] transition"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#fdfbf7] border-b border-[#e2eae3] px-6 py-4 space-y-3 animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-base font-semibold ${
                isActive(link.path)
                  ? 'bg-[#e6f1e8] text-[#143d24]'
                  : 'text-[#415b49] hover:bg-gray-100'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#e2eae3] flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white text-[#143d24] font-semibold border border-[#cddfc0]"
                >
                  <span>{user.name} ({user.role})</span>
                  <UserCircle className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-600 font-semibold hover:bg-red-50 rounded-xl"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-[#14532d] text-white py-3 rounded-full font-semibold shadow-md"
              >
                Quick Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

