import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserCircle, MapPin, Wrench, Briefcase, Navigation, Sprout, Leaf } from 'lucide-react';
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

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setName(u.name !== 'New User' ? u.name : '');
      setLocation(u.location !== 'Unknown' ? u.location : '');
      setSkills(u.skills || '');
      setExperience(u.experience || '');
      setAge(u.age || '');
      setFarmSize(u.farmSize || '');
      setCrops(u.crops || '');
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
          const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
          const state = data.address.state || '';
          setLocation([city, state].filter(Boolean).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch (e) {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        alert('Could not fetch location. Please ensure location permissions are granted.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, updatedData, { merge: true });

      // Update local storage
      const finalUser = { ...user, ...updatedData };
      localStorage.setItem('user', JSON.stringify(finalUser));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Error saving profile to Firebase. Ensure database permissions are correct.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-amber-50/30 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-full h-[40vh] bg-[#101b10] skew-y-3 origin-top-right -z-10"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl shadow-[#101b10]/10 border border-gray-100 p-8 z-10"
      >
        <div className="text-center mb-8">
          <div className="h-20 w-20 bg-[#8CC63F]/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md relative">
            {user.role === 'farmer' ? <Sprout className="h-10 w-10 text-[#8CC63F]" /> : <UserCircle className="h-10 w-10 text-[#8CC63F]" />}
            <Leaf className="absolute -bottom-2 -right-2 h-8 w-8 text-[#ffb703] transform rotate-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#101b10]">Complete Your Profile</h1>
          <p className="text-gray-500 mt-2 font-medium">Add details to help us connect you with the right opportunities.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name / Organization Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#8CC63F] focus:ring-0 outline-none transition bg-gray-50/50 focus:bg-white"
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Current Location</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#8CC63F] focus:ring-0 outline-none transition bg-gray-50/50 focus:bg-white"
                    placeholder="e.g. Pune, Maharashtra"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={locating}
                  className="bg-[#101b10] text-white px-5 py-3.5 rounded-xl font-bold hover:bg-[#1a2b1a] transition flex items-center gap-2 shadow-md disabled:opacity-50 whitespace-nowrap"
                >
                  <Navigation className={`h-5 w-5 ${locating ? 'animate-pulse text-[#8CC63F]' : ''}`} />
                  {locating ? 'Locating...' : 'Use GPS'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">Use GPS to automatically fetch your city and state for accurate local job matching.</p>
            </div>

            {user.role === 'laborer' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-green-900 mb-1">Your Skills</label>
                  <div className="relative">
                    <Wrench className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#8CC63F] focus:ring-0 outline-none transition bg-gray-50/50 focus:bg-white"
                      placeholder="e.g. Tractor Driving, Harvesting, Sowing"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-medium">Comma separated. Helps AI match you to better-paying jobs.</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Years of Experience</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <input 
                      type="number" 
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#8CC63F] focus:ring-0 outline-none transition bg-gray-50/50 focus:bg-white"
                      placeholder="e.g. 5"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Age</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#8CC63F] focus:ring-0 outline-none transition bg-gray-50/50 focus:bg-white"
                    placeholder="e.g. 28"
                    required
                  />
                </div>
              </>
            )}

            {user.role === 'farmer' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Farm Size (Acres)</label>
                  <input 
                    type="number" 
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#8CC63F] focus:ring-0 outline-none transition bg-gray-50/50 focus:bg-white"
                    placeholder="e.g. 15"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Primary Crops Grown</label>
                  <input 
                    type="text" 
                    value={crops}
                    onChange={(e) => setCrops(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#8CC63F] focus:ring-0 outline-none transition bg-gray-50/50 focus:bg-white"
                    placeholder="e.g. Wheat, Soybeans"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#101b10] hover:bg-[#1a2b1a] text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl mt-6 flex justify-center items-center gap-2"
          >
            {loading ? <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Save Profile & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
