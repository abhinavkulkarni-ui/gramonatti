import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  UserCircle, 
  MapPin, 
  Wrench, 
  Briefcase, 
  Navigation, 
  Sprout, 
  CheckCircle2, 
  ArrowRight, 
  CreditCard, 
  BadgeCheck, 
  X, 
  Download,
  Building,
  Phone,
  Tractor,
  Mail,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import RuralRiseLogo from '../components/RuralRiseLogo';
import { exportProfileToPdf } from '../lib/pdfExport';
import { requestDeviceGps } from '../lib/geoUtils';
import { UserProfile } from '../types';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Basic Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');

  // Worker Info
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [age, setAge] = useState('');
  const [expectedWage, setExpectedWage] = useState('');
  const [workingRadiusKm, setWorkingRadiusKm] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Farmer Info
  const [farmName, setFarmName] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [crops, setCrops] = useState('');
  const [irrigationType, setIrrigationType] = useState('');
  const [farmGateAddress, setFarmGateAddress] = useState('');

  // Admin Info
  const [mandiDivision, setMandiDivision] = useState('');
  const [adminCode, setAdminCode] = useState('');

  // Bank Info (Only for Farmer and Laborer - Omitted for Admin)
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');

  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Email verification state
  const [resendingVerification, setResendingVerification] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendVerificationEmail = async () => {
    setResendingVerification(true);
    setVerificationFeedback(null);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setVerificationFeedback({
          type: 'success',
          text: `Verification link sent to ${auth.currentUser.email || user?.email}! Please check your email inbox.`
        });
      } else {
        setVerificationFeedback({
          type: 'error',
          text: 'No active session. Please sign in again to verify.'
        });
      }
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setVerificationFeedback({
          type: 'error',
          text: 'Please wait a minute before requesting another verification email.'
        });
      } else {
        setVerificationFeedback({
          type: 'error',
          text: err.message || 'Unable to send verification link.'
        });
      }
    } finally {
      setResendingVerification(false);
    }
  };

  const handleCheckEmailVerified = async () => {
    if (!user) return;
    setCheckingVerification(true);
    setVerificationFeedback(null);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          const updatedUser: UserProfile = { ...user, emailVerified: true };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('user-profile-updated'));

          setVerificationFeedback({
            type: 'success',
            text: 'Your email has been verified! Gramonnati Verified Member status unlocked.'
          });
          return;
        } else {
          setVerificationFeedback({
            type: 'error',
            text: `Email not verified yet. Please click the link sent to ${auth.currentUser.email || user.email}, then click Check Status.`
          });
        }
      }
    } catch (e) {
      setVerificationFeedback({
        type: 'error',
        text: 'Unable to check verification status. Please check your internet connection.'
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr) as UserProfile;
        setUser(u);
        setName(u.name && u.name !== 'New User' ? u.name : '');
        setPhone(u.phone || '+91 98220 12345');
        setLocation(u.location && u.location !== 'Unknown' ? u.location : 'Nashik, Maharashtra');
        setDistrict(u.district || 'Nashik');
        setTaluka(u.taluka || 'Niphad');
        
        // Laborer
        setSkills(u.skills || 'Wheat Harvesting, Tractor Driving, Drip Irrigation');
        setExperience(u.experience || '5');
        setAge(u.age ? String(u.age) : '28');
        setExpectedWage(u.expectedWage ? String(u.expectedWage) : '650');
        setWorkingRadiusKm(u.workingRadiusKm ? String(u.workingRadiusKm) : '25');
        setEmergencyPhone(u.emergencyPhone || '+91 94231 99887');

        // Farmer
        setFarmName(u.farmName || 'Kisan Kranti Agro Farm');
        setFarmSize(u.farmSize || '12.5');
        setCrops(u.crops || 'Wheat, Bajra, Jowar, Soybean');
        setIrrigationType(u.irrigationType || 'Drip Irrigation & Borewell');
        setFarmGateAddress(u.farmGateAddress || 'Survey 42, Gate 3, Post Niphad');

        // Admin
        setMandiDivision(u.mandiDivision || 'Pune APMC & Agri Marketing Board');
        setAdminCode(u.adminCode || 'GRAMONNATI-ADMIN-2026');

        // Bank
        setBankName(u.bankName || 'State Bank of India (SBI)');
        setAccountNumber(u.accountNumber || '34891029384');
        setIfscCode(u.ifscCode || 'SBIN0001245');
        setUpiId(u.upiId || 'kisan.rural@upi');
        setAadhaarNumber(u.aadhaarNumber || 'XXXX-XXXX-8921');
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const gpsRes = await requestDeviceGps();
      const [latitude, longitude] = gpsRes.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Nashik';
        const subDistrict = data.address?.suburb || data.address?.county || 'Taluka';
        const state = data.address?.state || 'Maharashtra';
        setLocation(`${city}, ${state}`);
        setDistrict(city);
        setTaluka(subDistrict);
      } catch (e) {
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
      setToastMessage(gpsRes.isSimulated ? 'Regional base location detected' : 'Real-time device GPS coordinates locked!');
    } catch (e) {
      setLocation('Nashik, Maharashtra');
      setDistrict('Nashik');
      setTaluka('Niphad');
    } finally {
      setLocating(false);
    }
  };

  const buildProfile = (): UserProfile => {
    if (!user) throw new Error('No user');
    return {
      ...user,
      name: name.trim() || 'Rural Rise Member',
      phone: phone.trim(),
      location: location.trim(),
      district: district.trim(),
      taluka: taluka.trim(),
      profileCompleted: true,
      // Bank / Financial details (strictly excluded for admin)
      bankName: user.role !== 'admin' ? bankName.trim() : undefined,
      accountNumber: user.role !== 'admin' ? accountNumber.trim() : undefined,
      ifscCode: user.role !== 'admin' ? ifscCode.trim() : undefined,
      upiId: user.role !== 'admin' ? upiId.trim() : undefined,
      aadhaarNumber: user.role !== 'admin' ? aadhaarNumber.trim() : undefined,
      // Farmer
      farmName: user.role === 'farmer' ? farmName.trim() : undefined,
      farmSize: user.role === 'farmer' ? farmSize : undefined,
      crops: user.role === 'farmer' ? crops.trim() : undefined,
      irrigationType: user.role === 'farmer' ? irrigationType.trim() : undefined,
      farmGateAddress: user.role === 'farmer' ? farmGateAddress.trim() : undefined,
      // Laborer
      age: user.role === 'laborer' ? Number(age) : undefined,
      skills: user.role === 'laborer' ? skills.trim() : undefined,
      experience: user.role === 'laborer' ? experience.trim() : undefined,
      expectedWage: user.role === 'laborer' ? Number(expectedWage) : undefined,
      workingRadiusKm: user.role === 'laborer' ? Number(workingRadiusKm) : undefined,
      emergencyPhone: user.role === 'laborer' ? emergencyPhone.trim() : undefined,
      // Admin
      mandiDivision: user.role === 'admin' ? mandiDivision.trim() : undefined,
      adminCode: user.role === 'admin' ? adminCode.trim() : undefined,
    };
  };

  const handleDownloadPdf = () => {
    if (!user) return;
    const current = buildProfile();
    exportProfileToPdf(current);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    const updatedUser = buildProfile();

    // 1. Instant local persistence & sync event
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('user-profile-updated'));

    // 2. Fast background Firestore sync
    if (updatedUser.id) {
      try {
        const userRef = doc(db, 'users', updatedUser.id);
        const cleanPayload = JSON.parse(JSON.stringify(updatedUser));
        setDoc(userRef, cleanPayload, { merge: true }).catch(err => {
          console.warn('Optional background firestore sync note:', err);
        });
      } catch (err) {
        console.warn('Sync note:', err);
      }
    }

    setToastMessage('Profile credentials saved instantly!');
    
    // Immediate return to dashboard
    setTimeout(() => {
      navigate('/dashboard');
    }, 400);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#fdfbf7] via-[#f5f9f4] to-[#fefcf3] flex items-center justify-center px-4 relative overflow-hidden text-[#143d24]">
      
      {/* Decorative rural glow accents */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border-2 border-[#bbf7d0]/70 p-6 sm:p-10 relative z-10 my-4"
      >
        {/* Top Cancel (X) Button */}
        <button 
          type="button"
          onClick={handleCancel}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition z-20"
          title="Cancel and return to Dashboard"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header with Rural Rise branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-2">
            <RuralRiseLogo size="md" showText={true} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#14532d] font-bold">
            {user.role === 'farmer' ? 'Farmer Farm & Crop Profile' : 
             user.role === 'laborer' ? 'Agricultural Specialist Profile' : 
             'APMC Mandi Administrator Credential'}
          </h1>
          <p className="text-[#496552] mt-1 text-xs sm:text-sm max-w-lg mx-auto">
            Manage your credentials, direct mandi settlement details, and farm gate telemetry.
          </p>
        </div>

        {toastMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Personal & Contact */}
          <div className="bg-[#fcfdfc] p-4 sm:p-5 rounded-2xl border border-[#dce8de] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#14532d] flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-[#15803d]" />
              <span>1. Personal & Contact Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Registered Email & Verification Badge */}
              <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-[#d8e2d9]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#496552] uppercase tracking-wider block">
                      Registered Account Email
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail className="h-4 w-4 text-[#15803d]" />
                      <span className="text-xs font-semibold text-[#14532d]">{user?.email || 'Registered User'}</span>
                      {user?.emailVerified ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                          <AlertCircle className="h-3 w-3 text-amber-700" />
                          Verification Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {!user?.emailVerified && (
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <button
                        type="button"
                        onClick={handleCheckEmailVerified}
                        disabled={checkingVerification}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#14532d] text-white hover:bg-[#0f3d21] transition flex items-center gap-1 disabled:opacity-70"
                      >
                        {checkingVerification ? (
                          <div className="h-3 w-3 border border-white/40 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        <span>Check Status</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResendVerificationEmail}
                        disabled={resendingVerification}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition flex items-center gap-1 disabled:opacity-70"
                      >
                        <RefreshCw className={`h-3 w-3 ${resendingVerification ? 'animate-spin' : ''}`} />
                        <span>Resend Email</span>
                      </button>
                    </div>
                  )}
                </div>

                {verificationFeedback && (
                  <div className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    verificationFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}>
                    {verificationFeedback.type === 'success' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    )}
                    <span>{verificationFeedback.text}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                  Full Name / Producer Title
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                  Contact Phone (SMS / WhatsApp)
                </label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                  Base Village / Taluka Location
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white"
                      placeholder="e.g. Niphad, Nashik, Maharashtra"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLocate}
                    disabled={locating}
                    className="bg-[#14532d] hover:bg-[#166534] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                  >
                    <Navigation className={`h-3.5 w-3.5 ${locating ? 'animate-spin' : 'text-[#fde047]'}`} />
                    <span>{locating ? 'Locating...' : 'GPS Auto-Fill'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role Details */}
          {user.role === 'laborer' && (
            <div className="bg-[#fcfdfc] p-4 sm:p-5 rounded-2xl border border-[#dce8de] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14532d] flex items-center gap-2">
                <Wrench className="h-4 w-4 text-[#15803d]" />
                <span>2. Agricultural Skills & Wage Norms</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Verified Agritech Skills
                  </label>
                  <input 
                    type="text" 
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white"
                    placeholder="Tractor Driving, Harvesting, Sowing, Spraying"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Separate skills with commas.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Field Experience (Years)
                  </label>
                  <input 
                    type="text" 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Expected Daily Wage (₹/day)
                  </label>
                  <input 
                    type="number" 
                    value={expectedWage}
                    onChange={(e) => setExpectedWage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Working Radius (km)
                  </label>
                  <input 
                    type="number" 
                    value={workingRadiusKm}
                    onChange={(e) => setWorkingRadiusKm(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {user.role === 'farmer' && (
            <div className="bg-[#fcfdfc] p-4 sm:p-5 rounded-2xl border border-[#dce8de] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14532d] flex items-center gap-2">
                <Sprout className="h-4 w-4 text-[#15803d]" />
                <span>2. Farm Land & Crop Production Criteria</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Farm Name / Agro Holding
                  </label>
                  <input 
                    type="text" 
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Farm Size (Acres)
                  </label>
                  <input 
                    type="text" 
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Primary Crops Cultivated
                  </label>
                  <input 
                    type="text" 
                    value={crops}
                    onChange={(e) => setCrops(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white"
                    placeholder="e.g. Sharbati Wheat, Hybrid Bajra, Maldandi Jowar, Soybean"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Farm Gate Produce Loading Address
                  </label>
                  <input 
                    type="text" 
                    value={farmGateAddress}
                    onChange={(e) => setFarmGateAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white"
                    placeholder="Survey No. 42, Gate 3, Village Post Niphad"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {user.role === 'admin' && (
            <div className="bg-[#fcfdfc] p-4 sm:p-5 rounded-2xl border border-[#dce8de] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14532d] flex items-center gap-2">
                <Building className="h-4 w-4 text-[#15803d]" />
                <span>2. APMC Mandi Jurisdiction & Admin Setup</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Mandi Division / Board
                  </label>
                  <input 
                    type="text" 
                    value={mandiDivision}
                    onChange={(e) => setMandiDivision(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#14532d] uppercase tracking-wider mb-1">
                    Admin Verification Key
                  </label>
                  <input 
                    type="text" 
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#d8e0d9] focus:border-[#14532d] outline-none text-xs bg-white font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Bank Details (EXCLUDED FOR ADMIN AS REQUESTED) */}
          {user.role !== 'admin' && (
            <div className="bg-gradient-to-br from-[#fffbeb] via-[#fef3c7]/50 to-[#fdfbf7] p-4 sm:p-5 rounded-2xl border border-[#fde68a] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#92400e]">
                  <CreditCard className="h-4 w-4 text-[#b45309]" />
                  <span>3. Bank Account & Direct Benefit Transfer (DBT)</span>
                </div>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BadgeCheck className="h-3 w-3 text-amber-700" /> Direct Transfer
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#78350f] mb-1">Bank Name</label>
                  <input 
                    type="text" 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#fcd34d] text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#78350f] mb-1">Account Number</label>
                  <input 
                    type="text" 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#fcd34d] text-xs font-mono outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#78350f] mb-1">IFSC Code</label>
                  <input 
                    type="text" 
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#fcd34d] text-xs font-mono uppercase outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#78350f] mb-1">UPI ID (Google Pay / PhonePe)</label>
                  <input 
                    type="text" 
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#fcd34d] text-xs outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Row: Cancel, Download PDF, Instant Save */}
          <div className="pt-4 border-t border-[#e2ece3] flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <X className="h-4 w-4 text-gray-500" />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-[#2d6a4f] bg-[#eaf4ec] hover:bg-[#d8edd9] text-[#14532d] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              title="Download your credentials as a verified PDF dossier"
            >
              <Download className="h-4 w-4 text-[#15803d]" />
              <span>Download Profile (PDF)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 w-full bg-gradient-to-r from-[#14532d] via-[#15803d] to-[#16a34a] hover:brightness-110 text-white py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <span>{saving ? 'Saving Instantly...' : 'Save Profile Instantly →'}</span>
              <ArrowRight className="h-4 w-4 text-[#fde047]" />
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
