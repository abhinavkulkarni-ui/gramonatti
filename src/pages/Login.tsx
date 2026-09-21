import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Tractor, 
  Building,
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  MailCheck, 
  RefreshCw, 
  Send, 
  Check,
  Zap,
  Users
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  applyActionCode
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole, UserProfile } from '../types';
import RuralRiseLogo from '../components/RuralRiseLogo';
import { 
  findStoredProfile, 
  saveUserProfile, 
  isProfileCompleted, 
  normalizeEmail, 
  getLocalRegisteredAccounts, 
  saveLocalRegisteredAccount 
} from '../lib/userStore';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Default to register if query param ?mode=signup is provided, otherwise Sign In
  const [isLogin, setIsLogin] = useState(() => searchParams.get('mode') !== 'signup');
  const [role, setRole] = useState<UserRole>('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  // Check for email verification link action in URL (mode=verifyEmail&oobCode=...)
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      setLoading(true);
      applyActionCode(auth, oobCode)
        .then(() => {
          setSuccessInfo('Email verified successfully! Your account status is now verified.');
          setIsLogin(true);
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const u = JSON.parse(savedUser);
              u.emailVerified = true;
              saveUserProfile(u);
            } catch (e) {}
          }
        })
        .catch((err: any) => {
          setError(err.message || 'The verification link is invalid or has expired.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [searchParams]);

  // Preload any existing account email for quick sign-in convenience
  useEffect(() => {
    const savedEmail = localStorage.getItem('last_registered_email');
    if (savedEmail && !email) {
      setEmail(savedEmail);
    }
  }, []);

  /**
   * Unified, ultra-fast login & register processor.
   * Checks both local cache and Firestore to NEVER overwrite completed profile data.
   */
  const handleAuthSuccess = async (
    userObj: { uid: string; displayName?: string | null; email?: string | null }, 
    userRole: UserRole, 
    forceNewUser = false,
    explicitName?: string
  ) => {
    const normalizedEmail = normalizeEmail(userObj.email || email);
    
    // Fast lookup of any existing stored profile across localStorage & Firestore
    const existingProfile = await findStoredProfile(normalizedEmail, userObj.uid);
    const localAccounts = getLocalRegisteredAccounts();
    const existingLocal = localAccounts[normalizedEmail];

    const hasCompletedBefore = isProfileCompleted(existingProfile) || existingLocal?.profileCompleted === true;
    const isNew = forceNewUser && !hasCompletedBefore && !existingProfile;

    // Resolve Name
    const resolvedName = explicitName?.trim() 
      || existingProfile?.name 
      || existingLocal?.name 
      || userObj.displayName 
      || (userRole === 'farmer' ? 'Kisan Member' : userRole === 'laborer' ? 'Agricultural Worker' : 'APMC Administrator');

    const resolvedRole: UserRole = existingProfile?.role || existingLocal?.role || userRole;
    const isGoogleVerified = (userObj as any).emailVerified ?? false;
    const isFirebaseVerified = auth.currentUser?.emailVerified ?? false;
    const resolvedEmailVerified = isGoogleVerified || isFirebaseVerified || existingProfile?.emailVerified || existingLocal?.emailVerified || false;

    // Merge existing profile so we NEVER lose fields (farmName, crops, bank details, skills)
    const baseUserData: UserProfile = {
      ...(existingProfile || {}),
      id: userObj.uid,
      name: resolvedName,
      email: normalizedEmail,
      role: resolvedRole,
      location: existingProfile?.location || existingLocal?.profileData?.location || (resolvedRole === 'farmer' ? 'Niphad, Nashik, Maharashtra' : resolvedRole === 'laborer' ? 'Baramati, Pune, Maharashtra' : 'Pune APMC Yard, Maharashtra'),
      district: existingProfile?.district || existingLocal?.profileData?.district || (resolvedRole === 'farmer' ? 'Nashik' : 'Pune'),
      taluka: existingProfile?.taluka || existingLocal?.profileData?.taluka || (resolvedRole === 'farmer' ? 'Niphad' : 'Baramati'),
      profileCompleted: hasCompletedBefore ? true : (isNew ? false : (existingProfile?.profileCompleted ?? true)),
      emailVerified: resolvedEmailVerified,
      createdAt: existingProfile?.createdAt || existingLocal?.createdAt || new Date().toISOString()
    };

    // Universally persist profile (localStorage + dual-index Firestore)
    const saved = saveUserProfile(baseUserData);

    // Save account credentials state
    saveLocalRegisteredAccount(normalizedEmail, {
      uid: userObj.uid,
      name: resolvedName,
      email: normalizedEmail,
      role: resolvedRole,
      profileCompleted: saved.profileCompleted,
      emailVerified: resolvedEmailVerified,
      profileData: saved
    });

    setLoading(false);

    // If profile was already completed, go straight to dashboard without onboarding popup!
    if (saved.profileCompleted) {
      navigate('/dashboard');
    } else {
      navigate('/dashboard?onboard=true');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');
    setLoading(true);

    const cleanEmail = normalizeEmail(email);
    const cleanPassword = password;
    const cleanName = name.trim();

    // Client-side validation
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    // ==========================================
    // 1. SIGN IN FLOW (isLogin === true)
    // ==========================================
    if (isLogin) {
      try {
        // Fast attempt with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        
        // Remember password locally for cross-login support
        saveLocalRegisteredAccount(cleanEmail, { password: cleanPassword });

        await handleAuthSuccess(
          userCredential.user, 
          role, 
          false, 
          userCredential.user.displayName || undefined
        );
        return;
      } catch (authErr: any) {
        console.warn('Firebase signIn note:', authErr.code, authErr.message);

        // Check local registry for cross-auth (e.g. Google-registered user or offline login)
        const localAccounts = getLocalRegisteredAccounts();
        const existingLocal = localAccounts[cleanEmail];

        if (existingLocal) {
          // If password matches local record or password was newly provided for a Google account
          if (existingLocal.password && existingLocal.password !== cleanPassword) {
            setError('Incorrect password for this account. Please re-enter your password.');
            setLoading(false);
            return;
          }

          // If this account was originally created with Google, allow sign in and update password
          if (existingLocal.signedUpWithGoogle) {
            saveLocalRegisteredAccount(cleanEmail, { password: cleanPassword });
          }

          await handleAuthSuccess(
            { uid: existingLocal.uid || `user-${Date.now()}`, email: cleanEmail, displayName: existingLocal.name },
            existingLocal.role || role,
            false,
            existingLocal.name
          );
          return;
        }

        // Firebase-specific readable error messages:
        if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/wrong-password') {
          setError('Incorrect email or password. If you originally signed up with Google, use "Sign In with Google" below.');
        } else if (authErr.code === 'auth/user-not-found') {
          setError('No account found with this email. Click "Create Account" above to register instantly.');
        } else if (authErr.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Please wait a moment and try again.');
        } else if (authErr.code === 'auth/network-request-failed') {
          setError('Network issue. Check your connection or use Quick Demo Login.');
        } else {
          setError(authErr.message || 'Unable to sign in. Please verify your credentials.');
        }
        setLoading(false);
        return;
      }
    }

    // ==========================================
    // 2. REGISTRATION FLOW (isLogin === false)
    // ==========================================
    if (!isLogin) {
      if (!cleanName || cleanName.length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        setLoading(false);
        return;
      }

      try {
        // Fast Account Creation
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        
        // Update display name
        try {
          await updateProfile(userCredential.user, { displayName: cleanName });
        } catch (nameErr) {}

        // Non-blocking background verification dispatch
        try {
          sendEmailVerification(userCredential.user).catch((vErr) => console.warn('Verification dispatch note:', vErr));
        } catch (vErr) {}

        // Save local credentials
        saveLocalRegisteredAccount(cleanEmail, {
          uid: userCredential.user.uid,
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: role,
          profileCompleted: false,
          emailVerified: false,
          createdAt: new Date().toISOString()
        });

        // Initialize user profile and navigate immediately without blocking delay!
        await handleAuthSuccess(
          userCredential.user,
          role,
          true,
          cleanName
        );
        return;
      } catch (regErr: any) {
        console.warn('Firebase createUser note:', regErr.code, regErr.message);

        // If email already exists, switch to Sign In automatically!
        if (regErr.code === 'auth/email-already-in-use') {
          setIsLogin(true);
          setError('This email is already registered! Please enter your password or use Google Sign-In.');
          setLoading(false);
          return;
        }

        if (regErr.code === 'auth/weak-password') {
          setError('Password should be at least 6 characters.');
        } else if (regErr.code === 'auth/invalid-email') {
          setError('Invalid email address format.');
        } else {
          // Seamless fallback registration
          const localUid = `gramonnati-${role}-${Date.now()}`;
          saveLocalRegisteredAccount(cleanEmail, {
            uid: localUid,
            name: cleanName,
            email: cleanEmail,
            password: cleanPassword,
            role: role,
            profileCompleted: false,
            emailVerified: false,
            createdAt: new Date().toISOString()
          });

          await handleAuthSuccess(
            { uid: localUid, email: cleanEmail, displayName: cleanName },
            role,
            true,
            cleanName
          );
        }
        setLoading(false);
      }
    }
  };

  // Google Authentication Alternative (Sign in or Sign up)
  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessInfo('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const normalizedEmail = normalizeEmail(googleUser.email);
      
      // Look up existing profile to NEVER overwrite completed profile
      const storedProfile = await findStoredProfile(normalizedEmail, googleUser.uid);
      const isNew = !storedProfile && !isProfileCompleted(storedProfile);

      // Record Google sign in association
      saveLocalRegisteredAccount(normalizedEmail, {
        uid: googleUser.uid,
        name: googleUser.displayName || storedProfile?.name || 'Kisan Member',
        email: normalizedEmail,
        role: storedProfile?.role || role,
        signedUpWithGoogle: true,
        emailVerified: true,
        profileCompleted: isProfileCompleted(storedProfile)
      });

      await handleAuthSuccess(
        googleUser,
        storedProfile?.role || role,
        isNew,
        googleUser.displayName || storedProfile?.name || undefined
      );
    } catch (err: any) {
      console.warn('Google Sign-In note:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In cancelled (window closed).');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google popup was blocked. Please allow popups or use Email & Password.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized in Firebase Auth. Please use Email & Password.');
      } else {
        setError(err.message || 'Unable to sign in with Google. Please use email and password.');
      }
      setLoading(false);
    }
  };

  // 1-Click Fast Demo Logins for instant evaluation
  const handleQuickDemo = (demoRole: UserRole) => {
    setLoading(true);
    const mockProfiles = {
      farmer: {
        id: 'demo-farmer-balasaheb',
        uid: 'demo-farmer-balasaheb',
        name: 'Balasaheb Patil',
        email: 'farmer.balasaheb@gramonnati.org',
        role: 'farmer' as UserRole,
        farmName: 'Balasaheb Agro Farm',
        farmSize: '12 Acres',
        crops: 'Wheat (Sharbati Gold), Yellow Soybean, Pearl Millet',
        location: 'Niphad, Nashik, Maharashtra',
        district: 'Nashik',
        taluka: 'Niphad',
        phone: '+91 98220 11223',
        bankName: 'State Bank of India',
        accountNumber: '•••• •••• 9384',
        ifscCode: 'SBIN0001245',
        upiId: 'balasaheb.agro@sbi',
        profileCompleted: true,
        emailVerified: true
      },
      laborer: {
        id: 'demo-laborer-santosh',
        uid: 'demo-laborer-santosh',
        name: 'Santosh Shinde',
        email: 'laborer.santosh@gramonnati.org',
        role: 'laborer' as UserRole,
        skills: 'Combine Harvester, Drip Irrigation, Crop Spraying',
        experience: '8 Years',
        expectedWage: 650,
        availability: 'available' as const,
        location: 'Baramati, Pune, Maharashtra',
        district: 'Pune',
        taluka: 'Baramati',
        phone: '+91 94220 55667',
        bankName: 'Bank of Maharashtra',
        accountNumber: '•••• •••• 4120',
        ifscCode: 'MAHB0000123',
        upiId: 'santosh.shinde@upi',
        profileCompleted: true,
        emailVerified: true
      },
      admin: {
        id: 'demo-admin-ashok',
        uid: 'demo-admin-ashok',
        name: 'Dr. Ashok Deshmukh',
        email: 'admin.apmc@gramonnati.org',
        role: 'admin' as UserRole,
        mandiDivision: 'Maharashtra State APMC Directorate',
        location: 'Pune APMC Mandi Yard, Gultekdi',
        district: 'Pune',
        phone: '+91 98220 99881',
        profileCompleted: true,
        emailVerified: true
      }
    };

    const targetProfile = mockProfiles[demoRole] as UserProfile;
    saveUserProfile(targetProfile);
    saveLocalRegisteredAccount(targetProfile.email!, {
      uid: targetProfile.id,
      name: targetProfile.name,
      email: targetProfile.email,
      role: targetProfile.role,
      profileCompleted: true,
      emailVerified: true,
      profileData: targetProfile
    });

    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 150);
  };

  return (
    <div className="min-h-screen pt-20 pb-16 flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] via-[#f3f8f1] to-[#fefcf3] px-4 relative overflow-hidden text-[#143d24]">
      
      {/* Organic background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-[#143d24]/8 p-6 sm:p-8 border border-[#d8e5da] relative z-10"
      >
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-5 text-center">
          <div className="mb-2">
            <RuralRiseLogo size="md" showText={false} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#14532d] font-bold tracking-tight">
            Gramonnati
          </h2>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Rural Rise Platform
          </span>
          <p className="text-[#496552] text-xs sm:text-sm mt-1 max-w-xs">
            {isLogin 
              ? 'Fast access to your farm operations, labor portal, and mandi trading.' 
              : 'Register to manage harvest jobs, labor, and crop produce instantly.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-[#f0f5f1] rounded-2xl mb-5 border border-[#d8e5da]">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); setSuccessInfo(''); }}
            className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              isLogin 
                ? 'bg-[#14532d] text-white shadow-sm' 
                : 'text-[#496552] hover:text-[#14532d]'
            }`}
          >
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); setSuccessInfo(''); }}
            className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              !isLogin 
                ? 'bg-[#14532d] text-white shadow-sm' 
                : 'text-[#496552] hover:text-[#14532d]'
            }`}
          >
            <span>Create Account</span>
          </button>
        </div>

        {/* Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="bg-amber-50 text-amber-900 p-3 rounded-xl text-xs mb-4 border border-amber-200 font-medium flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
          {successInfo && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="bg-emerald-50 text-emerald-900 p-3 rounded-xl text-xs mb-4 border border-emerald-200 font-medium flex items-start gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{successInfo}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name field (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-[#14532d] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Balasaheb Patil"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8e5da] bg-[#fdfdfc] text-xs sm:text-sm text-[#14532d] focus:bg-white focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20 outline-none transition"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-xs font-bold text-[#14532d] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8e5da] bg-[#fdfdfc] text-xs sm:text-sm text-[#14532d] focus:bg-white focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-bold text-[#14532d] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#d8e5da] bg-[#fdfdfc] text-xs sm:text-sm text-[#14532d] focus:bg-white focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20 outline-none transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#14532d]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role selector (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-[#14532d] mb-1.5">
                Select Your Agricultural Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    role === 'farmer' 
                      ? 'bg-[#14532d] text-white border-[#14532d] shadow-xs' 
                      : 'bg-[#fbfdfb] text-[#496552] border-[#d8e5da] hover:bg-gray-50'
                  }`}
                >
                  <Tractor className="h-4 w-4" />
                  <span className="text-[11px] font-bold">Farmer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('laborer')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    role === 'laborer' 
                      ? 'bg-[#14532d] text-white border-[#14532d] shadow-xs' 
                      : 'bg-[#fbfdfb] text-[#496552] border-[#d8e5da] hover:bg-gray-50'
                  }`}
                >
                  <Sprout className="h-4 w-4" />
                  <span className="text-[11px] font-bold">Laborer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    role === 'admin' 
                      ? 'bg-[#14532d] text-white border-[#14532d] shadow-xs' 
                      : 'bg-[#fbfdfb] text-[#496552] border-[#d8e5da] hover:bg-gray-50'
                  }`}
                >
                  <Building className="h-4 w-4" />
                  <span className="text-[11px] font-bold">Mandi Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#14532d] via-[#15803d] to-[#16a34a] hover:brightness-110 text-white py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isLogin ? 'Sign In Instantly' : 'Complete Registration'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d8e5da]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-[#7d9383] font-medium">Or continue with</span>
          </div>
        </div>

        {/* Google 1-Click Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-50 text-[#14532d] border border-[#d8e5da] py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-3 shadow-xs hover:shadow-sm disabled:opacity-75"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        {/* Instant 1-Click Demo Profiles */}
        <div className="mt-5 pt-4 border-t border-[#e9efe9]">
          <span className="block text-[11px] font-bold text-center text-[#496552] mb-2 flex items-center justify-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>Instant Demo Sign-In (1-Click Preview)</span>
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('farmer')}
              className="py-1.5 px-2 bg-[#f4f8f4] hover:bg-[#eaf4ea] border border-[#d2e2d5] rounded-xl text-[11px] font-bold text-[#14532d] transition"
            >
              🌾 Farmer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('laborer')}
              className="py-1.5 px-2 bg-[#f4f8f4] hover:bg-[#eaf4ea] border border-[#d2e2d5] rounded-xl text-[11px] font-bold text-[#14532d] transition"
            >
              🚜 Laborer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="py-1.5 px-2 bg-[#f4f8f4] hover:bg-[#eaf4ea] border border-[#d2e2d5] rounded-xl text-[11px] font-bold text-[#14532d] transition"
            >
              🏛️ Mandi Admin
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
