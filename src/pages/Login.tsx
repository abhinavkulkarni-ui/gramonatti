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
  Check
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

  // Email Verification States
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Check for email verification link action in URL (mode=verifyEmail&oobCode=...)
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      setLoading(true);
      applyActionCode(auth, oobCode)
        .then(() => {
          setSuccessInfo('Email successfully verified! Your official account status is now verified.');
          setIsLogin(true);
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const u = JSON.parse(savedUser);
              u.emailVerified = true;
              localStorage.setItem('user', JSON.stringify(u));
              window.dispatchEvent(new Event('user-profile-updated'));
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

  // Cooldown countdown for resending verification email
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Preload any existing account email for quick sign-in convenience
  useEffect(() => {
    const savedEmail = localStorage.getItem('last_registered_email');
    if (savedEmail && !email) {
      setEmail(savedEmail);
    }
  }, []);

  // Helper: Get local accounts registry
  const getLocalAccounts = (): Record<string, any> => {
    try {
      const data = localStorage.getItem('gramonnati_registered_users');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  };

  // Helper: Save to local accounts registry
  const saveLocalAccount = (accEmail: string, accData: any) => {
    try {
      const accounts = getLocalAccounts();
      accounts[accEmail.toLowerCase().trim()] = accData;
      localStorage.setItem('gramonnati_registered_users', JSON.stringify(accounts));
      localStorage.setItem('last_registered_email', accEmail.toLowerCase().trim());
    } catch (e) {
      console.warn('Local account save fallback error:', e);
    }
  };

  // Successful Login / Registration Processor
  const handleAuthSuccess = async (
    userObj: { uid: string; displayName?: string | null; email?: string | null }, 
    userRole: UserRole, 
    isNewUser: boolean,
    explicitName?: string
  ) => {
    const normalizedEmail = (userObj.email || email).toLowerCase().trim();
    const localAccounts = getLocalAccounts();
    const existingLocal = localAccounts[normalizedEmail];

    // Determine accurate Full Name:
    // 1. Explicit name provided at registration
    // 2. Existing name from local registry
    // 3. userObj.displayName from Firebase Auth
    // 4. Default fallback based on role
    const resolvedName = explicitName?.trim() 
      || existingLocal?.name 
      || userObj.displayName 
      || (userRole === 'farmer' ? 'Kisan Member' : userRole === 'laborer' ? 'Agricultural Worker' : 'APMC Administrator');

    const resolvedRole: UserRole = existingLocal?.role || userRole;
    const isGoogleVerified = (userObj as any).emailVerified ?? false;
    const isFirebaseVerified = auth.currentUser?.emailVerified ?? false;
    const resolvedEmailVerified = isGoogleVerified || isFirebaseVerified || existingLocal?.emailVerified || false;

    const baseUserData: UserProfile = {
      id: userObj.uid,
      name: resolvedName,
      email: normalizedEmail,
      role: resolvedRole,
      location: existingLocal?.location || (resolvedRole === 'farmer' ? 'Niphad, Nashik, Maharashtra' : resolvedRole === 'laborer' ? 'Baramati, Pune, Maharashtra' : 'Pune APMC Yard, Maharashtra'),
      district: existingLocal?.district || (resolvedRole === 'farmer' ? 'Nashik' : 'Pune'),
      taluka: existingLocal?.taluka || (resolvedRole === 'farmer' ? 'Niphad' : 'Baramati'),
      profileCompleted: isNewUser ? false : (existingLocal?.profileCompleted ?? true),
      emailVerified: resolvedEmailVerified,
      createdAt: existingLocal?.createdAt || new Date().toISOString()
    };

    // Store synchronously to localStorage for immediate UI response
    localStorage.setItem('user', JSON.stringify(baseUserData));
    saveLocalAccount(normalizedEmail, {
      uid: userObj.uid,
      name: resolvedName,
      email: normalizedEmail,
      role: resolvedRole,
      profileCompleted: baseUserData.profileCompleted,
      emailVerified: resolvedEmailVerified,
      createdAt: baseUserData.createdAt || new Date().toISOString()
    });

    // Notify other components (Navbar, etc.)
    window.dispatchEvent(new Event('user-profile-updated'));

    // Non-blocking asynchronous Firestore synchronization
    try {
      const userRef = doc(db, 'users', userObj.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const remoteData = userSnap.data() as Partial<UserProfile>;
        const merged: UserProfile = { 
          ...baseUserData, 
          ...remoteData,
          name: remoteData.name || baseUserData.name,
          role: remoteData.role || baseUserData.role,
        };
        if (isNewUser) {
          merged.profileCompleted = false;
        }
        localStorage.setItem('user', JSON.stringify(merged));
      } else {
        await setDoc(userRef, baseUserData, { merge: true });
      }
    } catch (firestoreErr) {
      console.warn('Optional Firestore sync note:', firestoreErr);
    }

    setLoading(false);
    // If newly registered, route to dashboard with onboarding popup parameter
    navigate(isNewUser ? '/dashboard?onboard=true' : '/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    const cleanName = name.trim();

    // Basic client-side validation
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
        // Attempt standard Firebase Auth sign-in
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        
        // Fetch existing account details to preserve Full Name and role
        const localAccounts = getLocalAccounts();
        const savedAccount = localAccounts[cleanEmail];
        
        await handleAuthSuccess(
          userCredential.user, 
          savedAccount?.role || role, 
          false, 
          savedAccount?.name || userCredential.user.displayName || undefined
        );
        return;
      } catch (authErr: any) {
        console.warn('Firebase signIn note:', authErr.code, authErr.message);

        // Check local registry for offline/cached registered credentials
        const localAccounts = getLocalAccounts();
        const existingLocal = localAccounts[cleanEmail];

        if (existingLocal) {
          // User registered before in this browser/session
          if (existingLocal.password && existingLocal.password !== cleanPassword) {
            setError('Incorrect password for this account. Please re-enter your password.');
            setLoading(false);
            return;
          }
          // Password matches local record or no password conflict, log them in directly
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
          setError('Incorrect email or password. Please verify your credentials and try again.');
        } else if (authErr.code === 'auth/user-not-found') {
          setError('No account found with this email. Click "Create Account" above to register.');
        } else if (authErr.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Please wait a moment and try again.');
        } else if (authErr.code === 'auth/network-request-failed') {
          setError('Network connection issue. Please check your internet connection and retry.');
        } else {
          setError(authErr.message || 'Unable to sign in. Please verify your email and password.');
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
        // Create account in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        
        // Update user's display name in Firebase Auth
        try {
          await updateProfile(userCredential.user, { displayName: cleanName });
        } catch (nameErr) {
          console.warn('DisplayName update note:', nameErr);
        }

        // Send Email Verification Link
        let sentVerification = false;
        try {
          await sendEmailVerification(userCredential.user);
          sentVerification = true;
        } catch (vErr: any) {
          console.warn('sendEmailVerification note:', vErr);
        }

        // Save to local accounts registry
        saveLocalAccount(cleanEmail, {
          uid: userCredential.user.uid,
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: role,
          profileCompleted: false,
          emailVerified: false,
          createdAt: new Date().toISOString()
        });

        // Initialize user profile in localStorage
        const baseUserData: UserProfile = {
          id: userCredential.user.uid,
          name: cleanName,
          email: cleanEmail,
          role: role,
          location: role === 'farmer' ? 'Niphad, Nashik, Maharashtra' : role === 'laborer' ? 'Baramati, Pune, Maharashtra' : 'Pune APMC Yard, Maharashtra',
          district: role === 'farmer' ? 'Nashik' : 'Pune',
          taluka: role === 'farmer' ? 'Niphad' : 'Baramati',
          profileCompleted: false,
          emailVerified: false,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('user', JSON.stringify(baseUserData));
        window.dispatchEvent(new Event('user-profile-updated'));

        // Non-blocking Firestore synchronization
        try {
          const userRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userRef, baseUserData, { merge: true });
        } catch (e) {}

        // Show verification pending screen
        setVerificationEmail(cleanEmail);
        setResendCooldown(60);
        setVerificationPending(true);
        setSuccessInfo(sentVerification ? `Verification email sent to ${cleanEmail}!` : 'Account created. Please verify your email.');
        setLoading(false);
        return;
      } catch (regErr: any) {
        console.warn('Firebase createUser note:', regErr.code, regErr.message);

        // If email already exists, switch to Sign In automatically!
        if (regErr.code === 'auth/email-already-in-use') {
          setIsLogin(true);
          setError('This email is already registered. Please enter your password to sign in.');
          setLoading(false);
          return;
        }

        if (regErr.code === 'auth/weak-password') {
          setError('Password is too weak. Please use at least 6 characters.');
        } else if (regErr.code === 'auth/invalid-email') {
          setError('Invalid email address format.');
        } else {
          // If Firebase network is unreachable, allow seamless local registration
          const localUid = `gramonnati-${role}-${Date.now()}`;
          saveLocalAccount(cleanEmail, {
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
          return;
        }
        setLoading(false);
      }
    }
  };

  // Resend Email Verification Link
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessInfo('');
    setLoading(true);

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setResendCooldown(60);
        setSuccessInfo(`A fresh verification link has been sent to ${verificationEmail || auth.currentUser.email}!`);
      } else {
        setError('No active session found. Please sign in to receive a verification link.');
      }
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Please wait a moment before requesting another verification email.');
      } else {
        setError(err.message || 'Unable to send verification email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check Email Verification Status
  const handleCheckVerification = async () => {
    setError('');
    setSuccessInfo('');
    setCheckingVerification(true);

    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const u = JSON.parse(userStr);
              u.emailVerified = true;
              localStorage.setItem('user', JSON.stringify(u));
              window.dispatchEvent(new Event('user-profile-updated'));
            } catch (e) {}
          }
          const localAccounts = getLocalAccounts();
          const em = (auth.currentUser.email || verificationEmail).toLowerCase().trim();
          if (localAccounts[em]) {
            localAccounts[em].emailVerified = true;
            localStorage.setItem('gramonnati_registered_users', JSON.stringify(localAccounts));
          }

          setSuccessInfo('Email verified successfully! Opening your dashboard...');
          setTimeout(() => {
            navigate('/dashboard?onboard=true');
          }, 1000);
          return;
        } else {
          setError(`Your email is not verified yet. Please click the link sent to ${auth.currentUser.email || verificationEmail} and try again.`);
        }
      } else {
        setError('Session expired. Please sign in to verify.');
      }
    } catch (err: any) {
      setError('Unable to check verification status. Please check your network connection.');
    } finally {
      setCheckingVerification(false);
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

      const normalizedEmail = (googleUser.email || '').toLowerCase().trim();
      const localAccounts = getLocalAccounts();
      const existingLocal = localAccounts[normalizedEmail];

      // Check if user already exists in Firestore or local registry
      let isNewUser = !existingLocal;
      try {
        const userRef = doc(db, 'users', googleUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          isNewUser = false;
        }
      } catch (e) {
        console.warn('Google user check note:', e);
      }

      await handleAuthSuccess(
        googleUser,
        existingLocal?.role || role,
        isNewUser,
        googleUser.displayName || undefined
      );
    } catch (err: any) {
      console.warn('Google Sign-In note:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In cancelled (popup window closed).');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google Sign-In popup was blocked by your browser. Please allow popups or use email & password.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // user clicked multiple times
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase Auth. Please use Email & Password.');
      } else {
        setError(err.message || 'Unable to sign in with Google. Please try email and password.');
      }
      setLoading(false);
    }
  };

  // Demo 1-Click Fast Login for quick evaluator convenience
  const handleQuickDemo = (demoRole: UserRole) => {
    setLoading(true);
    const mockNames = {
      farmer: 'Balasaheb Patil (Farmer)',
      laborer: 'Santosh Shinde (Agricultural Specialist)',
      admin: 'Dr. Ashok Deshmukh (APMC Mandi Admin)'
    };
    const mockUser = {
      uid: `demo-${demoRole}-${Date.now()}`,
      displayName: mockNames[demoRole],
      email: `${demoRole}.demo@gramonnati.org`
    };
    handleAuthSuccess(mockUser, demoRole, false, mockNames[demoRole]);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] via-[#f3f8f1] to-[#fefcf3] px-4 relative overflow-hidden text-[#143d24]">
      
      {/* Subtle organic rural background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-[#143d24]/8 p-7 sm:p-9 border border-[#d8e5da] relative z-10"
      >
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="mb-2.5">
            <RuralRiseLogo size="lg" showText={false} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#14532d] font-bold tracking-tight">
            Gramonnati
          </h2>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Rural Rise Platform
          </span>
          <p className="text-[#496552] text-xs sm:text-sm mt-1 max-w-xs">
            {isLogin 
              ? 'Sign in with your registered email and password to access your dashboard.' 
              : 'Register your account to manage harvest jobs, labor, and crop produce.'}
          </p>
        </div>

        {/* Verification Pending Screen or Auth Form */}
        {verificationPending ? (
          <div className="py-2 text-center">
            <div className="relative mx-auto w-16 h-16 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-30"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-700/25">
                <MailCheck className="h-8 w-8" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
              Verification Link Dispatched
            </span>

            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#14532d] mb-2">
              Verify Your Email
            </h3>

            <p className="text-xs text-[#496552] mb-3 leading-relaxed max-w-sm mx-auto">
              We have dispatched a verification link to your registered email address:
            </p>

            <div className="bg-[#f2f7f3] border border-[#d3e2d6] rounded-xl py-2 px-3.5 text-xs font-mono font-bold text-[#14532d] inline-flex items-center gap-2 mb-4 max-w-full truncate shadow-xs">
              <Mail className="h-4 w-4 text-[#15803d] shrink-0" />
              <span className="truncate">{verificationEmail}</span>
            </div>

            <p className="text-[11px] text-[#5b7362] mb-5 px-1 leading-relaxed">
              Please open your inbox (and check spam folder if needed) and click the verification link to confirm your account. Verified members receive the official <strong>Gramonnati Verified Member</strong> badge.
            </p>

            {/* Notifications */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="bg-amber-50 text-amber-900 p-3 rounded-xl text-xs mb-3.5 border border-amber-200 font-medium flex items-start gap-2 text-left"
                >
                  <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
              {successInfo && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="bg-emerald-50 text-emerald-900 p-3 rounded-xl text-xs mb-3.5 border border-emerald-200 font-medium flex items-start gap-2 text-left"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{successInfo}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verification Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={checkingVerification}
                className="w-full bg-gradient-to-r from-[#14532d] via-[#15803d] to-[#16a34a] hover:brightness-110 text-white py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {checkingVerification ? (
                  <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                    <span>I Clicked the Link — Check Verification</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || loading}
                className="w-full py-2.5 rounded-2xl border border-[#c6d7ca] hover:bg-[#f6faf6] bg-white text-[#14532d] text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0 ? `Resend Link (${resendCooldown}s)` : 'Resend Verification Email'}
                </span>
              </button>
            </div>

            {/* Skip / Continue to dashboard */}
            <div className="mt-5 pt-4 border-t border-[#e2eae3] flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard?onboard=true')}
                className="text-xs text-[#15803d] hover:text-[#14532d] font-bold hover:underline"
              >
                Proceed to Dashboard (Verify Later) →
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerificationPending(false);
                  setIsLogin(true);
                  setError('');
                  setSuccessInfo('');
                }}
                className="text-[11px] text-[#637d6a] hover:text-[#14532d]"
              >
                Sign In with another account
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="grid grid-cols-2 p-1 bg-[#f1f5f2] rounded-2xl mb-5 border border-[#dbe6dc]">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setSuccessInfo('');
                }}
                className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  isLogin 
                    ? 'bg-white text-[#14532d] shadow-sm' 
                    : 'text-[#526a57] hover:text-[#14532d]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setSuccessInfo('');
                }}
                className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  !isLogin 
                    ? 'bg-[#14532d] text-white shadow-sm' 
                    : 'text-[#526a57] hover:text-[#14532d]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Notification */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-amber-50 text-amber-900 p-3.5 rounded-2xl text-xs mb-5 border border-amber-200 font-medium flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              {successInfo && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-50 text-emerald-900 p-3.5 rounded-2xl text-xs mb-5 border border-emerald-200 font-medium flex items-start gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{successInfo}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email & Password Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Full Name field (Only on Registration) */}
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-bold text-[#14532d] uppercase tracking-wider mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d1dec8] focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none transition bg-[#fbfdfb] text-xs sm:text-sm"
                  placeholder="e.g. Ramesh Baburao Patil"
                  required={!isLogin}
                  autoComplete="name"
                />
                <User className="h-4 w-4 text-[#8ea394] absolute left-3 top-3" />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-bold text-[#14532d] uppercase tracking-wider mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d1dec8] focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none transition bg-[#fbfdfb] text-xs sm:text-sm"
                placeholder="farmer@gramonnati.org"
                required
                autoComplete="email"
              />
              <Mail className="h-4 w-4 text-[#8ea394] absolute left-3 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-[#14532d] uppercase tracking-wider mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#d1dec8] focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none transition bg-[#fbfdfb] text-xs sm:text-sm"
                placeholder="Minimum 6 characters"
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <Lock className="h-4 w-4 text-[#8ea394] absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#14532d] uppercase tracking-wider mb-1">
              {isLogin ? 'Signing In As' : 'Select Your Primary Role'}
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

          {/* Submit Action */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-3 bg-gradient-to-r from-[#14532d] via-[#15803d] to-[#16a34a] hover:brightness-110 text-white py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isLogin ? 'Sign In with Email →' : 'Register & Create Account →'}</span>
              </>
            )}
          </button>
        </form>

        {/* Google Authentication Alternative */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d8e5da]"></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-white px-3 text-[#526a57] font-semibold">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-2xl border border-[#c6d7ca] hover:bg-[#f6faf6] bg-white text-[#14532d] text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2.5 shadow-xs hover:shadow-sm"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
        </button>

        {/* Toggle link below form */}
        <div className="mt-5 text-center text-xs text-[#496552]">
          {isLogin ? "Don't have an account yet? " : "Already registered with an email? "}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessInfo('');
            }} 
            className="font-bold text-[#14532d] hover:underline"
          >
            {isLogin ? 'Create Account here' : 'Sign In with your details'}
          </button>
        </div>

        {/* Quick Demo Access (Subtle, non-intrusive) */}
        <div className="mt-6 pt-4 border-t border-[#e2eae3]">
          <div className="flex items-center justify-between mb-2 text-[11px] text-[#698270]">
            <span className="font-semibold">Quick Demo Testing:</span>
            <span>Zero-configuration</span>
          </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer')}
                className="py-1.5 px-2 rounded-lg bg-[#f4f7f4] hover:bg-[#eaf0eb] text-[#14532d] text-[11px] font-semibold transition text-center"
              >
                Demo Farmer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('laborer')}
                className="py-1.5 px-2 rounded-lg bg-[#f4f7f4] hover:bg-[#eaf0eb] text-[#14532d] text-[11px] font-semibold transition text-center"
              >
                Demo Laborer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-1.5 px-2 rounded-lg bg-[#f4f7f4] hover:bg-[#eaf0eb] text-[#14532d] text-[11px] font-semibold transition text-center"
              >
                Demo Admin
              </button>
            </div>
          </div>
        </>
        )}

      </motion.div>
    </div>
  );
}
