import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserRole } from '../types';

export type { UserRole };

export function normalizeEmail(email?: string | null): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

export function getSafeEmailKey(email: string, role?: UserRole): string {
  const norm = normalizeEmail(email);
  const base = norm.replace(/[^a-zA-Z0-9_-]/g, '_');
  return role ? `${base}_${role}` : base;
}

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'gramonatti26@gmail.com',
  password: 'GRAMONATTI'
} as const;

export const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'admin-gramonatti-apmc-master',
  name: 'Mandi APMC Directorate Admin',
  email: 'gramonatti26@gmail.com',
  role: 'admin',
  mandiDivision: 'Maharashtra State APMC Directorate & e-NAM Terminal',
  location: 'Pune APMC Mandi Yard, Gultekdi, Maharashtra',
  district: 'Pune',
  taluka: 'Haveli',
  phone: '+91 98220 99881',
  profileCompleted: true,
  emailVerified: true,
  bankName: 'Bank of Maharashtra (Treasury Division)',
  accountNumber: '•••• •••• 1008',
  ifscCode: 'MAHB0000001',
  upiId: 'apmc.directorate@mahagov',
  createdAt: '2025-01-01T00:00:00.000Z'
};

export function isDefaultAdmin(email?: string, password?: string): boolean {
  if (!email) return false;
  const norm = normalizeEmail(email);
  const adminNorm = normalizeEmail(DEFAULT_ADMIN_CREDENTIALS.email);
  if (norm !== adminNorm) return false;
  if (!password) return true;
  const cleanPass = password.trim();
  return cleanPass === DEFAULT_ADMIN_CREDENTIALS.password || 
         cleanPass.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.password.toLowerCase();
}

export interface RegisteredAccountRecord {
  uid: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  profileCompleted: boolean;
  emailVerified: boolean;
  signedUpWithGoogle?: boolean;
  createdAt: string;
  profileData?: Partial<UserProfile>;
}

export function getLocalRegisteredAccounts(): Record<string, RegisteredAccountRecord> {
  try {
    const raw = localStorage.getItem('gramonnati_registered_users');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveLocalRegisteredAccount(email: string, record: Partial<RegisteredAccountRecord>) {
  const norm = normalizeEmail(email);
  if (!norm) return;
  const accounts = getLocalRegisteredAccounts();
  const existing = accounts[norm];
  const createdAt = existing?.createdAt || record.createdAt || new Date().toISOString();
  
  // Permanent role lock: Once registered, the user's role is fixed and cannot be overwritten
  const finalRole = existing?.role || record.role || 'farmer';

  accounts[norm] = {
    ...(existing || {}),
    ...record,
    role: finalRole,
    email: norm,
    createdAt
  } as RegisteredAccountRecord;

  try {
    localStorage.setItem('gramonnati_registered_users', JSON.stringify(accounts));
    localStorage.setItem('last_registered_email', norm);
  } catch (e) {
    console.warn('localStorage save note:', e);
  }
}

/**
 * Retrieves the permanently registered role for an email.
 * Checks local accounts, local stored profiles, and Firestore.
 */
export async function getRegisteredRoleForEmail(email?: string | null): Promise<UserRole | null> {
  const norm = normalizeEmail(email);
  if (!norm) return null;
  if (norm === normalizeEmail(DEFAULT_ADMIN_CREDENTIALS.email)) return 'admin';

  // 1. Check local registered accounts
  const accounts = getLocalRegisteredAccounts();
  if (accounts[norm]?.role) {
    return accounts[norm].role;
  }

  // 2. Check local profile records
  try {
    const gen = localStorage.getItem(`gramonnati_profile_${norm}`);
    if (gen) {
      const parsed = JSON.parse(gen);
      if (parsed?.role) return parsed.role;
    }
  } catch (e) {}

  for (const r of ['farmer', 'laborer', 'admin'] as UserRole[]) {
    try {
      const p = localStorage.getItem(`gramonnati_profile_${norm}_${r}`);
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed?.role) return parsed.role;
      }
    } catch (e) {}
  }

  // 3. Check Firestore
  try {
    const baseKey = getSafeEmailKey(norm);
    const emailSnap = await getDoc(doc(db, 'users_by_email', baseKey));
    if (emailSnap.exists()) {
      const data = emailSnap.data();
      if (data?.role) return data.role as UserRole;
    }
  } catch (e) {}

  return null;
}

/**
 * Strictly verifies whether an email is already tied to a different role.
 * One person/email can NEVER register as both Farmer and Laborer.
 */
