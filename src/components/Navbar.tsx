import { Link, useNavigate } from 'react-router-dom';
import { Sprout, UserCircle, LogOut } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-green-950/90 backdrop-blur-md text-white shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 bg-green-500 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-md">
              <Sprout className="h-6 w-6 text-green-50" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-green-300 transition-colors">RURALRISE</span>
          </Link>
          
          <div className="flex items-center space-x-8 font-medium">
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-green-300 transition-colors tracking-wide">Dashboard</Link>
                <Link to="/marketplace" className="hover:text-green-300 transition-colors tracking-wide">Marketplace</Link>
                <div className="flex items-center space-x-4 pl-6 border-l border-green-800">
                  <Link to="/profile" className="flex items-center space-x-2 text-sm text-green-100 bg-green-900/50 hover:bg-green-800/80 px-3 py-1.5 rounded-full border border-green-800 transition-colors">
                    <UserCircle className="h-5 w-5 text-green-400" />
                    <span>{user.name}</span>
                    <span className="opacity-50 mx-1">|</span>
                    <span className="capitalize text-green-300">{user.role}</span>
                  </Link>
                  <button onClick={handleLogout} className="p-2 hover:bg-red-500 hover:text-white text-green-300 rounded-full transition-colors" title="Logout">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="bg-yellow-500 hover:bg-yellow-600 text-green-950 px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-yellow-500/20">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
