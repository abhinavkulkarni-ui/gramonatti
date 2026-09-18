import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  UserCircle, 
  ShieldCheck, 
  MapPin, 
  Navigation, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Tractor, 
  Wheat, 
  Briefcase,
  Layers,
  Phone,
  IndianRupee,
  Building,
  CreditCard,
  BadgeCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import RuralRiseLogo from './RuralRiseLogo';

interface OnboardingModalProps {
  user: UserProfile;
  isOpen: boolean;
  onComplete: (updatedUser: UserProfile) => void;
}

const COMMON_SKILLS = [
  'Tractor Driving & Rotavator',
  'Wheat Harvesting',
  'Bajra / Jowar Harvesting',
  'Precision Spraying',
  'Drip Irrigation Setup',
  'Transplanting & Sowing',
  'Fruit & Grape Picking',
  'Dairy & Cattle Care',
  'Loading & Agro Transport'
];

const COMMON_CROPS = [
  'Wheat (Sharbati/Lokwan)',
  'Desi Hybrid Bajra',
  'Maldandi Jowar',
  'Yellow Soybean',
  'Organic Cotton',
  'Toor / Gram Dal',
  'Nashik Red Onion',
  'Sugarcane'
];

export default function OnboardingModal({ user, isOpen, onComplete }: OnboardingModalProps) {
  const [role, setRole] = useState<UserRole>(user.role || 'farmer');
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '+91 98220 12345');
  const [location, setLocation] = useState(user.location || 'Nashik, Maharashtra');
  const [district, setDistrict] = useState(user.district || 'Nashik');
  const [taluka, setTaluka] = useState(user.taluka || 'Niphad');
  const [locating, setLocating] = useState(false);

  // Farmer specific state
  const [farmName, setFarmName] = useState(user.farmName || 'Kisan Kranti Agro Farm');
  const [farmSize, setFarmSize] = useState(user.farmSize || '12.5');
  const [soilType, setSoilType] = useState(user.soilType || 'Black Loamy / Alluvial');
  const [crops, setCrops] = useState<string[]>(
    user.crops ? user.crops.split(', ') : ['Wheat (Sharbati/Lokwan)', 'Desi Hybrid Bajra']
  );
  const [customCrop, setCustomCrop] = useState('');
  const [irrigationType, setIrrigationType] = useState(user.irrigationType || 'Drip & Borewell');
  const [farmGateAddress, setFarmGateAddress] = useState(user.farmGateAddress || 'Survey No. 42, Gate 3, Village Post Niphad');
  const [kisanCardId, setKisanCardId] = useState(user.kisanCardId || 'MH-KCC-78219');

  // Laborer specific state
  const [age, setAge] = useState(user.age ? String(user.age) : '28');
  const [gender, setGender] = useState(user.gender || 'Male');
  const [skills, setSkills] = useState<string[]>(
    user.skills ? user.skills.split(', ') : ['Tractor Driving & Rotavator', 'Wheat Harvesting', 'Drip Irrigation Setup']
  );
  const [customSkill, setCustomSkill] = useState('');
  const [experience, setExperience] = useState(user.experience || '5');
  const [expectedWage, setExpectedWage] = useState(user.expectedWage ? String(user.expectedWage) : '650');
  const [workingRadiusKm, setWorkingRadiusKm] = useState(user.workingRadiusKm ? String(user.workingRadiusKm) : '25');
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || 'Sunil Pawar (Brother)');
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergencyPhone || '+91 94231 99887');

  // Bank & Payment Details (Crucial for direct wage disbursals and crop sale receipts)
  const [bankName, setBankName] = useState(user.bankName || 'State Bank of India (SBI)');
  const [accountNumber, setAccountNumber] = useState(user.accountNumber || '34891029384');
  const [ifscCode, setIfscCode] = useState(user.ifscCode || 'SBIN0001245');
  const [upiId, setUpiId] = useState(user.upiId || 'kisan.rural@upi');
  const [aadhaarNumber, setAadhaarNumber] = useState(user.aadhaarNumber || 'XXXX-XXXX-8921');

  // Admin specific state
  const [mandiDivision, setMandiDivision] = useState(user.mandiDivision || 'Pune APMC & Agri Marketing Board');
  const [adminCode, setAdminCode] = useState(user.adminCode || 'GRAMONNATI-ADMIN-2026');

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills([...skills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const toggleCrop = (crop: string) => {
    if (crops.includes(crop)) {
      setCrops(crops.filter(c => c !== crop));
    } else {
      setCrops([...crops, crop]);
    }
  };

  const addCustomCrop = () => {
    if (customCrop.trim() && !crops.includes(customCrop.trim())) {
      setCrops([...crops, customCrop.trim()]);
      setCustomCrop('');
    }
  };

  const handleAutoLocate = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported in this environment');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.district || 'Nashik';
          const subDistrict = data.address.county || data.address.suburb || 'Taluka Center';
          const state = data.address.state || 'Maharashtra';
          setLocation(`${city}, ${state}`);
          setDistrict(city);
          setTaluka(subDistrict);
        } catch (e) {
          setLocation(`Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocation('Nashik Rural, Maharashtra');
        setDistrict('Nashik');
        setTaluka('Niphad');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatedUser: UserProfile = {
      ...user,
      name: name.trim() || 'Rural Rise Member',
      role,
      phone: phone.trim(),
      location: location.trim(),
      district: district.trim(),
      taluka: taluka.trim(),
      profileCompleted: true,
      // Bank / Financial details
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim(),
      upiId: upiId.trim(),
      aadhaarNumber: aadhaarNumber.trim(),
      // Farmer
      farmName: role === 'farmer' ? farmName.trim() : undefined,
      farmSize: role === 'farmer' ? farmSize : undefined,
      crops: role === 'farmer' ? crops.join(', ') : undefined,
      soilType: role === 'farmer' ? soilType : undefined,
      irrigationType: role === 'farmer' ? irrigationType : undefined,
      farmGateAddress: role === 'farmer' ? farmGateAddress.trim() : undefined,
      kisanCardId: role === 'farmer' ? kisanCardId.trim() : undefined,
      // Laborer
      age: role === 'laborer' ? Number(age) : undefined,
      gender: role === 'laborer' ? gender : undefined,
      skills: role === 'laborer' ? skills.join(', ') : undefined,
      experience: role === 'laborer' ? experience : undefined,
      expectedWage: role === 'laborer' ? Number(expectedWage) : undefined,
      workingRadiusKm: role === 'laborer' ? Number(workingRadiusKm) : undefined,
      emergencyContact: role === 'laborer' ? emergencyContact.trim() : undefined,
      emergencyPhone: role === 'laborer' ? emergencyPhone.trim() : undefined,
      // Admin
      mandiDivision: role === 'admin' ? mandiDivision.trim() : undefined,
      adminCode: role === 'admin' ? adminCode.trim() : undefined,
    };

    // Instant local save
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Non-blocking firestore sync
    if (user.id) {
      const userRef = doc(db, 'users', user.id);
      setDoc(userRef, updatedUser, { merge: true }).catch((err) => {
        console.warn('Optional profile firestore sync note:', err);
      });
    }

    setSaving(false);
    onComplete(updatedUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="bg-gradient-to-b from-[#fdfbf7] via-white to-[#f6faf5] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-[#bbf7d0]/60 my-6 relative overflow-hidden text-[#143d24]"
      >
        {/* Top Decorative accent banner */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-[#14532d] via-[#16a34a] via-[#eab308] to-[#ca8a04]"></div>

        {/* Header with Gramonnati Rural Rise branding */}
        <div className="text-center mb-6 pt-1">
          <div className="inline-flex items-center justify-center mb-2">
            <RuralRiseLogo size="sm" showText={true} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#14532d] font-bold mt-1">
            Complete Your Rural Rise Profile
          </h2>
          <p className="text-xs sm:text-sm text-[#496552] mt-1 max-w-lg mx-auto">
            Please fill in your authentic farming, wage, and banking details to activate instant jobs, direct mandi payouts, and crop dispatch.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* 1. ROLE SELECTOR */}
          <div className="bg-white/80 p-3.5 rounded-2xl border border-[#dce8de] shadow-xs">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#14532d] mb-2">
              Step 1: Choose Your Platform Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  role === 'farmer' 
                    ? 'border-[#15803d] bg-[#ecfdf5] text-[#14532d] ring-2 ring-[#15803d]/30 font-bold shadow-sm' 
                    : 'border-[#e2eae3] hover:bg-[#f8faf8] text-[#55695b]'
                }`}
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${role === 'farmer' ? 'bg-[#14532d] text-[#fde047]' : 'bg-gray-100 text-gray-500'}`}>
                  <Sprout className="h-5 w-5" />
                </div>
                <span className="text-xs">Farmer / Producer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('laborer')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  role === 'laborer' 
                    ? 'border-[#15803d] bg-[#ecfdf5] text-[#14532d] ring-2 ring-[#15803d]/30 font-bold shadow-sm' 
                    : 'border-[#e2eae3] hover:bg-[#f8faf8] text-[#55695b]'
                }`}
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${role === 'laborer' ? 'bg-[#14532d] text-[#fde047]' : 'bg-gray-100 text-gray-500'}`}>
                  <Tractor className="h-5 w-5" />
                </div>
                <span className="text-xs">Agricultural Worker</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  role === 'admin' 
                    ? 'border-[#15803d] bg-[#ecfdf5] text-[#14532d] ring-2 ring-[#15803d]/30 font-bold shadow-sm' 
                    : 'border-[#e2eae3] hover:bg-[#f8faf8] text-[#55695b]'
                }`}
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${role === 'admin' ? 'bg-[#14532d] text-[#fde047]' : 'bg-gray-100 text-gray-500'}`}>
                  <Building className="h-5 w-5" />
                </div>
                <span className="text-xs">APMC Admin</span>
              </button>
            </div>
          </div>

          {/* 2. BASIC PROFILE DETAILS */}
          <div className="bg-white/80 p-4 rounded-2xl border border-[#dce8de] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#14532d]">
              <UserCircle className="h-4 w-4 text-[#16a34a]" />
              <span>Step 2: Personal & Contact Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#14532d] mb-1">Full Legal Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Baburao Patil"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1dec8] bg-[#fbfdfb] focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14532d] mb-1">Mobile / WhatsApp Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d1dec8] bg-[#fbfdfb] focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Location & GPS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-[#14532d]">Village / District Address</label>
                  <button 
                    type="button"
                    onClick={handleAutoLocate}
                    disabled={locating}
                    className="text-[11px] text-[#15803d] hover:text-[#14532d] font-bold flex items-center gap-1"
                  >
                    <Navigation className={`h-3 w-3 ${locating ? 'animate-spin' : ''}`} />
                    <span>{locating ? 'GPS Detecting...' : 'Auto-Locate GPS'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Niphad, Nashik, Maharashtra"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#d1dec8] bg-[#fbfdfb] text-xs outline-none"
                    required
                  />
                  <MapPin className="h-3.5 w-3.5 text-[#15803d] absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14532d] mb-1">Taluka / Tehsil</label>
                <input 
                  type="text" 
                  value={taluka}
                  onChange={(e) => setTaluka(e.target.value)}
                  placeholder="Niphad"
                  className="w-full px-3 py-2 rounded-xl border border-[#d1dec8] bg-[#fbfdfb] text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. DYNAMIC ROLE SPECIFIC DETAILS (Farmer vs Laborer) */}
          {role === 'laborer' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#f0fdf4] to-[#fefce8] p-4 rounded-2xl border border-[#bbf7d0] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#14532d]">
                  <Briefcase className="h-4 w-4 text-[#16a34a]" />
                  <span>Step 3: Laborer Skills, Experience & Daily Wage</span>
                </div>
                <span className="text-[10px] bg-[#14532d] text-[#fde047] font-bold px-2 py-0.5 rounded-full">
                  Worker Verification
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Age</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="28"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Gender</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Experience (Yrs)</label>
                  <input 
                    type="number" 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Expected Wage (₹/day)</label>
                  <input 
                    type="number" 
                    value={expectedWage}
                    onChange={(e) => setExpectedWage(e.target.value)}
                    placeholder="650"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs font-bold text-[#14532d] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Skills Interactive Tag Selector */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1.5">
                  Click to Select Agricultural Skills (Selected: {skills.length})
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_SKILLS.map((skill) => {
                    const isSelected = skills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#14532d] text-white border-[#14532d] font-bold shadow-xs'
                            : 'bg-white text-[#385541] border-[#c6dec9] hover:bg-[#eef5ee]'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-[#fde047]" />}
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add other skill (e.g. Grafting, Pruning)..."
                    className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    className="px-3 py-1.5 bg-[#14532d] text-white text-xs font-bold rounded-lg hover:bg-[#166534]"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-[#c6dec9]/60">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Emergency Contact Person</label>
                  <input 
                    type="text" 
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Brother / Village Mukhiya"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Emergency Phone</label>
                  <input 
                    type="text" 
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+91 94231 99887"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {role === 'farmer' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#f0fdf4] to-[#fefce8] p-4 rounded-2xl border border-[#bbf7d0] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#14532d]">
                  <Wheat className="h-4 w-4 text-[#16a34a]" />
                  <span>Step 3: Farm Land, Crops & Irrigation Specifics</span>
                </div>
                <span className="text-[10px] bg-[#14532d] text-[#fde047] font-bold px-2 py-0.5 rounded-full">
                  Job Provider Setup
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Farm / Estate Name</label>
                  <input 
                    type="text" 
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Kisan Kranti Farm"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Total Land (Acres)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder="12.5"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs font-bold text-[#14532d] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Irrigation Mode</label>
                  <select 
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                  >
                    <option value="Drip & Borewell">Drip & Borewell</option>
                    <option value="Canal Irrigation">Canal Irrigation</option>
                    <option value="Sprinkler System">Sprinkler System</option>
                    <option value="Rainfed / Dryland">Rainfed / Dryland</option>
                  </select>
                </div>
              </div>

              {/* Crops Selection */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1.5">
                  Select Cultivated Crops (Wheat, Bajra, Jowar, Soybean, etc.)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_CROPS.map((crop) => {
                    const isSelected = crops.includes(crop);
                    return (
                      <button
                        type="button"
                        key={crop}
                        onClick={() => toggleCrop(crop)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#14532d] text-white border-[#14532d] font-bold shadow-xs'
                            : 'bg-white text-[#385541] border-[#c6dec9] hover:bg-[#eef5ee]'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-[#fde047]" />}
                        <span>{crop}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    placeholder="Add other crop variety..."
                    className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomCrop}
                    className="px-3 py-1.5 bg-[#14532d] text-white text-xs font-bold rounded-lg hover:bg-[#166534]"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Farm Gate & Kisan Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-[#c6dec9]/60">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Farm Gate Address (For Labor / Dispatch)</label>
                  <input 
                    type="text" 
                    value={farmGateAddress}
                    onChange={(e) => setFarmGateAddress(e.target.value)}
                    placeholder="Gate No. 4, Survey 88, Near Taluka Canal"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Kisan Credit Card / 7/12 Extract No.</label>
                  <input 
                    type="text" 
                    value={kisanCardId}
                    onChange={(e) => setKisanCardId(e.target.value)}
                    placeholder="MH-KCC-78219"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none font-mono"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {role === 'admin' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#f0fdf4] to-[#fefce8] p-4 rounded-2xl border border-[#bbf7d0] space-y-3"
            >
              <div className="text-xs font-bold text-[#14532d] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#16a34a]" />
                <span>APMC Mandi Administration Credentials</span>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Mandi / Division</label>
                <input 
                  type="text" 
                  value={mandiDivision}
                  onChange={(e) => setMandiDivision(e.target.value)}
                  placeholder="Pune APMC Yard & State Marketing Board"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#496552] mb-1">Admin Verification Code</label>
                <input 
                  type="text" 
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="GRAMONNATI-ADMIN-2026"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#c6dec9] text-xs outline-none font-mono"
                  required
                />
              </div>
            </motion.div>
          )}

          {/* 4. BANK & PAYMENT DBT DETAILS (REQUIRED FOR BOTH WORKERS & FARMERS) */}
          <div className="bg-gradient-to-br from-[#fffbeb] via-[#fef3c7]/50 to-[#fdfbf7] p-4 rounded-2xl border border-[#fde68a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#92400e]">
                <CreditCard className="h-4 w-4 text-[#b45309]" />
                <span>Step 4: Bank Account & UPI Details (For Direct Payouts)</span>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <BadgeCheck className="h-3 w-3 text-amber-700" /> DBT Ready
              </span>
            </div>

            <p className="text-[11px] text-[#78350f]">
              {role === 'laborer' 
                ? 'Your wages will be credited directly to this verified bank account or UPI ID after work completion.' 
                : 'Crop sale proceeds and payments from commodity buyers will be settled directly to this account.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#78350f] mb-1">Bank Name</label>
                <input 
                  type="text" 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India (SBI)"
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
                  placeholder="34891029384"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#fcd34d] text-xs font-mono outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#78350f] mb-1">IFSC Code</label>
                <input 
                  type="text" 
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="SBIN0001245"
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
                  placeholder="9822011223@ybl"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#fcd34d] text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#78350f] mb-1">Aadhaar / DBT Identifier</label>
                <input 
                  type="text" 
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="XXXX-XXXX-8921"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#fcd34d] text-xs font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#14532d] via-[#15803d] to-[#16a34a] hover:brightness-110 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <span>{saving ? 'Activating Profile & Credentials...' : 'Save Profile & Launch Gramonnati Dashboard'}</span>
              <ArrowRight className="h-4 w-4 text-[#fde047]" />
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
