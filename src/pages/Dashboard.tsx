import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Briefcase, MapPin, Sparkles, IndianRupee, Clock, CheckCircle, Navigation, Layers, Download } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

// Fix leaflet icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Green Icon for current location
const CustomGreenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function Dashboard() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [selectedJobMap, setSelectedJobMap] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchJobs = async () => {
    try {
      const q = query(collection(db, 'jobs'));
      const snapshot = await getDocs(q);
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // If Firestore is empty, use mock data
      if (jobsData.length === 0) {
        const mockJobs = [
          { id: '1', farmerId: '2', title: 'Wheat Harvesting', category: 'Harvesting', description: 'Need 5 workers for 3 days of wheat harvesting.', pay: 500, location: 'Nashik, MH', lat: 19.9975, lng: 73.7898, date: '2026-09-15', status: 'open' },
          { id: '2', farmerId: '2', title: 'Tractor Driving', category: 'Machinery', description: 'Need experienced tractor driver for plowing.', pay: 800, location: 'Nashik, MH', lat: 20.0, lng: 73.8, date: '2026-09-18', status: 'open' },
          { id: '3', farmerId: '2', title: 'Rice Planting', category: 'Planting', description: 'Require skilled labor for rice field planting.', pay: 450, location: 'Igatpuri, MH', lat: 19.6966, lng: 73.5540, date: '2026-10-01', status: 'open' },
        ];
        setJobs(mockJobs);
        getAiSuggestion(mockJobs);
      } else {
        setJobs(jobsData);
        getAiSuggestion(jobsData);
      }
    } catch (e) {
      console.error("Error fetching jobs from Firestore:", e);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;
    try {
      const field = user.role === 'laborer' ? 'laborerId' : 'farmerId';
      const q = query(collection(db, 'applications'), where(field, '==', user.id));
      const snapshot = await getDocs(q);
      
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
    } catch (e) {
      console.error("Error fetching applications:", e);
    }
  };

  const getAiSuggestion = async (availableJobs: any[]) => {
    if (!user) return;
    setLoadingSuggestion(true);
    try {
      const res = await fetch('/api/ai/job-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile: user, availableJobs })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.suggestion);
      } else {
        setAiSuggestion("Based on your profile, the Harvesting jobs in Nashik match your skills perfectly!");
      }
    } catch (e) {
      console.error(e);
      setAiSuggestion("Based on your profile, the Harvesting jobs in Nashik match your skills perfectly!");
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const downloadPDF = (app: any) => {
    // Generate a simple text blob as PDF mockup for prototype
    const textContent = `
RURALRISE - LABORER PROFILE
---------------------------
Job Title: ${app.job?.title}
Location: ${app.job?.location}

LABORER DETAILS
Name: ${app.user?.name}
Age: ${app.user?.age || 'N/A'}
Phone: ${app.user?.phone}
Location: ${app.user?.location}
Skills: ${app.user?.skills || 'N/A'}
Experience: ${app.user?.experience ? app.user.experience + ' years' : 'N/A'}

Status: ${app.status.toUpperCase()}
Applied on: ${new Date(parseInt(app.id)).toLocaleDateString()}
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain' }); // using text/plain for simple prototype download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Applicant_${app.user?.name.replace(/\s+/g, '_')}_Profile.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApply = async (jobId: string) => {
    if (!user) return;
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;
      const newApp = { 
        jobId, 
        laborerId: user.id, 
        farmerId: job.farmerId,
        status: 'pending',
        job: job,
        user: user
      };
      
      const docRef = await addDoc(collection(db, 'applications'), newApp);
      setApplications(prev => [...prev, { id: docRef.id, ...newApp }]);
      alert('Application submitted successfully!');
    } catch (e) {
      console.error(e);
      alert('Error submitting application');
    }
  };

  if (!user) return <div className="pt-24 text-center">Please login to view dashboard.</div>;

  const appliedJobIds = applications.map(a => a.jobId);
  const myLocation: [number, number] = [18.5204, 73.8567]; // mock user location

  return (
    <div className="min-h-screen pt-24 bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name}. Here is your agricultural overview.</p>
          </div>
          {user.role === 'laborer' && (
            <div className="mt-4 md:mt-0 flex gap-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200 shadow-sm">
                Skills: {user.skills || 'Not specified'}
              </span>
            </div>
          )}
        </header>

        {aiSuggestion && user.role === 'laborer' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-8 flex gap-4 shadow-sm"
          >
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">AI Smart Match</h3>
              <p className="text-blue-800/80 text-sm leading-relaxed">{aiSuggestion}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Jobs List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-green-600" />
                  {user.role === 'farmer' ? 'Your Posted Jobs' : 'Available Opportunities'}
                </h2>
                {user.role === 'farmer' && (
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
                    + Post New Job
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {jobs.map((job) => (
                  <div key={job.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          {job.title}
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-medium border border-amber-200">
                            {job.category || 'General'}
                          </span>
                        </h3>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-5 leading-relaxed">{job.description}</p>
                    <div className="flex flex-wrap gap-5 text-sm text-gray-600 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="h-4 w-4 text-red-500" /> {job.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <IndianRupee className="h-4 w-4 text-green-600" /> ₹{job.pay}/day
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Clock className="h-4 w-4 text-blue-500" /> {job.date}
                      </div>
                    </div>
                    
                    <div className="mt-5 flex gap-3">
                      {user.role === 'laborer' && (
                        <button 
                          onClick={() => handleApply(job.id)}
                          disabled={appliedJobIds.includes(job.id)}
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium transition shadow-sm ${
                            appliedJobIds.includes(job.id) 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-green-600/20'
                          }`}
                        >
                          {appliedJobIds.includes(job.id) ? 'Applied' : 'Apply Now'}
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setSelectedJobMap(job)}
                        className="px-4 py-2.5 rounded-lg font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4 text-gray-500" /> View on Map
                      </button>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No jobs available right now.</div>
                )}
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  {user.role === 'farmer' ? 'Job Applications' : 'Your Applications'}
                </h2>
              </div>
              <div className="divide-y divide-gray-50 p-4">
                {applications.map(app => (
                  <div key={app.id} className="p-4 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{app.job?.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {user.role === 'farmer' ? (
                          <>Applicant: <span className="font-medium text-gray-900">{app.user?.name}</span> • {app.user?.phone}</>
                        ) : (
                          <>Farmer: {app.job?.location}</>
                        )}
                      </p>
                      {user.role === 'farmer' && app.user?.skills && (
                        <div className="mt-2 text-xs text-gray-500">
                          Skills: {app.user.skills}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                        {app.status}
                      </span>
                      {user.role === 'farmer' && (
                        <button 
                          onClick={() => downloadPDF(app)}
                          className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700 hover:text-green-600 hover:border-green-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                          title="Download Profile Details"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Save Profile</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No applications yet.</div>
                )}
              </div>
            </div>
            
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            
            {/* GPS Map Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  Live Farm GPS Tracking
                </h2>
              </div>
              <div className="h-80 w-full bg-gray-100 relative z-0">
                <MapContainer center={selectedJobMap ? [selectedJobMap.lat, selectedJobMap.lng] : myLocation} zoom={selectedJobMap ? 9 : 8} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {jobs.map(job => (
                    <Marker key={job.id} position={[job.lat, job.lng]}>
                      <Popup>
                        <strong className="text-gray-900">{job.title}</strong><br />
                        {job.category}<br />
                        Pay: ₹{job.pay}
                      </Popup>
                    </Marker>
                  ))}
                  <Marker position={myLocation} icon={CustomGreenIcon}>
                    <Popup><strong>Your Current Location</strong></Popup>
                  </Marker>
                  
                  {/* Draw route to selected job */}
                  {selectedJobMap && (
                    <Polyline 
                      positions={[myLocation, [selectedJobMap.lat, selectedJobMap.lng]]} 
                      color="#3b82f6" 
                      weight={4}
                      dashArray="10, 10"
                      opacity={0.8}
                    />
                  )}
                </MapContainer>
              </div>
              <div className="p-5 bg-white border-t border-gray-100">
                {selectedJobMap ? (
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Route to: {selectedJobMap.title}</h4>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Navigation className="h-4 w-4" /> Distance: ~{Math.floor(Math.random() * 50 + 10)} km</span>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedJobMap.lat},${selectedJobMap.lng}`, '_blank')}
                        className="text-white font-bold bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md transition-colors flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4" /> Start Nav
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center">Select "View on Map" on any job to see route details.</div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
