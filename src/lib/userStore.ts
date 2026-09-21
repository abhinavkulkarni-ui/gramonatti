import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserRole } from '../types';

export function normalizeEmail(email?: string | null): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

export function getSafeEmailKey(email: string): string {
  const norm = normalizeEmail(email);
  return norm.replace(/[^a-zA-Z0-9_-]/g, '_');
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
  accounts[norm] = {
    ...(existing || {}),
    ...record,
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
 * Check if a profile is considered completed.
 * Returns true if profileCompleted is explicitly true OR if substantive profile data exists.
 */
export function isProfileCompleted(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.profileCompleted === true) return true;
  // Substantive fields check as fallback
  if (profile.phone && profile.phone.length >= 8) return true;
  if (profile.role === 'farmer' && (profile.farmName || profile.farmSize || profile.crops)) return true;
  if (profile.role === 'laborer' && (profile.skills || profile.experience || profile.expectedWage)) return true;
  if (profile.bankName || profile.upiId || profile.accountNumber) return true;
  return false;
}

/**
 * Universally saves user profile across localStorage and Firestore.
 * Automatically saves under both user ID and normalized email index.
 */
export function saveUserProfile(profile: UserProfile): UserProfile {
  const norm = normalizeEmail(profile.email);
  const completed = isProfileCompleted(profile);
  const sanitizedProfile: UserProfile = {
    ...profile,
    email: norm,
    profileCompleted: completed
  };

  // 1. Primary Active User
  try {
    localStorage.setItem('user', JSON.stringify(sanitizedProfile));
    if (norm) {
      localStorage.setItem(`gramonnati_profile_${norm}`, JSON.stringify(sanitizedProfile));
      saveLocalRegisteredAccount(norm, {
        uid: sanitizedProfile.id,
        name: sanitizedProfile.name,
        email: norm,
        role: sanitizedProfile.role,
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

  // 2. Asynchronous Firestore Dual-Persistence (Fire & Forget, non-blocking)
  if (profile.id) {
    Promise.resolve().then(async () => {
      try {
        const cleanPayload = JSON.parse(JSON.stringify(sanitizedProfile));
        // Save to users/{uid}
        const userRef = doc(db, 'users', profile.id);
        await setDoc(userRef, cleanPayload, { merge: true });

        // Save to users_by_email/{safeKey}
        if (norm) {
          const emailKey = getSafeEmailKey(norm);
          const emailRef = doc(db, 'users_by_email', emailKey);
          await setDoc(emailRef, cleanPayload, { merge: true });
        }
      } catch (err) {
        console.warn('Background Firestore user sync note:', err);
      }
    });
  }

  return sanitizedProfile;
}

/**
 * Searches local cache first, then Firestore with a short timeout.
 * Guarantees instantaneous retrieval for already registered users.
 */
export async function findStoredProfile(email?: string, uid?: string): Promise<UserProfile | null> {
  const norm = normalizeEmail(email);
  
  // 1. Check local profile by email
  if (norm) {
    try {
      const byEmail = localStorage.getItem(`gramonnati_profile_${norm}`);
      if (byEmail) {
        const parsed = JSON.parse(byEmail) as UserProfile;
        if (isProfileCompleted(parsed)) return parsed;
      }
    } catch (e) {}

    // Check registered accounts directory
    const accs = getLocalRegisteredAccounts();
    if (accs[norm]?.profileData) {
      const parsed = accs[norm].profileData as UserProfile;
      if (isProfileCompleted(parsed)) return parsed;
    }
  }

  // 2. Check current active user in localStorage
  try {
    const active = localStorage.getItem('user');
    if (active) {
      const parsed = JSON.parse(active) as UserProfile;
      if (norm && normalizeEmail(parsed.email) === norm) {
        return parsed;
      }
      if (uid && parsed.id === uid) {
        return parsed;
      }
    }
  } catch (e) {}

  // 3. Fast Remote Firestore Lookup (max 1800ms to avoid blocking UI)
  const fetchPromise = async (): Promise<UserProfile | null> => {
    try {
      if (norm) {
        const emailKey = getSafeEmailKey(norm);
        const emailSnap = await getDoc(doc(db, 'users_by_email', emailKey));
        if (emailSnap.exists()) {
          const d = emailSnap.data() as UserProfile;
          return { ...d, profileCompleted: isProfileCompleted(d) };
        }
      }
      if (uid) {
        const uidSnap = await getDoc(doc(db, 'users', uid));
        if (uidSnap.exists()) {
          const d = uidSnap.data() as UserProfile;
          return { ...d, profileCompleted: isProfileCompleted(d) };
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
      // Cache locally
      saveUserProfile(remote);
      return remote;
    }
  } catch (e) {}

  return null;
}
