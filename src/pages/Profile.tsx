import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserCircle, MapPin, Wrench, Briefcase, Navigation, Sprout } from 'lucide-react';

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
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name,
          location,
          skills: user.role === 'laborer' ? skills : undefined,
          experience: user.role === 'laborer' ? experience : undefined,
          age: user.role === 'laborer' ? age : undefined,
          farmSize: user.role === 'farmer' ? farmSize : undefined,
          crops: user.role === 'farmer' ? crops : undefined,
        })
      });
      const data = await res.json();
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-green-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-green-900/5 border border-green-100 p-8"
      >
        <div className="text-center mb-8">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
            {user.role === 'farmer' ? <Sprout className="h-10 w-10 text-green-600" /> : <UserCircle className="h-10 w-10 text-green-600" />}
          </div>
          <h1 className="text-3xl font-bold text-green-950">Complete Your Profile</h1>
          <p className="text-green-700/70 mt-2">Add details to help us connect you with the right opportunities.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-green-900 mb-1">Full Name / Organization Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-green-900 mb-1">Current Location</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="e.g. Pune, Maharashtra"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={locating}
                  className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl font-medium hover:bg-blue-100 transition flex items-center gap-2 border border-blue-200 disabled:opacity-50 whitespace-nowrap"
                >
                  <Navigation className={`h-5 w-5 ${locating ? 'animate-pulse' : ''}`} />
                  {locating ? 'Locating...' : 'Use GPS'}
                </button>
              </div>
              <p className="text-xs text-green-600/70 mt-2">Use GPS to automatically fetch your city and state for accurate local job matching.</p>
            </div>

            {user.role === 'laborer' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-green-900 mb-1">Your Skills</label>
                  <div className="relative">
                    <Wrench className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      placeholder="e.g. Tractor Driving, Harvesting, Sowing"
                      required
                    />
                  </div>
                  <p className="text-xs text-green-600/70 mt-2">Comma separated. Helps AI match you to better-paying jobs.</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-green-900 mb-1">Years of Experience</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <input 
                      type="number" 
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      placeholder="e.g. 5"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-green-900 mb-1">Age</label>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="e.g. 28"
                    required
                  />
                </div>
              </>
            )}

            {user.role === 'farmer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-green-900 mb-1">Farm Size (Acres)</label>
                  <input 
                    type="number" 
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="e.g. 15"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-900 mb-1">Primary Crops Grown</label>
                  <input 
                    type="text" 
                    value={crops}
                    onChange={(e) => setCrops(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
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
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition shadow-xl shadow-green-600/20 mt-4 flex justify-center items-center gap-2"
          >
            {loading ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Profile & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
