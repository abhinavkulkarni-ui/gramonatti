import { Link, useNavigate } from 'react-router-dom';
import { Sprout, UserCircle, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const navigate = useNavigate();
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
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#101b10]/90 backdrop-blur-md text-white shadow-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 bg-[#8CC63F] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-md">
              <Sprout className="h-6 w-6 text-[#101b10]" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-[#8CC63F] transition-colors">RURALRISE</span>
          </Link>
          
          <div className="flex items-center space-x-8 font-medium">
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-[#8CC63F] transition-colors tracking-wide">Dashboard</Link>
                <Link to="/marketplace" className="hover:text-[#8CC63F] transition-colors tracking-wide">Marketplace</Link>
                <div className="flex items-center space-x-4 pl-6 border-l border-gray-700">
                  <Link to="/profile" className="flex items-center space-x-2 text-sm text-gray-200 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                    <UserCircle className="h-5 w-5 text-[#8CC63F]" />
                    <span>{user.name}</span>
                    <span className="opacity-50 mx-1">|</span>
                    <span className="capitalize text-[#ffb703]">{user.role}</span>
                  </Link>
                  <button onClick={handleLogout} className="p-2 hover:bg-red-500 hover:text-white text-gray-400 rounded-full transition-colors" title="Logout">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="bg-[#8CC63F] hover:bg-[#7ab332] text-[#101b10] px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-[#8CC63F]/20 hover:-translate-y-0.5">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
