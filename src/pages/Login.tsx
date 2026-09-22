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
  saveLocalRegisteredAccount,
  getRegisteredRoleForEmail,
  checkRoleConflict,
  DEFAULT_ADMIN_CREDENTIALS,
  DEFAULT_ADMIN_PROFILE,
  isDefaultAdmin
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

  // Quick autofill when selecting Mandi Admin
  const handleSelectAdminRole = () => {
    setRole('admin');
    setEmail(DEFAULT_ADMIN_CREDENTIALS.email);
    setPassword(DEFAULT_ADMIN_CREDENTIALS.password);
  };

  /**
   * Unified, ultra-fast login & register processor.
   * Keeps Farmer, Laborer, and Admin profiles completely separated so one account can
   * hold distinct records without overwriting.
   */
  const handleAuthSuccess = async (
    userObj: { uid: string; displayName?: string | null; email?: string | null }, 
    userRole: UserRole, 
    forceNewUser = false,
    explicitName?: string
  ) => {
    const normalizedEmail = normalizeEmail(userObj.email || email);

    // If Admin role or matching default admin credentials
    if (userRole === 'admin' || isDefaultAdmin(normalizedEmail)) {
      saveUserProfile(DEFAULT_ADMIN_PROFILE, 'admin');
      saveLocalRegisteredAccount(DEFAULT_ADMIN_CREDENTIALS.email, {
        uid: DEFAULT_ADMIN_PROFILE.id,
        name: DEFAULT_ADMIN_PROFILE.name,
        email: DEFAULT_ADMIN_CREDENTIALS.email,
        password: DEFAULT_ADMIN_CREDENTIALS.password,
        role: 'admin',
        profileCompleted: true,
        emailVerified: true,
        profileData: DEFAULT_ADMIN_PROFILE
      });
      setLoading(false);
      navigate('/dashboard');
      return;
    }
    
    // Fast lookup of role-specific stored profile
    const existingRoleProfile = await findStoredProfile(normalizedEmail, userObj.uid, userRole);
    const localAccounts = getLocalRegisteredAccounts();
    const existingAccount = localAccounts[normalizedEmail];
    const existingRoleData = existingAccount?.role === userRole ? existingAccount.profileData : undefined;

    const hasCompletedBefore = isProfileCompleted(existingRoleProfile) || isProfileCompleted(existingRoleData);
    const isNew = forceNewUser && !hasCompletedBefore && !existingRoleProfile;

    // Resolve Name
    const resolvedName = explicitName?.trim() 
      || existingRoleProfile?.name 
      || existingRoleData?.name 
      || existingAccount?.name 
      || userObj.displayName 
      || (userRole === 'farmer' ? 'Kisan Member' : userRole === 'laborer' ? 'Agricultural Worker' : 'APMC Administrator');

    const isGoogleVerified = (userObj as any).emailVerified ?? false;
    const isFirebaseVerified = auth.currentUser?.emailVerified ?? false;
    const resolvedEmailVerified = isGoogleVerified || isFirebaseVerified || existingRoleProfile?.emailVerified || existingAccount?.emailVerified || false;

    // Build role-isolated user profile
    const baseUserData: UserProfile = {
      ...(existingRoleProfile || existingRoleData || {}),
      id: `${userObj.uid}-${userRole}`,
      name: resolvedName,
      email: normalizedEmail,
      role: userRole,
      location: existingRoleProfile?.location || existingRoleData?.location || existingAccount?.profileData?.location || (userRole === 'farmer' ? 'Niphad, Nashik, Maharashtra' : userRole === 'laborer' ? 'Baramati, Pune, Maharashtra' : 'Pune APMC Yard, Maharashtra'),
      district: existingRoleProfile?.district || existingRoleData?.district || existingAccount?.profileData?.district || (userRole === 'farmer' ? 'Nashik' : 'Pune'),
      taluka: existingRoleProfile?.taluka || existingRoleData?.taluka || existingAccount?.profileData?.taluka || (userRole === 'farmer' ? 'Niphad' : 'Baramati'),
      profileCompleted: hasCompletedBefore ? true : (isNew ? false : (existingRoleProfile?.profileCompleted ?? true)),
      emailVerified: resolvedEmailVerified,
      createdAt: existingRoleProfile?.createdAt || existingAccount?.createdAt || new Date().toISOString()
    };

    // Specific field initialization if missing
    if (userRole === 'laborer' && !baseUserData.skills) {
      baseUserData.skills = 'Harvesting, Wheat Threshing, Grape Pruning';
      baseUserData.expectedWage = baseUserData.expectedWage || 650;
      baseUserData.availability = baseUserData.availability || 'available';
    } else if (userRole === 'farmer' && !baseUserData.farmName) {
      baseUserData.farmName = baseUserData.farmName || `${resolvedName}'s Farm`;
      baseUserData.crops = baseUserData.crops || 'Wheat, Soybean';
    }

    // Universally persist profile (localStorage + role-segregated Firestore)
    const saved = saveUserProfile(baseUserData, userRole);

    // Save account credentials state with permanent role lock
    saveLocalRegisteredAccount(normalizedEmail, {
      uid: userObj.uid,
      name: resolvedName,
      email: normalizedEmail,
      role: userRole,
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

    // ================================================================
    // 0. MANDI ADMIN DEFAULT LOGIN CHECK
    // Email: gramonatti26@gmail.com, Password: GRAMONATTI
    // ================================================================
    if (
      isDefaultAdmin(cleanEmail, cleanPassword) || 
      (role === 'admin' && (cleanEmail === DEFAULT_ADMIN_CREDENTIALS.email || cleanPassword.toUpperCase() === DEFAULT_ADMIN_CREDENTIALS.password))
    ) {
      saveUserProfile(DEFAULT_ADMIN_PROFILE, 'admin');
      saveLocalRegisteredAccount(DEFAULT_ADMIN_CREDENTIALS.email, {
        uid: DEFAULT_ADMIN_PROFILE.id,
        name: DEFAULT_ADMIN_PROFILE.name,
        email: DEFAULT_ADMIN_CREDENTIALS.email,
        password: DEFAULT_ADMIN_CREDENTIALS.password,
        role: 'admin',
        profileCompleted: true,
        emailVerified: true,
        profileData: DEFAULT_ADMIN_PROFILE
      });
      setSuccessInfo('Authenticated as Mandi APMC Directorate Administrator.');
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 150);
      return;
    }

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

    // =========================================================================
    // 1. STRICT ROLE ISOLATION & CONFLICT VERIFICATION
    // A Laborer CANNOT register as a Farmer, and vice versa!
    // =========================================================================
    const conflict = await checkRoleConflict(cleanEmail, role);
    if (conflict.hasConflict) {
      setError(conflict.message || `Account Conflict: This email is already registered under a different role. In Gramonnati, Farmer and Laborer accounts are strictly separated.`);
      setLoading(false);
      return;
    }

    // ==========================================
    // 2. SIGN IN FLOW (isLogin === true)
    // ==========================================
    if (isLogin) {
      // Check if user is trying to log in with wrong role
      const registeredRole = await getRegisteredRoleForEmail(cleanEmail);
      if (registeredRole && registeredRole !== role) {
        const regLabel = registeredRole === 'laborer' ? 'Laborer (Shramik)' : registeredRole === 'farmer' ? 'Farmer (Kisan)' : 'APMC Admin';
        const chosenLabel = role === 'laborer' ? 'Laborer' : role === 'farmer' ? 'Farmer' : 'Admin';
        setError(`Account Role Mismatch: This account is registered as a ${regLabel}. You cannot log in under the ${chosenLabel} role. Please select ${regLabel} above to sign in.`);
        setLoading(false);
        return;
      }

      try {
        // Fast attempt with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        
        // Remember password locally for cross-login support
        saveLocalRegisteredAccount(cleanEmail, { password: cleanPassword, role });

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
          if (existingLocal.role && existingLocal.role !== role) {
            setError(`This account is permanently registered as a ${existingLocal.role === 'laborer' ? 'Laborer (Shramik)' : 'Farmer (Kisan)'}. You cannot sign in as a ${role}.`);
            setLoading(false);
            return;
          }

          // If password matches local record or password was newly provided for a Google account
          if (existingLocal.password && existingLocal.password !== cleanPassword) {
            setError('Incorrect password for this account. Please re-enter your password.');
            setLoading(false);
            return;
          }

          // If this account was originally created with Google, allow sign in and update password
          if (existingLocal.signedUpWithGoogle) {
            saveLocalRegisteredAccount(cleanEmail, { password: cleanPassword, role });
          }

          await handleAuthSuccess(
            { uid: existingLocal.uid || `user-${Date.now()}`, email: cleanEmail, displayName: existingLocal.name },
            role,
            false,
            existingLocal.name
          );
          return;
        }

        // Firebase-specific readable error messages:
        if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/wrong-password') {
          setError('Incorrect credentials. If you are registering a new user, click "Create Account" above.');
        } else if (authErr.code === 'auth/user-not-found') {
          setError('No account found with this email. Click "Create Account" above to register.');
        } else if (authErr.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Please wait a moment and try again.');
        } else if (authErr.code === 'auth/network-request-failed') {
          setError('Network issue. Check your connection or use Instant 1-Click Role Login.');
        } else {
          setError(authErr.message || 'Unable to sign in. Please verify your credentials.');
        }
        setLoading(false);
        return;
      }
    }

    // ==========================================
    // 3. REGISTRATION FLOW (isLogin === false)
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

        // If email already exists in Firebase Auth, verify role before allowing anything!
        if (regErr.code === 'auth/email-already-in-use') {
          const registeredRole = await getRegisteredRoleForEmail(cleanEmail);
          
          if (registeredRole && registeredRole !== role) {
            const regLabel = registeredRole === 'laborer' ? 'Laborer (Shramik)' : registeredRole === 'farmer' ? 'Farmer (Kisan)' : 'APMC Admin';
            setError(`Registration Blocked: This email is already registered as a ${regLabel}. One user cannot register as both Farmer and Laborer. You cannot create a ${role === 'farmer' ? 'Farmer' : 'Laborer'} account with this email. Please switch above and sign in as a ${regLabel}.`);
            setLoading(false);
            return;
          }

          // If existing account belongs to the same role, guide them to enter password to sign in
          setIsLogin(true);
          setError(`This email is already registered as a ${role === 'farmer' ? 'Farmer (Kisan)' : 'Laborer (Shramik)'}. Please enter your password to sign in.`);
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
      if (!normalizedEmail) {
        setError('Google sign-in did not return a valid email.');
        setLoading(false);
        return;
      }

      // STRICT ROLE CONFLICT VERIFICATION FOR GOOGLE SIGN IN
      const conflict = await checkRoleConflict(normalizedEmail, role);
      if (conflict.hasConflict) {
        await auth.signOut();
        const existingLabel = conflict.existingRole === 'laborer' 
          ? 'Agricultural Laborer (Shramik)' 
          : conflict.existingRole === 'farmer' 
          ? 'Farmer (Kisan)' 
          : 'APMC Mandi Administrator';
        setError(`Role Conflict: This Google account (${normalizedEmail}) is permanently registered as a ${existingLabel}. In Gramonnati, Farmer and Laborer accounts are kept completely separate. You cannot sign in or register as a ${role === 'farmer' ? 'Farmer' : 'Laborer'}. Please select ${existingLabel} above to sign in.`);
        setLoading(false);
        return;
      }
      
      // Look up existing role-specific profile
      const storedProfile = await findStoredProfile(normalizedEmail, googleUser.uid, role);
      const isNew = !storedProfile && !isProfileCompleted(storedProfile);

      // Record Google sign in association with permanent role lock
      saveLocalRegisteredAccount(normalizedEmail, {
        uid: googleUser.uid,
        name: googleUser.displayName || storedProfile?.name || (role === 'farmer' ? 'Kisan Member' : 'Agricultural Worker'),
        email: normalizedEmail,
        role: role,
        signedUpWithGoogle: true,
        emailVerified: true,
        profileCompleted: isProfileCompleted(storedProfile)
      });

      await handleAuthSuccess(
        googleUser,
        role,
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
      admin: DEFAULT_ADMIN_PROFILE
    };

    const targetProfile = mockProfiles[demoRole] as UserProfile;
    saveUserProfile(targetProfile, demoRole);
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
        className="max-w-lg w-full bg-white rounded-3xl shadow-xl shadow-[#143d24]/8 p-6 sm:p-8 border border-[#d8e5da] relative z-10"
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
            Rural Rise Unified Platform
          </span>
          <p className="text-[#496552] text-xs sm:text-sm mt-1 max-w-sm">
            {isLogin 
              ? 'Select your agricultural role and sign in to your dedicated portal.' 
              : 'Choose your role and register to access farm labor, crop sales, or mandi oversight.'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* PROMINENT ROLE / PORTAL SELECTOR (Visible for BOTH Sign In and Register) */}
        {/* ========================================================================= */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#14532d] flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#15803d]" />
              <span>Step 1: Choose Your Role Portal</span>
            </label>
            <span className="text-[11px] font-semibold text-[#55695b]">
              Active: <strong className="text-[#14532d]">{role === 'farmer' ? '🌾 Farmer (Kisan)' : role === 'laborer' ? '🚜 Laborer (Shramik)' : '🏛️ Mandi Admin'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Farmer Card */}
            <button
              type="button"
              onClick={() => {
                setRole('farmer');
                if (email === DEFAULT_ADMIN_CREDENTIALS.email) {
                  setEmail('');
                  setPassword('');
                }
              }}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                role === 'farmer' 
                  ? 'bg-gradient-to-b from-[#14532d] to-[#166534] text-white border-[#14532d] shadow-sm ring-2 ring-[#15803d]/30' 
                  : 'bg-[#fbfdfb] text-[#344e3e] border-[#d8e5da] hover:bg-[#f2f8f3] hover:border-[#b4d2bc]'
              }`}
            >
              <Tractor className={`h-5 w-5 ${role === 'farmer' ? 'text-amber-300' : 'text-[#15803d]'}`} />
              <div>
                <span className="text-xs font-bold block">🌾 Farmer</span>
                <span className={`text-[10px] hidden sm:block ${role === 'farmer' ? 'text-emerald-100' : 'text-gray-500'}`}>
                  Post Jobs & Sell
                </span>
              </div>
            </button>

            {/* Laborer Card */}
            <button
              type="button"
              onClick={() => {
                setRole('laborer');
                if (email === DEFAULT_ADMIN_CREDENTIALS.email) {
                  setEmail('');
                  setPassword('');
                }
              }}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                role === 'laborer' 
                  ? 'bg-gradient-to-b from-[#14532d] to-[#166534] text-white border-[#14532d] shadow-sm ring-2 ring-[#15803d]/30' 
                  : 'bg-[#fbfdfb] text-[#344e3e] border-[#d8e5da] hover:bg-[#f2f8f3] hover:border-[#b4d2bc]'
              }`}
            >
              <Sprout className={`h-5 w-5 ${role === 'laborer' ? 'text-amber-300' : 'text-[#15803d]'}`} />
              <div>
                <span className="text-xs font-bold block">🚜 Laborer</span>
                <span className={`text-[10px] hidden sm:block ${role === 'laborer' ? 'text-emerald-100' : 'text-gray-500'}`}>
                  Harvest & Wages
                </span>
              </div>
            </button>

            {/* Mandi Admin Card */}
            <button
              type="button"
              onClick={handleSelectAdminRole}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                role === 'admin' 
                  ? 'bg-gradient-to-b from-[#78350f] to-[#92400e] text-white border-[#78350f] shadow-sm ring-2 ring-amber-500/30' 
                  : 'bg-[#fbfdfb] text-[#344e3e] border-[#d8e5da] hover:bg-[#fef9ee] hover:border-amber-300'
              }`}
            >
              <Building className={`h-5 w-5 ${role === 'admin' ? 'text-amber-200' : 'text-amber-700'}`} />
              <div>
                <span className="text-xs font-bold block">🏛️ Admin</span>
                <span className={`text-[10px] hidden sm:block ${role === 'admin' ? 'text-amber-100' : 'text-gray-500'}`}>
                  APMC Portal
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Mandi Admin Default Credentials Callout */}
        {role === 'admin' && (
          <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-100/50 rounded-2xl border border-amber-200 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  <span>Maharashtra APMC Directorate Terminal</span>
                </div>
                <div className="mt-1 text-[11px] text-amber-800 space-y-0.5">
                  <p>Default Login: <strong className="font-mono text-amber-950">gramonatti26@gmail.com</strong></p>
                  <p>Default Password: <strong className="font-mono text-amber-950">GRAMONATTI</strong></p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSelectAdminRole}
                className="shrink-0 bg-amber-800 hover:bg-amber-900 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-xs transition flex items-center gap-1"
              >
                <Zap className="h-3 w-3 text-amber-300" />
                <span>Auto-Fill</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 bg-[#f0f5f1] rounded-2xl mb-4 border border-[#d8e5da]">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); setSuccessInfo(''); }}
            className={`py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              isLogin 
                ? 'bg-[#14532d] text-white shadow-sm' 
                : 'text-[#496552] hover:text-[#14532d]'
            }`}
          >
            <span>Sign In ({role === 'farmer' ? 'Kisan' : role === 'laborer' ? 'Shramik' : 'Admin'})</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); setSuccessInfo(''); }}
            className={`py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
              !isLogin 
                ? 'bg-[#14532d] text-white shadow-sm' 
                : 'text-[#496552] hover:text-[#14532d]'
            }`}
          >
            <span>Create New {role === 'farmer' ? 'Farmer' : role === 'laborer' ? 'Laborer' : 'Admin'}</span>
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
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Full Name field (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-[#14532d] mb-1">
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
                  placeholder={role === 'farmer' ? 'e.g. Balasaheb Patil' : role === 'laborer' ? 'e.g. Santosh Shinde' : 'e.g. APMC Officer'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8e5da] bg-[#fdfdfc] text-xs sm:text-sm text-[#14532d] focus:bg-white focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20 outline-none transition"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14532d]">
                Email Address
              </label>
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={handleSelectAdminRole}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold"
                >
                  Use gramonatti26@gmail.com
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'admin' ? 'gramonatti26@gmail.com' : 'name@example.com'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8e5da] bg-[#fdfdfc] text-xs sm:text-sm text-[#14532d] focus:bg-white focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#14532d]">
                Password
              </label>
              {role === 'admin' && (
                <span className="text-[11px] font-mono text-amber-800">
                  Default: GRAMONATTI
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={role === 'admin' ? 'GRAMONATTI' : 'At least 6 characters'}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-75 ${
              role === 'admin' 
                ? 'bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#b45309] text-white hover:brightness-110' 
                : 'bg-gradient-to-r from-[#14532d] via-[#15803d] to-[#16a34a] text-white hover:brightness-110'
            }`}
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>
                  {isLogin 
                    ? `Sign In as ${role === 'farmer' ? 'Farmer (Kisan Portal)' : role === 'laborer' ? 'Laborer (Shramik Portal)' : 'Mandi APMC Admin'}` 
                    : `Create ${role === 'farmer' ? 'Farmer' : role === 'laborer' ? 'Laborer' : 'Admin'} Profile`}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
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
          <span>Sign In with Google ({role === 'farmer' ? 'Farmer' : role === 'laborer' ? 'Laborer' : 'Admin'})</span>
        </button>

        {/* Instant 1-Click Fast Preview Profiles */}
        <div className="mt-4 pt-3 border-t border-[#e9efe9]">
          <span className="block text-[11px] font-bold text-center text-[#496552] mb-2 flex items-center justify-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>Instant Role Logins (1-Click Evaluation)</span>
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
              className="py-1.5 px-2 bg-[#fffbeb] hover:bg-[#fef3c7] border border-amber-300 rounded-xl text-[11px] font-bold text-amber-900 transition"
            >
              🏛️ Mandi Admin
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