export async function checkRoleConflict(
  email: string,
  requestedRole: UserRole
): Promise<{ hasConflict: boolean; existingRole?: UserRole; message?: string }> {
  const norm = normalizeEmail(email);
  if (!norm) return { hasConflict: false };

  const existingRole = await getRegisteredRoleForEmail(norm);
  if (!existingRole) {
    return { hasConflict: false };
  }

  if (existingRole !== requestedRole) {
    const existingLabel = existingRole === 'laborer' 
      ? 'Agricultural Laborer (Shramik)' 
      : existingRole === 'farmer' 
      ? 'Farmer (Kisan)' 
      : 'APMC Mandi Administrator';

    const requestedLabel = requestedRole === 'laborer'
      ? 'Agricultural Laborer (Shramik)'
      : requestedRole === 'farmer'
      ? 'Farmer (Kisan)'
      : 'APMC Mandi Administrator';

    return {
      hasConflict: true,
      existingRole,
      message: `Account Conflict: This email (${norm}) is permanently registered as a ${existingLabel}. In Gramonnati, Farmer and Laborer accounts are strictly separated. You cannot register or log in as a ${requestedLabel}. Please select ${existingLabel} to access your account.`
    };
  }

  return { hasConflict: false, existingRole };
}

/**
 * Check if a profile is considered completed.
 * Returns true if profileCompleted is explicitly true OR if substantive profile data exists.
 */
export function isProfileCompleted(profile?: Partial<UserProfile> | null): boolean {
  if (!profile) return false;
  if (profile.profileCompleted === true) return true;
  // Substantive fields check as fallback
  if (profile.phone && profile.phone.length >= 8) return true;
  if (profile.role === 'farmer' && (profile.farmName || profile.farmSize || profile.crops)) return true;
  if (profile.role === 'laborer' && (profile.skills || profile.experience || profile.expectedWage)) return true;
  if (profile.role === 'admin' && profile.mandiDivision) return true;
  if (profile.bankName || profile.upiId || profile.accountNumber) return true;
  return false;
}

/**
 * Universally saves user profile across localStorage and Firestore.
 * Automatically saves under:
 * 1. Active user ('user')
 * 2. Role-specific local profile ('gramonnati_profile_{email}_{role}')
 * 3. General email key ('gramonnati_profile_{email}')
 * 4. Separate Firestore collections ('users', 'users_{role}', and 'users_by_email')
 */
export function saveUserProfile(profile: UserProfile, explicitRole?: UserRole): UserProfile {
  const norm = normalizeEmail(profile.email);
  const targetRole = explicitRole || profile.role;
  const completed = isProfileCompleted(profile);
  const sanitizedProfile: UserProfile = {
    ...profile,
    email: norm,
    role: targetRole,
    profileCompleted: completed
  };

  // 1. Primary Active User & Role-Segregated Cache
  try {
    localStorage.setItem('user', JSON.stringify(sanitizedProfile));
    localStorage.setItem('last_active_role', targetRole);

    if (norm) {
      // Role-specific storage to ensure farmer and laborer data are strictly separated
      localStorage.setItem(`gramonnati_profile_${norm}_${targetRole}`, JSON.stringify(sanitizedProfile));
      localStorage.setItem(`gramonnati_profile_${norm}`, JSON.stringify(sanitizedProfile));
      
      saveLocalRegisteredAccount(norm, {
        uid: sanitizedProfile.id,
        name: sanitizedProfile.name,
        email: norm,
        role: targetRole,
        profileCompleted: completed,
        emailVerified: sanitizedProfile.emailVerified ?? false,
        profileData: sanitizedProfile
      });
    }
  } catch (e) {
    console.warn('Local save warning:', e);
  }

  // Notify components across window
  window.dispatchEvent(new Event('user-profile-updated'));

  // 2. Asynchronous Firestore Dual-Persistence & Role Isolation (Fire & Forget)
  if (profile.id) {
    Promise.resolve().then(async () => {
      try {
        const cleanPayload = JSON.parse(JSON.stringify(sanitizedProfile));
        
        // 1. General users collection
        const userRef = doc(db, 'users', profile.id);
        await setDoc(userRef, cleanPayload, { merge: true });

        // 2. Role-specific collection (users_farmer, users_laborer, users_admin)
        const roleSpecificRef = doc(db, `users_${targetRole}`, profile.id);
        await setDoc(roleSpecificRef, cleanPayload, { merge: true });

        // 3. Email-indexed collection with role distinction
        if (norm) {
          const emailRoleKey = getSafeEmailKey(norm, targetRole);
          const emailRef = doc(db, 'users_by_email', emailRoleKey);
          await setDoc(emailRef, cleanPayload, { merge: true });

          const baseEmailKey = getSafeEmailKey(norm);
          const baseEmailRef = doc(db, 'users_by_email', baseEmailKey);
          await setDoc(baseEmailRef, cleanPayload, { merge: true });
        }
      } catch (err) {
        console.warn('Background Firestore user sync note:', err);
      }
    });
  }

  return sanitizedProfile;
}

