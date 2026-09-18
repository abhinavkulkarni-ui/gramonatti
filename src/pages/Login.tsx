import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Sprout, ArrowRight } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('laborer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuthSuccess = async (userCredential: any, selectedRole: string) => {
    const user = userCredential.user;
    
    // Check if user document exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    let userData;
    if (userSnap.exists()) {
      userData = userSnap.data();
    } else {
      // Create new user document
      userData = {
        id: user.uid,
        name: user.displayName || 'New User',
        email: user.email,
        role: selectedRole,
        phone: user.phoneNumber || 'Not provided',
        location: 'Unknown',
        profileCompleted: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, userData);
    }
    
    localStorage.setItem('user', JSON.stringify(userData));
    if (!userData.profileCompleted) {
      navigate('/profile');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleAuthSuccess(userCredential, role);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await handleAuthSuccess(userCredential, role);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'permission-denied') {
        setError('Firestore permission denied. Please update your Firestore Security Rules.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized domains.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await handleAuthSuccess(userCredential, role);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      const isIframe = window !== window.top;
      let errorMsg = err.message || 'Google authentication failed.';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Sign-in popup was closed.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMsg = 'This domain is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized domains.';
      }

      if (isIframe && (err.code === 'auth/unauthorized-domain' || err.code.includes('popup'))) {
        errorMsg += ' (Note: Google Sign-in often fails inside preview iframes. Please click "Open in new tab" at the top right of this preview and try again!)';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center bg-amber-50/30 px-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-[#101b10] -skew-y-3 origin-top-left -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-[#101b10]/10 p-8 border border-gray-100 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 bg-[#8CC63F]/10 rounded-full flex items-center justify-center mb-4 relative">
            <Sprout className="h-10 w-10 text-[#8CC63F] relative z-10" />
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border border-[#8CC63F]/30 rounded-full border-dashed"
            ></motion.div>
          </div>
          <h2 className="text-3xl font-extrabold text-[#101b10]">
            {isLogin ? 'Welcome Back' : 'Join RuralRise'}
          </h2>
          <p className="text-gray-500 text-center mt-2 text-sm">
            {isLogin ? 'Enter your details to access your dashboard.' : 'Create an account to start your journey.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center mb-6 border border-red-100 font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-200 transition-all mb-6 shadow-sm disabled:opacity-50"
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
          <div className="flex-1 h-px bg-gray-100"></div>
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">OR</span>
          <div className="flex-1 h-px bg-gray-100"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#8CC63F] focus:ring-0 outline-none transition-colors bg-gray-50/50 focus:bg-white"
              placeholder="e.g. user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#8CC63F] focus:ring-0 outline-none transition-colors bg-gray-50/50 focus:bg-white"
              placeholder="••••••••"
              required
            />
          </div>
          
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">I am joining as a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('laborer')}
                      className={`px-4 py-3 rounded-xl border-2 transition-all font-bold ${role === 'laborer' ? 'bg-[#8CC63F]/10 border-[#8CC63F] text-[#699a2a]' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                    >
                      Laborer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('farmer')}
                      className={`px-4 py-3 rounded-xl border-2 transition-all font-bold ${role === 'farmer' ? 'bg-[#8CC63F]/10 border-[#8CC63F] text-[#699a2a]' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                    >
                      Farmer / Org
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-[#101b10] hover:bg-[#1a2b1a] text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>{isLogin ? 'Sign In Securely' : 'Create Account'} <ArrowRight className="h-5 w-5" /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="font-bold text-[#8CC63F] hover:text-[#699a2a] transition-colors"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
