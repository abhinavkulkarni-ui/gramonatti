import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sprout } from 'lucide-react';
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
        setError('Firestore permission denied. Please update your Firestore Security Rules to allow read/write.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('This sign-in method is disabled. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Add it to Firebase Console (Authentication > Settings > Authorized domains).');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
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
      if (err.code === 'permission-denied') {
        setError('Firestore permission denied. Please update your Firestore Security Rules.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is disabled in Firebase Console.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase Console.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed.');
      } else {
        setError(err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

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
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition mb-6 shadow-sm disabled:opacity-50"
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
            <label className="block text-sm font-medium text-green-900 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="e.g. user@example.com"
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
            {loading ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-green-700">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="font-semibold text-green-600 hover:text-green-800 transition"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
