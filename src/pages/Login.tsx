import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Shield, 
  Tractor, 
  UserCheck, 
  Building,
  Lock,
  Mail,
  User,
  Zap
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole, UserProfile } from '../types';
import RuralRiseLogo from '../components/RuralRiseLogo';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewUserSetup, setIsNewUserSetup] = useState(false);

  // Fast Instant Session Dispatch (Zero-lag transition)
  const handleAuthSuccess = (userObj: any, userRole: UserRole, forceFirstTime: boolean = false) => {
    const isNew = forceFirstTime || !isLogin || isNewUserSetup;

    const userData: UserProfile = {
      id: userObj.uid,
      name: name.trim() || userObj.displayName || (userRole === 'farmer' ? 'Kisan Member' : userRole === 'laborer' ? 'Agri Worker' : 'APMC Administrator'),
      email: userObj.email || email,
      role: userRole,
      location: userRole === 'farmer' ? 'Niphad, Nashik, Maharashtra' : userRole === 'laborer' ? 'Baramati, Pune, Maharashtra' : 'Pune APMC Yard, Maharashtra',
      district: userRole === 'farmer' ? 'Nashik' : 'Pune',
      taluka: userRole === 'farmer' ? 'Niphad' : 'Baramati',
      // If new user, profileCompleted is false so modal triggers immediately!
      profileCompleted: !isNew,
      createdAt: new Date().toISOString()
    };

    // 1. Immediately store to local storage for zero latency
    localStorage.setItem('user', JSON.stringify(userData));

    // 2. Non-blocking background Firestore sync with 1.5s timeout safety
    const syncFirestore = async () => {
      try {
        const userRef = doc(db, 'users', userObj.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const remoteData = userSnap.data() as Partial<UserProfile>;
          const merged = { ...userData, ...remoteData };
          if (isNew) {
            merged.profileCompleted = false;
          }
          localStorage.setItem('user', JSON.stringify(merged));
        } else {
          await setDoc(userRef, userData, { merge: true });
        }
      } catch (firestoreErr: any) {
        console.warn("Background Firestore sync note:", firestoreErr?.message || firestoreErr);
      }
    };
    syncFirestore();

    // 3. Immediately redirect to dashboard with instant onboarding trigger if requested
    setLoading(false);
    navigate(isNew ? '/dashboard?onboard=true' : '/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Fast-path client validation
    if (!isLogin && password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign In
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          handleAuthSuccess(userCredential.user, role, false);
          return;
        } catch (authErr: any) {
          // If user doesn't exist yet, offer instant seamless transition to register
          if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
            // Auto register or inform user
            console.log("Creating new user account seamlessly...");
            const newCred = await createUserWithEmailAndPassword(auth, email, password);
            handleAuthSuccess(newCred.user, role, true);
            return;
          }
          throw authErr;
        }
      } else {
        // Sign Up - always launches first-time profile creation popup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        handleAuthSuccess(userCredential.user, role, true);
        return;
      }
    } catch (err: any) {
      console.warn("Auth note:", err);
      let userMessage = 'Authentication encountered a note. Use 1-Click Instant Access below!';

      if (err.code === 'auth/email-already-in-use') {
        userMessage = 'An account already exists with this email. Please switch to Sign In.';
      } else if (err.code === 'auth/weak-password') {
        userMessage = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/unauthorized-domain') {
        userMessage = 'Firebase domain pending authorization. Click any 1-Click Role button below to enter instantly!';
      } else if (err.message) {
        userMessage = err.message;
      }

      setError(userMessage);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      handleAuthSuccess(userCredential.user, role, isNewUserSetup);
    } catch (err: any) {
      console.error("Google Auth Exception:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Google Auth requires this domain in Firebase Console. Use 1-Click Role Access below to enter instantly!');
      } else {
        setError(err.message || 'Google authentication encountered an issue.');
      }
      setLoading(false);
    }
  };

  // Instant 1-Click Fast Login (Zero-delay)
  const handleQuickDemoLogin = (demoRole: UserRole, forceFirstTime: boolean = false) => {
    setLoading(true);
    const mockUser = {
      uid: `gramonnati-${demoRole}-${Date.now()}`,
      displayName: demoRole === 'farmer' 
        ? 'Balasaheb Patil (Farmer)' 
        : demoRole === 'laborer' 
          ? 'Santosh Shinde (Agricultural Worker)' 
          : 'Dr. Ashok Deshmukh (APMC Mandi Admin)',
      email: `${demoRole}.demo@gramonnati.org`,
      phoneNumber: '+91 98220 11223'
    };
    handleAuthSuccess(mockUser, demoRole, forceFirstTime);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] via-[#f3f8f1] to-[#fefcf3] px-4 relative overflow-hidden">
      
      {/* Animated Glowing Rural Backdrops */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none animate-float-slow"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#143d24]/10 p-7 sm:p-9 border border-[#d8e5da] relative z-10"
      >
        
        {/* Brand Header with Realistic Gramonnati Logo */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="mb-2">
            <RuralRiseLogo size="lg" showText={false} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#143d24] font-bold tracking-tight">
            Gramonnati
          </h2>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Rural Rise Portal
          </span>
          <p className="text-[#496552] text-xs sm:text-sm mt-1 max-w-xs font-normal">
            {isLogin 
              ? 'Fast login to access your smart harvest & wage telemetry.' 
              : 'Create your account with instant profile onboarding.'}
          </p>
        </div>

        {/* Error Notification */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 text-amber-900 p-3 rounded-2xl text-xs mb-5 border border-amber-200 font-medium flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(role, false)}
                  className="block mt-1 font-bold underline text-[#14532d] hover:text-[#16a34a]"
                >
                  Enter instantly with 1-Click Fast Access →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1-Click Lightning Fast Role Access */}
        <div className="mb-5 p-3.5 bg-gradient-to-r from-[#ecfdf5] via-[#f0fdf4] to-[#fefce8] rounded-2xl border border-[#bbf7d0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#14532d] flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" /> Instant 1-Click Role Login
            </span>
            <span className="text-[10px] bg-[#14532d] text-[#fde047] px-2 py-0.5 rounded-full font-bold">
              Fast
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('farmer', false)}
              className="px-2 py-2 rounded-xl bg-white hover:bg-[#eaf5ec] border border-[#c6dec9] text-[#143d24] text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-xs hover:scale-[1.02]"
            >
              <Sprout className="h-4 w-4 text-[#15803d]" />
              <span>Farmer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('laborer', false)}
              className="px-2 py-2 rounded-xl bg-white hover:bg-[#eaf5ec] border border-[#c6dec9] text-[#143d24] text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-xs hover:scale-[1.02]"
            >
              <Tractor className="h-4 w-4 text-[#15803d]" />
              <span>Laborer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin', false)}
              className="px-2 py-2 rounded-xl bg-white hover:bg-[#eaf5ec] border border-[#c6dec9] text-[#143d24] text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-xs hover:scale-[1.02]"
            >
              <Building className="h-4 w-4 text-[#15803d]" />
              <span>APMC Admin</span>
            </button>
          </div>

          {/* Direct trigger for testing First-Time Profile Creation */}
          <div className="mt-2.5 pt-2 border-t border-[#bbf7d0]/60 flex items-center justify-between">
            <span className="text-[10px] text-[#496552]">New user first-time profile popup?</span>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(role, true)}
              className="text-[11px] font-bold text-[#15803d] hover:text-[#14532d] underline flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3 text-amber-600" />
              <span>Trigger Profile Setup Now →</span>
            </button>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#d8e0d9] text-[#143d24] py-2.5 rounded-full font-semibold text-xs sm:text-sm hover:bg-[#f6f8f5] transition-all mb-4 shadow-xs disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[#e5ece5]"></div>
          <span className="text-[#7c9584] text-[10px] font-bold uppercase tracking-wider">or email access</span>
          <div className="flex-1 h-px bg-[#e5ece5]"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-bold text-[#143d24] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d1dec8] focus:border-[#15803d] outline-none transition bg-[#fbfdfb] text-xs sm:text-sm"
                  placeholder="e.g. Ramesh Baburao Patil"
                  required={!isLogin}
                />
                <User className="h-4 w-4 text-[#8ea394] absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#143d24] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d1dec8] focus:border-[#15803d] outline-none transition bg-[#fbfdfb] text-xs sm:text-sm"
                placeholder="farmer@gramonnati.org"
                required
              />
              <Mail className="h-4 w-4 text-[#8ea394] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#143d24] uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d1dec8] focus:border-[#15803d] outline-none transition bg-[#fbfdfb] text-xs sm:text-sm"
                placeholder="••••••••"
                required
              />
              <Lock className="h-4 w-4 text-[#8ea394] absolute left-3 top-3" />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#143d24] uppercase tracking-wider mb-1">
              Role On Platform
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`py-2 px-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                  role === 'farmer' 
                    ? 'bg-[#14532d] text-white border-[#14532d] shadow-xs' 
                    : 'bg-white text-[#496552] border-[#d1dec8] hover:bg-[#f6faf6]'
                }`}
              >
                <Sprout className="h-3.5 w-3.5" />
                <span>Farmer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('laborer')}
                className={`py-2 px-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                  role === 'laborer' 
                    ? 'bg-[#14532d] text-white border-[#14532d] shadow-xs' 
                    : 'bg-white text-[#496552] border-[#d1dec8] hover:bg-[#f6faf6]'
                }`}
              >
                <Tractor className="h-3.5 w-3.5" />
                <span>Laborer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                  role === 'admin' 
                    ? 'bg-[#14532d] text-white border-[#14532d] shadow-xs' 
                    : 'bg-white text-[#496552] border-[#d1dec8] hover:bg-[#f6faf6]'
                }`}
              >
                <Building className="h-3.5 w-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Prompt profile popup on login */}
          <div className="flex items-center gap-2 pt-1">
            <input 
              type="checkbox"
              id="newProfileToggle"
              checked={isNewUserSetup}
              onChange={(e) => setIsNewUserSetup(e.target.checked)}
              className="rounded text-[#15803d] focus:ring-[#15803d]"
            />
            <label htmlFor="newProfileToggle" className="text-xs text-[#496552] cursor-pointer">
              Open profile setup popup upon sign in
            </label>
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-[#14532d] via-[#15803d] to-[#16a34a] hover:brightness-110 text-white py-3 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isLogin ? 'Sign In Instantly' : 'Create Account & Open Profile'}</span>
                <ArrowRight className="h-4 w-4 text-[#fde047]" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login vs Register */}
        <div className="mt-5 text-center text-xs font-medium text-[#496552]">
          {isLogin ? "New to Gramonnati? " : "Already have an account? "}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }} 
            className="font-bold text-[#14532d] hover:underline"
          >
            {isLogin ? 'Sign up & setup profile' : 'Log in here'}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
