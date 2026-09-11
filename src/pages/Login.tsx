import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sprout } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('laborer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, role })
      });
      const data = await res.json();
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (!data.user.profileCompleted) {
          navigate('/profile');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth URL fetch error:', error);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Allow messages from localhost and run.app for OAuth
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const payload = event.data.payload;
        try {
          const res = await fetch('/api/auth/google/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            if (!data.user.profileCompleted) navigate('/profile');
            else navigate('/dashboard');
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center bg-green-50 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-green-900/5 p-8 border border-green-100"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Sprout className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-950">
            Welcome to RuralRise
          </h2>
          <p className="text-green-700/70 text-center mt-2 text-sm">
            Sign in or create an account to get started.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-4 border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition mb-6 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">Phone Number</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g. 9876543210"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('laborer')}
                className={`px-4 py-3 rounded-xl border transition ${role === 'laborer' ? 'bg-green-50 border-green-500 text-green-700' : 'border-green-200 text-green-600 hover:bg-green-50/50'}`}
              >
                Laborer
              </button>
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`px-4 py-3 rounded-xl border transition ${role === 'farmer' ? 'bg-green-50 border-green-500 text-green-700' : 'border-green-200 text-green-600 hover:bg-green-50/50'}`}
              >
                Farmer/Org
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition shadow-lg shadow-green-600/20 disabled:opacity-70 flex justify-center"
          >
            {loading ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Continue with Phone'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
