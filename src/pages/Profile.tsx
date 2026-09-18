import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserCircle, MapPin, Wrench, Briefcase, Navigation, Sprout, Leaf, CheckCircle2, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [age, setAge] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [crops, setCrops] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setName(u.name && u.name !== 'New User' ? u.name : '');
      setLocation(u.location && u.location !== 'Unknown' ? u.location : 'Pune, Maharashtra');
      setSkills(u.skills || '');
      setExperience(u.experience || '');
      setAge(u.age || '');
      setFarmSize(u.farmSize || '15.4');
      setCrops(u.crops || 'Wheat, Soybean');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLocate = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Pune';
          const state = data.address.state || 'Maharashtra';
          setLocation([city, state].filter(Boolean).join(', '));
        } catch (e) {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocation('Pune, Maharashtra');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    
    try {
      const updatedData = {
        name,
        location,
        skills: user.role === 'laborer' ? skills : undefined,
        experience: user.role === 'laborer' ? experience : undefined,
        age: user.role === 'laborer' ? age : undefined,
        farmSize: user.role === 'farmer' ? farmSize : undefined,
        crops: user.role === 'farmer' ? crops : undefined,
        profileCompleted: true
      };

      // Clean undefined keys
      Object.keys(updatedData).forEach(key => (updatedData as any)[key] === undefined && delete (updatedData as any)[key]);

      // Safely Update/Set Firestore document
      try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, updatedData, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore sync optional warning:", dbErr);
      }

      // Update local storage
      const finalUser = { ...user, ...updatedData };
      localStorage.setItem('user', JSON.stringify(finalUser));
      setSuccessMessage('Profile saved successfully! Redirecting to Dashboard...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      console.error(err);
      // Fallback
      const finalUser = { ...user, name, location, profileCompleted: true };
      localStorage.setItem('user', JSON.stringify(finalUser));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-28 pb-16 bg-[#fbfbfa] flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Subtle organic background decoration */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#2d6a4f]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-[#eaf3eb] rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-[#183925]/5 border border-[#e6ebe7] p-8 sm:p-10 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-[#eef5ee] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#244b2f] shadow-inner">
            {user.role === 'farmer' ? <Sprout className="h-8 w-8" /> : <UserCircle className="h-8 w-8" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#183925] tracking-tight">
            {user.role === 'farmer' ? 'Farmer Farm Profile' : 'Laborer Professional Profile'}
          </h1>
          <p className="text-[#55695b] mt-1.5 text-sm font-normal">
            Configure your agricultural details for real-time farm telemetry and smart matching.
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#eef5ee] border border-[#d2e5d5] text-[#183925] text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#2d6a4f]" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#183925] uppercase tracking-wider mb-1.5">
                Full Name / Organization Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-[#d8e0d9] focus:border-[#244b2f] focus:ring-1 focus:ring-[#244b2f] outline-none transition bg-[#fcfdfc] text-sm"
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#183925] uppercase tracking-wider mb-1.5">
                Current Location
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#d8e0d9] focus:border-[#244b2f] focus:ring-1 focus:ring-[#244b2f] outline-none transition bg-[#fcfdfc] text-sm"
                    placeholder="e.g. Pune, Maharashtra"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={locating}
                  className="bg-[#183925] hover:bg-[#122c1d] text-white px-5 py-3 rounded-2xl font-semibold text-xs transition flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
                >
                  <Navigation className={`h-4 w-4 ${locating ? 'animate-pulse text-[#8CC63F]' : ''}`} />
                  {locating ? 'Locating...' : 'GPS Auto-Fill'}
                </button>
              </div>
            </div>

            {user.role === 'laborer' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#183925] uppercase tracking-wider mb-1.5">
                    Your Agricultural Skills
                  </label>
                  <div className="relative">
                    <Wrench className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#d8e0d9] focus:border-[#244b2f] focus:ring-1 focus:ring-[#244b2f] outline-none transition bg-[#fcfdfc] text-sm"
                      placeholder="e.g. Tractor Driving, Harvesting, Sowing"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-[#55695b] mt-1">Separate skills with commas (e.g. Harvesting, Drip Setup, Tractor Operating).</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-[#183925] uppercase tracking-wider mb-1.5">
                    Years of Experience
                  </label>
                  <input 
                    type="number" 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#d8e0d9] focus:border-[#244b2f] focus:ring-1 focus:ring-[#244b2f] outline-none transition bg-[#fcfdfc] text-sm"
                    placeholder="e.g. 5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#183925] uppercase tracking-wider mb-1.5">
                    Age
                  </label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#d8e0d9] focus:border-[#244b2f] focus:ring-1 focus:ring-[#244b2f] outline-none transition bg-[#fcfdfc] text-sm"
                    placeholder="e.g. 28"
                    required
                  />
                </div>
              </>
            )}

            {user.role === 'farmer' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#183925] uppercase tracking-wider mb-1.5">
                    Farm Size (Acres)
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#d8e0d9] focus:border-[#244b2f] focus:ring-1 focus:ring-[#244b2f] outline-none transition bg-[#fcfdfc] text-sm"
                    placeholder="e.g. 15.4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#183925] uppercase tracking-wider mb-1.5">
                    Primary Crops Grown
                  </label>
                  <input 
                    type="text" 
                    value={crops}
                    onChange={(e) => setCrops(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#d8e0d9] focus:border-[#244b2f] focus:ring-1 focus:ring-[#244b2f] outline-none transition bg-[#fcfdfc] text-sm"
                    placeholder="e.g. Wheat, Soybean, Cotton"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#183925] hover:bg-[#122c1d] text-white py-3.5 rounded-full font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 mt-6 flex justify-center items-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Save Profile & Open Dashboard</span>
                <ArrowRight className="h-4 w-4 text-[#8CC63F]" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