/**
 * Searches local role cache first, then Firestore with a short timeout.
 * Guarantees instantaneous retrieval for role-specific farmer, laborer, and admin profiles.
 */
export async function findStoredProfile(
  email?: string, 
  uid?: string, 
  preferredRole?: UserRole
): Promise<UserProfile | null> {
  const norm = normalizeEmail(email);

  // Check default admin
  if (norm === normalizeEmail(DEFAULT_ADMIN_CREDENTIALS.email) && (!preferredRole || preferredRole === 'admin')) {
    return DEFAULT_ADMIN_PROFILE;
  }
  
  // 1. Check local role-specific profile by email first
  if (norm) {
    if (preferredRole) {
      try {
        const roleSpecific = localStorage.getItem(`gramonnati_profile_${norm}_${preferredRole}`);
        if (roleSpecific) {
          const parsed = JSON.parse(roleSpecific) as UserProfile;
          if (parsed.role === preferredRole) {
            return parsed;
          }
        }
      } catch (e) {}

      // Check registered accounts directory for locked profile
      const accs = getLocalRegisteredAccounts();
      if (accs[norm]?.profileData) {
        const parsed = accs[norm].profileData as UserProfile;
        if (parsed.role === preferredRole) {
          return parsed;
        }
      }
    }

    // Fallback: check general email profile
    try {
      const byEmail = localStorage.getItem(`gramonnati_profile_${norm}`);
      if (byEmail) {
        const parsed = JSON.parse(byEmail) as UserProfile;
        if (!preferredRole || parsed.role === preferredRole) {
          return parsed;
        }
      }
    } catch (e) {}

    const accs = getLocalRegisteredAccounts();
    if (accs[norm]?.profileData) {
      const parsed = accs[norm].profileData as UserProfile;
      if (!preferredRole || parsed.role === preferredRole) {
        return parsed;
      }
    }
  }

  // 2. Check current active user in localStorage
  try {
    const active = localStorage.getItem('user');
    if (active) {
      const parsed = JSON.parse(active) as UserProfile;
      const matchesEmail = norm ? normalizeEmail(parsed.email) === norm : false;
      const matchesUid = uid ? parsed.id === uid : false;
      if (matchesEmail || matchesUid) {
        if (!preferredRole || parsed.role === preferredRole) {
          return parsed;
        }
      }
    }
  } catch (e) {}

  // 3. Fast Remote Firestore Lookup (max 1800ms)
  const fetchPromise = async (): Promise<UserProfile | null> => {
    try {
      if (norm) {
        // Try role-specific email index first
        if (preferredRole) {
          const roleEmailKey = getSafeEmailKey(norm, preferredRole);
          const roleEmailSnap = await getDoc(doc(db, 'users_by_email', roleEmailKey));
          if (roleEmailSnap.exists()) {
            const d = roleEmailSnap.data() as UserProfile;
            return { ...d, profileCompleted: isProfileCompleted(d) };
          }
        }

        // Try base email index
        const baseEmailKey = getSafeEmailKey(norm);
        const emailSnap = await getDoc(doc(db, 'users_by_email', baseEmailKey));
        if (emailSnap.exists()) {
          const d = emailSnap.data() as UserProfile;
          if (!preferredRole || d.role === preferredRole) {
            return { ...d, profileCompleted: isProfileCompleted(d) };
          }
        }
      }

      if (uid) {
        if (preferredRole) {
          const roleUidSnap = await getDoc(doc(db, `users_${preferredRole}`, uid));
          if (roleUidSnap.exists()) {
            const d = roleUidSnap.data() as UserProfile;
            return { ...d, profileCompleted: isProfileCompleted(d) };
          }
        }

        const uidSnap = await getDoc(doc(db, 'users', uid));
        if (uidSnap.exists()) {
          const d = uidSnap.data() as UserProfile;
          if (!preferredRole || d.role === preferredRole) {
            return { ...d, profileCompleted: isProfileCompleted(d) };
          }
        }
      }
    } catch (e) {
      console.warn('Firestore find profile note:', e);
    }
    return null;
  };

  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1800));

  try {
    const remote = await Promise.race([fetchPromise(), timeoutPromise]);
    if (remote) {
      saveUserProfile(remote);
      return remote;
    }
  } catch (e) {}

  return null;
}


