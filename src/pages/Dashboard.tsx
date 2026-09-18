import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { 
  Briefcase, 
  MapPin, 
  Sparkles, 
  IndianRupee, 
  Clock, 
  CheckCircle, 
  Navigation, 
  Layers, 
  Download, 
  Plus, 
  X, 
  Sprout, 
  Leaf,
  Droplets, 
  Calendar, 
  CloudSun, 
  ShieldCheck, 
  TrendingUp, 
  UserCheck,
  Building,
  Phone,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Truck,
  Package,
  Award,
  Filter,
  DollarSign,
  AlertCircle,
  CreditCard,
  BadgeCheck,
  RefreshCw,
  Mail
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { Job, JobApplication, FarmProduct, ProductOrder, UserProfile } from '../types';
import OnboardingModal from '../components/OnboardingModal';
import RuralRiseLogo from '../components/RuralRiseLogo';
import DestinationMapModal from '../components/DestinationMapModal';
import { exportProfileToPdf } from '../lib/pdfExport';

// Fix Leaflet icons
import L from 'leaflet';
let DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CustomGreenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'products' | 'admin'>('jobs');
  const [areaFilter, setAreaFilter] = useState<string>('All');
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [selectedJobMap, setSelectedJobMap] = useState<Job | null>(null);
  const [activeDestinationJob, setActiveDestinationJob] = useState<Job | null>(null);
  
  // Post Job Modal State
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCategory, setNewJobCategory] = useState<'Harvesting' | 'Machinery' | 'Sowing' | 'Irrigation' | 'Spraying'>('Harvesting');
  const [newJobDescription, setNewJobDescription] = useState('');
  const [newJobPay, setNewJobPay] = useState('700');
  const [newJobArea, setNewJobArea] = useState('Nashik');
  const [newJobLocation, setNewJobLocation] = useState('Niphad, Nashik, MH');
  const [newJobWorkersNeeded, setNewJobWorkersNeeded] = useState(4);
  const [postingJob, setPostingJob] = useState(false);

  // Post Produce Modal State
  const [showSellProductModal, setShowSellProductModal] = useState(false);
  const [newProduceCrop, setNewProduceCrop] = useState<FarmProduct['cropType']>('Wheat');
  const [newProduceVariety, setNewProduceVariety] = useState('Sharbati Gold');
  const [newProducePriceKg, setNewProducePriceKg] = useState('32');
  const [newProduceQtyKg, setNewProduceQtyKg] = useState('1000');
  const [newProduceLocation, setNewProduceLocation] = useState(user?.location || 'Nashik Mandi Yard');
  const [postingProduce, setPostingProduce] = useState(false);

  const [toastMsg, setToastMsg] = useState('');

  // Email Verification State
  const [verificationDismissed, setVerificationDismissed] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verificationBannerMsg, setVerificationBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendVerificationEmail = async () => {
    setResendingVerification(true);
    setVerificationBannerMsg(null);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setVerificationBannerMsg({
          type: 'success',
          text: `Verification link has been resent to ${auth.currentUser.email || user?.email}! Please check your email inbox and spam folder.`
        });
        showToast('Verification email resent successfully!');
      } else {
        setVerificationBannerMsg({
          type: 'error',
          text: 'No active authentication session. Please sign in to request email verification.'
        });
      }
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setVerificationBannerMsg({
          type: 'error',
          text: 'Please wait a minute before requesting another verification email.'
        });
      } else {
        setVerificationBannerMsg({
          type: 'error',
          text: err.message || 'Unable to send verification email. Please try again.'
        });
      }
    } finally {
      setResendingVerification(false);
    }
  };

  const handleCheckEmailVerified = async () => {
    if (!user) return;
    setCheckingVerification(true);
    setVerificationBannerMsg(null);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          const updatedUser: UserProfile = { ...user, emailVerified: true };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('user-profile-updated'));

          // Update local accounts
          try {
            const rawAccounts = localStorage.getItem('gramonnati_registered_users');
            if (rawAccounts) {
              const accs = JSON.parse(rawAccounts);
              const key = (auth.currentUser.email || user.email || '').toLowerCase().trim();
              if (accs[key]) {
                accs[key].emailVerified = true;
                localStorage.setItem('gramonnati_registered_users', JSON.stringify(accs));
              }
            }
          } catch (e) {}

          setVerificationBannerMsg({
            type: 'success',
            text: 'Your email has been verified! Gramonnati Verified Member status is now active.'
          });
          showToast('Email verified! Officially verified badge unlocked.');
          return;
        } else {
          setVerificationBannerMsg({
            type: 'error',
            text: `Email is not verified yet. Please open the link sent to ${auth.currentUser.email || user.email}, then click Check Status.`
          });
        }
      } else {
        setVerificationBannerMsg({
          type: 'error',
          text: 'Session expired. Please sign in again.'
        });
      }
    } catch (e) {
      setVerificationBannerMsg({
        type: 'error',
        text: 'Unable to check verification status. Please check your network connection.'
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  // Fallback / Initial Data
  const defaultMockJobs: Job[] = [
    { 
      id: 'job-1', 
      farmerId: 'farmer-1', 
      farmerName: 'Balasaheb Patil',
      farmerPhone: '+91 98220 11223',
      title: 'Wheat Harvesting & Sheaf Bundling', 
      category: 'Harvesting', 
      description: 'Require 6 skilled workers for 3 days of Sharbati wheat harvesting, mechanical threshing, and crop bagging in Field A.', 
      pay: 750, 
      wageType: 'daily',
      area: 'Nashik',
      location: 'Niphad, Nashik, MH', 
      lat: 20.0833, 
      lng: 74.1167, 
      date: '2026-09-22', 
      workersNeeded: 6,
      workersHired: 2,
      amenities: ['Morning Breakfast', 'Chilled Drinking Water', 'Local Bus Transit Pickup'],
      distanceKm: 14,
      status: 'open' 
    },
    { 
      id: 'job-2', 
      farmerId: 'farmer-1', 
      farmerName: 'Balasaheb Patil',
      farmerPhone: '+91 98220 11223',
      title: 'Precision Tractor Plowing with Rotavator', 
      category: 'Machinery', 
      description: 'Require experienced tractor driver with hydraulic rotavator experience for deep soil aerification across 20 acres.', 
      pay: 950, 
      wageType: 'daily',
      area: 'Pune',
      location: 'Baramati Rural, Pune, MH', 
      lat: 18.1517, 
      lng: 74.5772, 
      date: '2026-09-24', 
      workersNeeded: 2,
      workersHired: 1,
      amenities: ['Diesel & Equipment Provided', 'Lunch Included'],
      distanceKm: 28,
      status: 'open' 
    },
    { 
      id: 'job-3', 
      farmerId: 'farmer-2', 
      farmerName: 'Kaveri Organic Orchards',
      farmerPhone: '+91 94231 77889',
      title: 'Drip Lateral Installation & Bajra Sowing', 
      category: 'Irrigation', 
      description: 'Installing pressure-compensated drip emitters across 15 acres of pearl millet (Bajra) plots and sowing seed beds.', 
      pay: 650, 
      wageType: 'daily',
      area: 'Baramati',
      location: 'Indapur - Baramati Road, MH', 
      lat: 18.1150, 
      lng: 74.6120, 
      date: '2026-09-26', 
      workersNeeded: 8,
      workersHired: 4,
      amenities: ['Tea & Snacks', 'Protective Gloves Provided'],
      distanceKm: 22,
      status: 'open' 
    },
    { 
      id: 'job-4', 
      farmerId: 'farmer-3', 
      farmerName: 'Shetkari Samruddhi Trust',
      farmerPhone: '+91 91588 33441',
      title: 'Soybean Pod Threshing & Quality Bagging', 
      category: 'Harvesting', 
      description: 'Sorting, threshing, and 50kg bagging of harvested yellow soybean for government APMC procurement.', 
      pay: 700, 
      wageType: 'daily',
      area: 'Latur',
      location: 'Ausa Road, Latur Mandi Yard, MH', 
      lat: 18.4088, 
      lng: 76.5604, 
      date: '2026-09-28', 
      workersNeeded: 10,
      workersHired: 3,
      amenities: ['Full Day Meals', 'On-farm Resting Shed'],
      distanceKm: 42,
      status: 'open' 
    }
  ];

  const defaultMockProducts: FarmProduct[] = [
    {
      id: 'prod-1',
      farmerId: user?.id || 'farmer-1',
      farmerName: user?.name || 'Balasaheb Patil Farm',
      farmerPhone: user?.phone || '+91 98220 11223',
      name: 'Certified Sharbati Gold Wheat (Grade A+)',
      cropType: 'Wheat',
      category: 'Cereals',
      variety: 'Sharbati Premium',
      pricePerKg: 32,
      pricePerQuintal: 3200,
      quantityAvailableKg: 1200,
      minOrderKg: 50,
      description: 'Sun-ripened organic Sharbati wheat, low moisture (9.8%), ideal for premium rotis.',
      location: 'Niphad, Nashik, MH',
      mandiBenchmarkRate: 2950,
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
      harvestDate: '2026-09-10',
      organicCertified: true,
      qualityGrade: 'A+',
      status: 'active'
    },
    {
      id: 'prod-2',
      farmerId: user?.id || 'farmer-1',
      farmerName: user?.name || 'Balasaheb Patil Farm',
      farmerPhone: user?.phone || '+91 98220 11223',
      name: 'Desi Hybrid Bajra (Pearl Millet)',
      cropType: 'Bajra',
      category: 'Millets',
      variety: 'Desi Dhanashakti',
      pricePerKg: 26,
      pricePerQuintal: 2600,
      quantityAvailableKg: 2500,
      minOrderKg: 100,
      description: 'High-iron, double-sieved pearl millet with 10.5% moisture.',
      location: 'Baramati, Pune Rural, MH',
      mandiBenchmarkRate: 2350,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
      harvestDate: '2026-09-12',
      organicCertified: true,
      qualityGrade: 'A+',
      status: 'active'
    },
    {
      id: 'prod-3',
      farmerId: user?.id || 'farmer-1',
      farmerName: user?.name || 'Balasaheb Patil Farm',
      farmerPhone: user?.phone || '+91 98220 11223',
      name: 'Maldandi Jowar (White Sorghum)',
      cropType: 'Jowar',
      category: 'Millets',
      variety: 'M-35-1 Maldandi Special',
      pricePerKg: 42,
      pricePerQuintal: 4200,
      quantityAvailableKg: 1800,
      minOrderKg: 50,
      description: 'Heritage GI tagged white bold jowar for soft bhakris.',
      location: 'Solapur / Marathwada, MH',
      mandiBenchmarkRate: 3800,
      imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=600',
      harvestDate: '2026-09-14',
      organicCertified: true,
      qualityGrade: 'A+',
      status: 'active'
    }
  ];

  const defaultMockOrders: ProductOrder[] = [
    {
      id: 'ord-881',
      productId: 'prod-1',
      productName: 'Certified Sharbati Gold Wheat (Grade A+)',
      cropType: 'Wheat',
      farmerId: user?.id || 'farmer-1',
      farmerName: user?.name || 'Balasaheb Patil Farm',
      buyerId: 'buyer-201',
      buyerName: 'Swastik Flour Mills Pune',
      buyerPhone: '+91 98230 44556',
      deliveryAddress: 'Hadapsar Industrial Estate, Pune, MH',
      deliveryType: 'mandi_delivery',
      quantityKg: 500,
      pricePerKg: 32,
      totalAmount: 16000,
      orderDate: '2026-09-16',
      status: 'confirmed'
    },
    {
      id: 'ord-882',
      productId: 'prod-2',
      productName: 'Desi Hybrid Bajra (Pearl Millet)',
      cropType: 'Bajra',
      farmerId: user?.id || 'farmer-1',
      farmerName: user?.name || 'Balasaheb Patil Farm',
      buyerId: 'buyer-202',
      buyerName: 'Gramin Agro Wholesale',
      buyerPhone: '+91 94220 99887',
      deliveryAddress: 'Gultekdi Market Yard, Pune, MH',
      deliveryType: 'farm_pickup',
      quantityKg: 800,
      pricePerKg: 26,
      totalAmount: 20800,
      orderDate: '2026-09-17',
      status: 'dispatched'
    }
  ];

  useEffect(() => {
    // Check if new user requested onboarding or profile is incomplete
    const params = new URLSearchParams(window.location.search);
    if (params.get('onboard') === 'true' || (user && !user.profileCompleted)) {
      setShowOnboarding(true);
    }

    fetchJobs();
    fetchApplications();
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchJobs = async () => {
    try {
      const q = query(collection(db, 'jobs'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      if (data.length > 0) {
        setJobs(data);
        getAiSuggestion(data);
      } else {
        setJobs(defaultMockJobs);
        getAiSuggestion(defaultMockJobs);
      }
    } catch (e) {
      setJobs(defaultMockJobs);
      getAiSuggestion(defaultMockJobs);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;
    try {
      const field = user.role === 'laborer' ? 'laborerId' : 'farmerId';
      const q = query(collection(db, 'applications'), where(field, '==', user.id));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobApplication));
      if (data.length > 0) {
        setApplications(data);
      } else if (user.role === 'laborer') {
        setApplications([
          {
            id: 'app-sample-1',
            jobId: 'job-1',
            jobTitle: defaultMockJobs[0].title,
            jobLocation: defaultMockJobs[0].location,
            dailyWage: defaultMockJobs[0].pay,
            laborerId: user.id,
            laborerName: user.name,
            laborerPhone: user.phone,
            farmerId: defaultMockJobs[0].farmerId,
            farmerName: defaultMockJobs[0].farmerName,
            status: 'accepted',
            appliedAt: '2026-09-17'
          }
        ]);
      }
    } catch (e) {
      console.warn("Applications fallback:", e);
    }
  };

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmProduct));
      if (data.length > 0) {
        setProducts(data);
      } else {
        setProducts(defaultMockProducts);
      }
    } catch (e) {
      setProducts(defaultMockProducts);
    }
  };

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductOrder));
      if (data.length > 0) {
        setOrders(data);
      } else {
        setOrders(defaultMockOrders);
      }
    } catch (e) {
      setOrders(defaultMockOrders);
    }
  };

  const getAiSuggestion = async (availableJobs: Job[]) => {
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
        setAiSuggestion(
          user.role === 'farmer'
            ? "Tip: Sharbati Wheat harvesting is at its peak. Posting ₹750/day with transport included fills harvester crews 2x faster."
            : "Top Match: Sharbati Wheat Harvesting in Niphad (₹750/day, 14 km away) matches your skill profile with 98% compatibility!"
        );
      }
    } catch (e) {
      setAiSuggestion(
        user.role === 'farmer'
          ? "Tip: Sharbati Wheat harvesting is at its peak. Posting ₹750/day with transport included fills harvester crews 2x faster."
          : "Top Match: Sharbati Wheat Harvesting in Niphad (₹750/day, 14 km away) matches your skill profile with 98% compatibility!"
      );
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleApplyJob = async (job: Job) => {
    if (!user) return;
    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      jobLocation: job.location,
      dailyWage: job.pay,
      laborerId: user.id,
      laborerName: user.name,
      laborerPhone: user.phone,
      laborerSkills: user.skills || 'Harvesting, Tractor, Sowing',
      laborerExperience: user.experience || '3 years',
      farmerId: job.farmerId,
      farmerName: job.farmerName,
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0]
    };

    try {
      await addDoc(collection(db, 'applications'), newApp);
    } catch (err) {
      console.warn("App write fallback:", err);
    }

    setApplications(prev => [newApp, ...prev]);
    showToast(`Application submitted for ${job.title}! Farmer notified.`);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPostingJob(true);

    const areaCoords: Record<string, { lat: number; lng: number }> = {
      'Nashik': { lat: 20.0833, lng: 74.1167 },
      'Pune': { lat: 18.5204, lng: 73.8567 },
      'Baramati': { lat: 18.1517, lng: 74.5772 },
      'Latur': { lat: 18.4088, lng: 76.5604 },
      'Solapur': { lat: 17.6599, lng: 75.9064 }
    };

    const baseCoord = areaCoords[newJobArea] || { lat: 19.9975, lng: 73.7898 };

    const newJob: Job = {
      id: `job-${Date.now()}`,
      farmerId: user.id,
      farmerName: user.name,
      farmerPhone: user.phone || '+91 98220 11223',
      title: newJobTitle,
      category: newJobCategory,
      description: newJobDescription,
      pay: Number(newJobPay),
      wageType: 'daily',
      area: newJobArea,
      location: newJobLocation,
      lat: baseCoord.lat + (Math.random() - 0.5) * 0.05,
      lng: baseCoord.lng + (Math.random() - 0.5) * 0.05,
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      workersNeeded: Number(newJobWorkersNeeded),
      workersHired: 0,
      amenities: ['Chilled Drinking Water', 'Field Snacks Provided'],
      distanceKm: Math.round(10 + Math.random() * 20),
      status: 'open'
    };

    try {
      await addDoc(collection(db, 'jobs'), newJob);
    } catch (err) {
      console.warn("Job save fallback:", err);
    }

    setJobs(prev => [newJob, ...prev]);
    setPostingJob(false);
    setShowPostJobModal(false);
    setNewJobTitle('');
    setNewJobDescription('');
    showToast(`New harvest job "${newJob.title}" posted successfully in ${newJob.area}!`);
  };

  const handlePostProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPostingProduce(true);

    const price = Number(newProducePriceKg);
    const qty = Number(newProduceQtyKg);

    const imageMap: Record<string, string> = {
      'Wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
      'Bajra': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
      'Jowar': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=600',
      'Soybean': 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&q=80&w=600',
      'Cotton': 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&q=80&w=600',
      'Toor Dal': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&q=80&w=600',
      'Mustard': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
      'Onion': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600',
      'Other': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600'
    };

    const newProd: FarmProduct = {
      id: `prod-${Date.now()}`,
      farmerId: user.id,
      farmerName: user.name,
      farmerPhone: user.phone || '+91 98220 11223',
      name: `${newProduceVariety} ${newProduceCrop}`,
      cropType: newProduceCrop,
      category: newProduceCrop === 'Wheat' ? 'Cereals' : (newProduceCrop === 'Bajra' || newProduceCrop === 'Jowar' ? 'Millets' : 'Oilseeds'),
      variety: newProduceVariety,
      pricePerKg: price,
      pricePerQuintal: price * 100,
      quantityAvailableKg: qty,
      minOrderKg: 50,
      description: `Harvested directly from ${user.name}'s farm. Cleaned, machine-graded, moisture-controlled.`,
      location: newProduceLocation,
      mandiBenchmarkRate: Math.round(price * 95),
      imageUrl: imageMap[newProduceCrop] || imageMap['Wheat'],
      harvestDate: new Date().toISOString().split('T')[0],
      organicCertified: true,
      qualityGrade: 'A+',
      status: 'active'
    };

    try {
      await addDoc(collection(db, 'products'), newProd);
    } catch (err) {
      console.warn("Produce write fallback:", err);
    }

    setProducts(prev => [newProd, ...prev]);
    setPostingProduce(false);
    setShowSellProductModal(false);
    showToast(`Produce ${newProd.name} added to Sell Dashboard!`);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: ProductOrder['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showToast(`Order #${orderId} marked as ${newStatus}!`);
  };

  const handleUpdateApplicationStatus = (appId: string, newStatus: JobApplication['status']) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    showToast(`Applicant status updated to ${newStatus}!`);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const downloadWorkerDossier = () => {
    if (!user) return;
    exportProfileToPdf(user);
    showToast('Verified Gramonnati PDF Profile downloaded successfully!');
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-16 bg-[#fbfbfa] flex items-center justify-center px-4 text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#e6ebe7] shadow-xl max-w-md">
          <div className="h-14 w-14 rounded-2xl bg-[#eef5ee] text-[#244b2f] flex items-center justify-center mx-auto mb-4">
            <Sprout className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-serif text-[#183925] mb-2 font-bold">Access Farm Portal</h2>
          <p className="text-sm text-[#55695b] mb-6">Please sign in to access your customized role-based dashboard.</p>
          <a href="/login" className="inline-block bg-[#183925] text-white px-7 py-3 rounded-full font-bold text-sm hover:bg-[#122c1d] transition">
            Sign In / Quick Demo →
          </a>
        </div>
      </div>
    );
  }

  // Filter jobs by area
  const filteredJobs = jobs.filter(j => areaFilter === 'All' || j.area === areaFilter);
  const appliedJobIds = applications.map(a => a.jobId);
  const myLocation: [number, number] = [18.5204, 73.8567]; // Base coords

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-to-br from-[#fdfbf7] via-[#f4f8f2] to-[#fefcf3] text-[#143d24] relative overflow-hidden">
      
      {/* Animated Glowing Rural Backdrops */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
      <div className="absolute top-1/2 left-5 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none animate-float-slow"></div>

      {/* Onboarding Modal (Opens when user first logs in or explicitly triggers it) */}
      <OnboardingModal 
        user={user}
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(updatedUser) => {
          setUser(updatedUser);
          setShowOnboarding(false);
          showToast(`Profile updated! Welcome ${updatedUser.name} (${updatedUser.role})`);
        }}
      />

      {/* In-Site GPS Destination Navigator Modal (Works fully inside site) */}
      <DestinationMapModal
        job={activeDestinationJob}
        isOpen={!!activeDestinationJob}
        onClose={() => setActiveDestinationJob(null)}
        userLocation={myLocation}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Email Verification Alert Banner (Shows when email is not verified yet) */}
        {!user.emailVerified && !verificationDismissed && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 via-amber-50/90 to-emerald-50/50 border border-amber-300 p-4 sm:p-5 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-amber-950 font-serif">
                    Email Verification Required / Pending
                  </h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-[#4b6051] mt-0.5 max-w-2xl leading-relaxed">
                  A verification link was dispatched to <strong>{user.email}</strong>. Verifying your email authenticates your account and grants you the official <strong>Gramonnati Verified Member</strong> badge for priority farm labor matching and direct Mandi trade.
                </p>
                {verificationBannerMsg && (
                  <div className={`mt-2 text-xs font-semibold p-2 rounded-xl border flex items-center gap-1.5 ${
                    verificationBannerMsg.type === 'success' 
                      ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300' 
                      : 'bg-amber-100/90 text-amber-950 border-amber-300'
                  }`}>
                    {verificationBannerMsg.type === 'success' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-800 shrink-0" />
                    )}
                    <span>{verificationBannerMsg.text}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
              <button
                type="button"
                onClick={handleCheckEmailVerified}
                disabled={checkingVerification}
                className="inline-flex items-center gap-1.5 bg-[#14532d] hover:bg-[#0f3d21] text-white px-4 py-2 rounded-full font-bold text-xs transition shadow-xs disabled:opacity-70"
              >
                {checkingVerification ? (
                  <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                )}
                <span>Check Status</span>
              </button>

              <button
                type="button"
                onClick={handleResendVerificationEmail}
                disabled={resendingVerification}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#f6faf6] text-amber-950 border border-amber-300 px-3.5 py-2 rounded-full font-bold text-xs transition shadow-xs disabled:opacity-70"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-amber-800 ${resendingVerification ? 'animate-spin' : ''}`} />
                <span>Resend Email</span>
              </button>

              <button
                type="button"
                onClick={() => setVerificationDismissed(true)}
                className="text-[#647466] hover:text-[#14532d] px-2 py-1 text-xs font-semibold"
                title="Dismiss banner"
              >
                ✕ Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Top Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-[#d8e5da] shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#15803d] mb-1.5">
              <RuralRiseLogo size="sm" showText={false} />
              <span>
                {user.role === 'farmer' && 'Gramonnati Farmer Operations & Harvest Hub'}
                {user.role === 'laborer' && 'Gramonnati Agricultural Workforce & Wage Portal'}
                {user.role === 'admin' && 'Gramonnati APMC Mandi Administration Portal'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#14532d] tracking-tight font-bold">
                Welcome back, {user.name}
              </h1>
              {user.emailVerified ? (
                <span 
                  className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-300 shadow-xs" 
                  title="Official Gramonnati Verified Member (Email & Identity Confirmed)"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Verified Member</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setVerificationDismissed(false)}
                  className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-300 shadow-xs transition"
                  title="Email verification pending. Click to verify."
                >
                  <Mail className="h-3.5 w-3.5 text-amber-700" />
                  <span>Verification Pending</span>
                </button>
              )}
            </div>
            <p className="text-[#496552] text-xs sm:text-sm mt-1">
              {user.location} • {user.role === 'farmer' && `${user.farmSize || '15.4'} Acres Land • Cultivating: ${user.crops || 'Wheat, Bajra, Jowar'}`}
              {user.role === 'laborer' && `Base Rate: ₹${user.expectedWage || '700'}/day • Skills: ${user.skills || 'Wheat/Bajra Harvesting, Tractor Handling'}`}
              {user.role === 'admin' && `${user.mandiDivision || 'Maharashtra State Agricultural Marketing Board'}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Profile / Role Switcher */}
            <button
              onClick={() => setShowOnboarding(true)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#eef5ee] text-[#14532d] border border-[#c6dec9] px-4 py-2 rounded-full font-bold text-xs transition shadow-xs hover:scale-[1.02]"
              title="Edit Profile Details, Bank & Skills"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#15803d]" />
              <span>Edit Full Profile & Bank DBT</span>
            </button>

            {/* Universal PDF Export Button */}
            <button
              onClick={() => {
                exportProfileToPdf(user);
                showToast('Verified Gramonnati PDF Profile downloaded successfully!');
              }}
              className="inline-flex items-center gap-1.5 bg-[#eaf4ec] hover:bg-[#d8edd9] text-[#14532d] border border-[#a3d4ad] px-4 py-2 rounded-full font-bold text-xs transition shadow-xs hover:scale-[1.02]"
              title="Download official Gramonnati profile credentials as PDF"
            >
              <Download className="h-3.5 w-3.5 text-[#15803d]" />
              <span>Download Profile (PDF)</span>
            </button>

            {user.role === 'farmer' && (
              <>
                <button
                  onClick={() => setShowPostJobModal(true)}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#14532d] to-[#16a34a] hover:brightness-110 text-white px-4 py-2 rounded-full font-bold text-xs transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 text-[#fde047]" />
                  <span>Post Harvest Job</span>
                </button>
                <button
                  onClick={() => setShowSellProductModal(true)}
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-full font-bold text-xs transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 text-white" />
                  <span>Sell Harvest Produce</span>
                </button>
              </>
            )}

            {user.role === 'laborer' && (
              <button
                onClick={downloadWorkerDossier}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#14532d] to-[#16a34a] hover:brightness-110 text-white px-4 py-2 rounded-full font-bold text-xs transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-[#fde047]" />
                <span>Worker Dossier ID</span>
              </button>
            )}

            <span className="bg-[#ecfdf5] text-[#14532d] border border-[#a7f3d0] px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[#15803d] animate-pulse"></span>
              {user.role} Active
            </span>
          </div>
        </header>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#14532d] text-sm font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-[#15803d] shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Bank DBT & Payment Settlement Overview Card */}
        <div className="mb-8 p-5 bg-gradient-to-r from-[#fffbeb] via-[#fef3c7]/60 to-[#fdfbf7] rounded-3xl border border-[#fde68a] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-inner">
              <CreditCard className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Direct Benefit Transfer (DBT) & Payment Account
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <BadgeCheck className="h-3 w-3 text-emerald-600" /> Verified Active
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1 text-xs text-[#78350f]">
                <span>Bank: <strong>{user.bankName || 'State Bank of India'}</strong></span>
                <span>A/C: <strong className="font-mono">{user.accountNumber ? `•••• •••• ${user.accountNumber.slice(-4)}` : '•••• •••• 9384'}</strong></span>
                <span>IFSC: <strong className="font-mono">{user.ifscCode || 'SBIN0001245'}</strong></span>
                <span>UPI ID: <strong className="font-mono">{user.upiId || 'kisan.rural@upi'}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowOnboarding(true)}
            className="self-start md:self-auto text-xs font-bold text-amber-800 hover:text-amber-900 bg-white/80 hover:bg-white border border-amber-300 px-4 py-2 rounded-xl transition shadow-xs shrink-0"
          >
            Update Bank Details →
          </button>
        </div>

        {/* Telemetry Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/95 backdrop-blur-sm p-5 rounded-2xl border border-[#d8e5da] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-[#55695b] font-medium block">Crop Health Score</span>
              <span className="text-2xl font-bold font-serif text-[#14532d]">82%</span>
              <span className="text-[11px] text-[#15803d] font-semibold block mt-0.5">Optimal vegetative state</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ecfdf5] text-[#15803d] flex items-center justify-center shadow-xs">
              <Leaf className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-5 rounded-2xl border border-[#d8e5da] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-[#55695b] font-medium block">Soil Moisture Level</span>
              <span className="text-2xl font-bold font-serif text-[#14532d]">68%</span>
              <span className="text-[11px] text-sky-700 font-semibold block mt-0.5">Drip automated</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
              <Droplets className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-5 rounded-2xl border border-[#d8e5da] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-[#55695b] font-medium block">Atmospheric Weather</span>
              <span className="text-2xl font-bold font-serif text-[#14532d]">27°C</span>
              <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">Dry humidity for harvest</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <CloudSun className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-5 rounded-2xl border border-[#d8e5da] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-[#55695b] font-medium block">Wheat APMC Rate</span>
              <span className="text-2xl font-bold font-serif text-[#14532d]">₹3,200</span>
              <span className="text-[11px] text-[#15803d] font-semibold block mt-0.5">+₹70/Q this week</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ecfdf5] text-[#15803d] flex items-center justify-center shadow-xs">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* AI Advisory */}
        {aiSuggestion && (
          <div className="bg-white border border-[#dce8de] rounded-3xl p-5 mb-8 shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#183925] text-[#8CC63F] flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-[#183925] text-sm">AgriConnect Intelligent Advisory</h3>
                <span className="text-[10px] bg-[#eef5ee] text-[#2d6a4f] font-bold px-2 py-0.5 rounded-full">
                  AI Real-Time
                </span>
              </div>
              <p className="text-[#55695b] text-xs sm:text-sm leading-relaxed">
                {aiSuggestion}
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#e6ebe7] pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'jobs' 
                ? 'bg-[#183925] text-white shadow-sm' 
                : 'bg-white text-[#55695b] hover:bg-gray-100 border border-[#d8e0d9]'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>{user.role === 'farmer' ? 'Job Postings & Applicants' : 'Available Harvest Jobs & GPS'}</span>
          </button>

          {(user.role === 'farmer' || user.role === 'admin') && (
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'products' 
                  ? 'bg-[#183925] text-white shadow-sm' 
                  : 'bg-white text-[#55695b] hover:bg-gray-100 border border-[#d8e0d9]'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Produce Sales & Orders ({products.length} Active)</span>
            </button>
          )}

          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'admin' 
                  ? 'bg-[#183925] text-white shadow-sm' 
                  : 'bg-white text-[#55695b] hover:bg-gray-100 border border-[#d8e0d9]'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>APMC State Admin Oversight</span>
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: JOBS & WORKFORCE GPS ROUTING                          */}
        {/* ============================================================ */}
        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left: Job Listings & Applications Column */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* Filter Area Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e6ebe7]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#183925]">
                  <Filter className="h-3.5 w-3.5 text-[#2d6a4f]" />
                  <span>Area-Wise Filter:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Nashik', 'Pune', 'Baramati', 'Latur'].map(area => (
                    <button
                      key={area}
                      onClick={() => setAreaFilter(area)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        areaFilter === area
                          ? 'bg-[#2d6a4f] text-white'
                          : 'bg-[#f4f7f4] text-[#55695b] hover:bg-gray-200'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jobs List */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#e6ebe7] overflow-hidden">
                <div className="p-5 border-b border-[#e9eae5] bg-[#fcfdfc] flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-[#183925] flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-[#2d6a4f]" />
                      {user.role === 'farmer' ? 'Your Active Field Job Openings' : 'Verified Harvest Jobs with GPS'}
                    </h2>
                    <p className="text-[11px] text-[#55695b]">
                      Filtered by area: <strong className="text-[#183925]">{areaFilter}</strong>
                    </p>
                  </div>
                  {user.role === 'farmer' && (
                    <button
                      onClick={() => setShowPostJobModal(true)}
                      className="bg-[#183925] text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#122c1d] flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Post Work
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#f0f3f0]">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="p-5 hover:bg-[#fafbfa] transition">
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-base text-[#183925] flex items-center gap-2">
                            {job.title}
                            <span className="bg-[#eef5ee] text-[#244b2f] text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#d5e3d7]">
                              {job.category}
                            </span>
                          </h3>
                          <span className="text-xs text-[#55695b] block mt-0.5">
                            Posted by: <strong className="text-[#183925]">{job.farmerName}</strong> • {job.farmerPhone}
                          </span>
                        </div>
                        
                        {/* Daily Wage Badge */}
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#2d6a4f] flex items-center justify-end">
                            ₹{job.pay}
                            <span className="text-xs text-gray-500 font-normal"> / day</span>
                          </span>
                          <span className="text-[10px] text-gray-400 block uppercase font-semibold">
                            {job.workersNeeded - job.workersHired} slots open
                          </span>
                        </div>
                      </div>

                      <p className="text-[#55695b] text-xs leading-relaxed mb-3">
                        {job.description}
                      </p>

                      {/* Amenities & Distance Tag */}
                      <div className="flex flex-wrap gap-2 text-[11px] mb-3">
                        <span className="bg-[#f0f5f1] text-[#183925] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#2d6a4f]" /> {job.location} ({job.distanceKm || 15} km away)
                        </span>
                        <span className="bg-[#f0f5f1] text-[#183925] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#2d6a4f]" /> Starts {job.date}
                        </span>
                        {job.amenities?.map((am, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold">
                            ✓ {am}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#f0f4f1]">
                        {user.role === 'laborer' && (
                          <button 
                            onClick={() => handleApplyJob(job)}
                            disabled={appliedJobIds.includes(job.id)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                              appliedJobIds.includes(job.id) 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                                : 'bg-[#183925] text-white hover:bg-[#122c1d] hover:-translate-y-0.5'
                            }`}
                          >
                            {appliedJobIds.includes(job.id) ? '✓ Application Submitted' : '1-Click Apply for Job'}
                          </button>
                        )}

                        <button 
                          onClick={() => {
                            setSelectedJobMap(job);
                            setActiveDestinationJob(job);
                          }}
                          className="px-3.5 py-2 rounded-full text-xs font-bold border border-[#bbf7d0] bg-emerald-50 text-[#14532d] hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Navigation className="h-3.5 w-3.5 text-[#15803d]" />
                          <span>Open In-Site GPS Navigator</span>
                        </button>

                        <button 
                          onClick={() => {
                            setSelectedJobMap(job);
                            setActiveDestinationJob(job);
                          }}
                          className="px-3.5 py-2 rounded-full text-xs font-bold bg-[#f4f8f5] text-[#2d6a4f] hover:bg-[#e4ede6] transition flex items-center gap-1.5 border border-[#d2dfd4]"
                        >
                          <MapPin className="h-3 w-3 text-[#2d6a4f]" />
                          <span>Turn-by-Turn Route</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Applicant Pipeline (Farmer) or Submitted Applications (Laborer) */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#e6ebe7] overflow-hidden">
                <div className="p-5 border-b border-[#e9eae5] bg-[#fcfdfc]">
                  <h2 className="text-base font-bold text-[#183925] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#2d6a4f]" />
                    {user.role === 'farmer' ? 'Job Applicants Received' : 'Your Submitted Applications & Wage Status'}
                  </h2>
                </div>

                <div className="divide-y divide-[#f0f3f0] p-2">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 rounded-2xl hover:bg-[#fafbfa] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-[#183925] text-sm">{app.jobTitle}</h4>
                        <span className="text-xs text-[#55695b] block">
                          {user.role === 'farmer' ? (
                            <>Laborer: <strong className="text-[#183925]">{app.laborerName}</strong> • Phone: {app.laborerPhone}</>
                          ) : (
                            <>Farm Gate: {app.jobLocation} • Wage: ₹{app.dailyWage}/day</>
                          )}
                        </span>
                        {app.laborerSkills && (
                          <span className="text-[11px] text-[#2d6a4f] font-semibold block mt-0.5">
                            Skills: {app.laborerSkills} ({app.laborerExperience})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                          app.status === 'accepted' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.status}
                        </span>

                        {user.role === 'farmer' && app.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                              className="px-3 py-1 rounded-lg bg-[#183925] text-white text-xs font-bold hover:bg-[#122c1d]"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(app.id, 'declined')}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {applications.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      No applications recorded yet.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right: Live GPS Map & Direction Nav */}
            <div className="xl:col-span-5 space-y-6">
              
              <div className="bg-white rounded-3xl shadow-sm border border-[#e6ebe7] overflow-hidden sticky top-24">
                <div className="p-5 border-b border-[#e9eae5] bg-[#fcfdfc] flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-[#183925] flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#2d6a4f]" />
                      Interactive Field GPS Navigator
                    </h3>
                    <p className="text-[11px] text-[#55695b]">
                      Real-time farm coordinates with turn-by-turn routing
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    GPS Online
                  </span>
                </div>

                {/* Leaflet Map Stage */}
                <div className="h-80 w-full bg-gray-100 relative z-0">
                  <MapContainer 
                    center={selectedJobMap ? [selectedJobMap.lat, selectedJobMap.lng] : myLocation} 
                    zoom={selectedJobMap ? 10 : 8} 
                    scrollWheelZoom={false} 
                    className="h-full w-full"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {filteredJobs.map(job => (
                      <Marker key={job.id} position={[job.lat, job.lng]}>
                        <Popup>
                          <strong className="text-[#183925]">{job.title}</strong><br />
                          {job.location}<br />
                          <span className="text-emerald-700 font-bold">₹{job.pay}/day</span>
                        </Popup>
                      </Marker>
                    ))}

                    <Marker position={myLocation} icon={CustomGreenIcon}>
                      <Popup>
                        <strong>Your Base Location</strong><br />
                        Pune Agro Hub
                      </Popup>
                    </Marker>

                    {selectedJobMap && (
                      <Polyline 
                        positions={[myLocation, [selectedJobMap.lat, selectedJobMap.lng]]} 
                        color="#183925" 
                        weight={4}
                        dashArray="6, 6"
                        opacity={0.85}
                      />
                    )}
                  </MapContainer>
                </div>

                {/* Turn-by-Turn GPS Direction Box */}
                <div className="p-5 bg-white border-t border-[#e9eae5] space-y-3">
                  {selectedJobMap ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active Route Guidance</span>
                          <h4 className="font-bold text-[#183925] text-sm">{selectedJobMap.title}</h4>
                        </div>
                        <span className="text-xs font-bold text-[#2d6a4f] bg-[#eef5ee] px-2.5 py-1 rounded-full">
                          ~{selectedJobMap.distanceKm || 14} km away
                        </span>
                      </div>

                      {/* Direction step steps */}
                      <div className="p-3 bg-[#f7faf7] rounded-2xl border border-[#e2ece3] space-y-2 text-xs text-[#183925]">
                        <div className="flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-[#183925] text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Head north toward State Highway 10 / Mandi Bypass.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-[#183925] text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Turn right onto Niphad Agro Approach Road (signboard for {selectedJobMap.farmerName}).</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-[#2d6a4f] text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Arrive at Farm Gate #2. Check in with Supervisor at weighing bridge.</span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => setActiveDestinationJob(selectedJobMap)}
                          className="w-full bg-[#14532d] hover:bg-[#166534] text-white py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Navigation className="h-3.5 w-3.5 text-[#fde047]" />
                          <span>Launch Full In-Site GPS Destination Navigator</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-xs text-gray-500">
                      <Navigation className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                      Select "View GPS Route on Map" on any harvest job to view turn-by-turn navigation!
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PRODUCE SALES & ORDERS DASHBOARD (FOR FARMER)         */}
        {/* ============================================================ */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            
            {/* Produce Header Bar */}
            <div className="bg-white p-6 rounded-3xl border border-[#e6ebe7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f] block mb-1">
                  Farmer Produce Selling System
                </span>
                <h2 className="text-2xl font-serif text-[#183925] font-bold">
                  Your Harvest Stock & Incoming Orders
                </h2>
                <p className="text-xs text-[#55695b] mt-0.5">
                  Manage grains (Wheat, Bajra, Jowar), track active buyer orders, and confirm transporter dispatch.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowSellProductModal(true)}
                  className="bg-[#183925] hover:bg-[#122c1d] text-white px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4 text-[#8CC63F]" />
                  <span>List New Produce</span>
                </button>
              </div>
            </div>

            {/* Produce Inventory Grid */}
            <div>
              <h3 className="text-base font-bold text-[#183925] mb-4 flex items-center gap-2">
                <Package className="h-4 w-4 text-[#2d6a4f]" />
                Active Crop Inventory on Marketplace
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <div key={p.id} className="bg-white rounded-3xl overflow-hidden border border-[#e6ebe7] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="relative h-44 bg-gray-100">
                        <img 
                          src={p.imageUrl} 
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600';
                          }}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 bg-[#183925]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {p.cropType}
                        </span>
                        <span className="absolute bottom-3 right-3 bg-white/95 text-[#183925] text-xs font-bold px-2 py-0.5 rounded-md">
                          {p.quantityAvailableKg} kg left
                        </span>
                      </div>

                      <div className="p-5">
                        <h4 className="font-bold text-base text-[#183925] leading-snug mb-1">{p.name}</h4>
                        <span className="text-xs text-[#55695b] block mb-3">{p.variety} • {p.location}</span>

                        <div className="bg-[#f7faf7] p-3 rounded-2xl border border-[#e4eee5] flex justify-between items-center text-xs">
                          <div>
                            <span className="text-gray-500 block text-[10px]">Price per kg:</span>
                            <span className="text-base font-bold text-[#2d6a4f]">₹{p.pricePerKg}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-500 block text-[10px]">Per Quintal:</span>
                            <span className="font-bold font-mono text-[#183925]">₹{p.pricePerQuintal.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg font-semibold block text-center">
                        ✓ Listed on Mandi Marketplace
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incoming Orders Table */}
            <div className="bg-white rounded-3xl border border-[#e6ebe7] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#e9eae5] bg-[#fcfdfc]">
                <h3 className="text-base font-bold text-[#183925] flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#2d6a4f]" />
                  Incoming Orders from Grain Buyers & Mills
                </h3>
                <p className="text-xs text-[#55695b]">Real-time purchase commitments with delivery tracking</p>
              </div>

              <div className="divide-y divide-[#f0f3f0]">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#fafbfa]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-gray-500">#{ord.id}</span>
                        <h4 className="font-bold text-sm text-[#183925]">{ord.productName}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          ord.status === 'dispatched' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ord.status}
                        </span>
                      </div>

                      <div className="text-xs text-[#55695b] space-y-0.5">
                        <p>Buyer: <strong className="text-[#183925]">{ord.buyerName}</strong> ({ord.buyerPhone})</p>
                        <p>Destination: {ord.deliveryAddress} • {ord.deliveryType === 'farm_pickup' ? 'Farm-Gate Pickup' : 'Mandi Transport'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">{ord.quantityKg} kg ({ord.quantityKg / 100} Qtl)</span>
                        <span className="text-base font-bold text-[#2d6a4f] font-mono">
                          ₹{ord.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {ord.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'dispatched')}
                          className="bg-[#183925] hover:bg-[#122c1d] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <Truck className="h-3 w-3" />
                          <span>Dispatch Stock</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: ADMIN STATE AGRI OVERSIGHT (FOR APMC ADMINS)          */}
        {/* ============================================================ */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            
            <div className="bg-white p-6 rounded-3xl border border-[#e6ebe7] shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f] block mb-1">
                State Agricultural Marketing Board
              </span>
              <h2 className="text-2xl font-serif text-[#183925] font-bold">
                APMC Mandi Oversight & Market Intelligence
              </h2>
              <p className="text-xs text-[#55695b] mt-0.5">
                Centralized telemetry across 18 regional mandis in Maharashtra.
              </p>

              {/* Admin Stat Blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#e4eee5]">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Registered Farmers</span>
                  <span className="text-2xl font-bold font-serif text-[#183925]">2,480+</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#e4eee5]">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Active Laborers</span>
                  <span className="text-2xl font-bold font-serif text-[#183925]">6,120+</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#e4eee5]">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Total Produce Traded</span>
                  <span className="text-2xl font-bold font-serif text-[#2d6a4f]">₹1.84 Cr</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#e4eee5]">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Harvest Openings</span>
                  <span className="text-2xl font-bold font-serif text-[#183925]">84 Jobs</span>
                </div>
              </div>
            </div>

            {/* Regional Mandi Volumes */}
            <div className="bg-white rounded-3xl border border-[#e6ebe7] shadow-sm p-6">
              <h3 className="text-base font-bold text-[#183925] mb-4">
                Regional APMC Mandi Arrivals & MSP Benchmarks
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#e9eae5] text-[#55695b] font-semibold">
                      <th className="pb-3">Mandi Yard</th>
                      <th className="pb-3">Primary Produce</th>
                      <th className="pb-3">Today's Arrival</th>
                      <th className="pb-3">Current Rate</th>
                      <th className="pb-3">MSP Benchmark</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f4f1]">
                    <tr>
                      <td className="py-3 font-bold text-[#183925]">Nashik Mandi Yard</td>
                      <td>Sharbati Wheat & Red Onion</td>
                      <td>8,400 Quintals</td>
                      <td className="font-bold text-[#2d6a4f]">₹3,200 / Qtl</td>
                      <td>₹2,275 / Qtl</td>
                      <td><span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Active</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-[#183925]">Baramati APMC</td>
                      <td>Hybrid Bajra & Green Fodder</td>
                      <td>5,800 Quintals</td>
                      <td className="font-bold text-[#2d6a4f]">₹2,600 / Qtl</td>
                      <td>₹2,500 / Qtl</td>
                      <td><span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Active</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-[#183925]">Solapur APMC</td>
                      <td>Maldandi Jowar (White)</td>
                      <td>4,200 Quintals</td>
                      <td className="font-bold text-[#2d6a4f]">₹4,200 / Qtl</td>
                      <td>₹3,180 / Qtl</td>
                      <td><span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Active</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-[#183925]">Latur Mandi Board</td>
                      <td>Yellow Soybean & Toor Dal</td>
                      <td>12,500 Quintals</td>
                      <td className="font-bold text-[#2d6a4f]">₹4,800 / Qtl</td>
                      <td>₹4,600 / Qtl</td>
                      <td><span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL: POST HARVEST WORK (AREA-WISE JOB POSTING) */}
      <AnimatePresence>
        {showPostJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#d8e5da] my-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowPostJobModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d6a4f]">
                  Farmer Job Posting System
                </span>
                <h3 className="text-2xl font-serif text-[#183925] font-bold mt-1">
                  Post New Harvest Work
                </h3>
                <p className="text-xs text-[#55695b] mt-0.5">
                  Specify area, daily wages (₹), and workers needed with GPS coordinates.
                </p>
              </div>

              <form onSubmit={handlePostJob} className="space-y-4">
                
                <div>
                  <label className="block text-[11px] font-bold text-[#183925] mb-1">Job Title</label>
                  <input 
                    type="text"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="e.g. Wheat Harvesting & Bundling Crew"
                    className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Area / District</label>
                    <select
                      value={newJobArea}
                      onChange={(e) => setNewJobArea(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    >
                      <option value="Nashik">Nashik</option>
                      <option value="Pune">Pune</option>
                      <option value="Baramati">Baramati</option>
                      <option value="Latur">Latur</option>
                      <option value="Solapur">Solapur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Category</label>
                    <select
                      value={newJobCategory}
                      onChange={(e) => setNewJobCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    >
                      <option value="Harvesting">Harvesting</option>
                      <option value="Machinery">Machinery / Tractor</option>
                      <option value="Sowing">Sowing / Planting</option>
                      <option value="Irrigation">Drip / Irrigation</option>
                      <option value="Spraying">Pest Care & Spraying</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Daily Wage (₹/day)</label>
                    <input 
                      type="number"
                      value={newJobPay}
                      onChange={(e) => setNewJobPay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Workers Needed</label>
                    <input 
                      type="number"
                      value={newJobWorkersNeeded}
                      onChange={(e) => setNewJobWorkersNeeded(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#183925] mb-1">Exact Field Location / Landmark</label>
                  <input 
                    type="text"
                    value={newJobLocation}
                    onChange={(e) => setNewJobLocation(e.target.value)}
                    placeholder="e.g. Niphad, Nashik (Near Godavari Canal Gate 3)"
                    className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#183925] mb-1">Job Details & Requirements</label>
                  <textarea 
                    value={newJobDescription}
                    onChange={(e) => setNewJobDescription(e.target.value)}
                    placeholder="Describe crop condition, expected start hours, food/tea amenities provided..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={postingJob}
                    className="w-full bg-[#183925] hover:bg-[#122c1d] text-white py-3 rounded-full text-xs font-bold transition shadow-sm"
                  >
                    {postingJob ? 'Publishing...' : 'Publish Job with GPS Location'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SELL FARM PRODUCE */}
      <AnimatePresence>
        {showSellProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#d8e5da] my-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowSellProductModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d6a4f]">
                  Produce Sell Dashboard
                </span>
                <h3 className="text-2xl font-serif text-[#183925] font-bold mt-1">
                  List Harvested Grains
                </h3>
                <p className="text-xs text-[#55695b] mt-0.5">
                  Direct sale to mills, traders, and mandi buyers.
                </p>
              </div>

              <form onSubmit={handlePostProduce} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Crop Type</label>
                    <select
                      value={newProduceCrop}
                      onChange={(e) => {
                        const c = e.target.value as any;
                        setNewProduceCrop(c);
                        if (c === 'Wheat') {
                          setNewProduceVariety('Sharbati Gold');
                          setNewProducePriceKg('32');
                        } else if (c === 'Bajra') {
                          setNewProduceVariety('Desi Hybrid');
                          setNewProducePriceKg('26');
                        } else if (c === 'Jowar') {
                          setNewProduceVariety('Maldandi M-35-1');
                          setNewProducePriceKg('42');
                        } else if (c === 'Soybean') {
                          setNewProduceVariety('JS-335');
                          setNewProducePriceKg('48');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    >
                      <option value="Wheat">Wheat (Gahu)</option>
                      <option value="Bajra">Bajra (Pearl Millet)</option>
                      <option value="Jowar">Jowar (White Sorghum)</option>
                      <option value="Soybean">Yellow Soybean</option>
                      <option value="Cotton">Cotton (Kapas)</option>
                      <option value="Toor Dal">Toor Dal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Crop Variety</label>
                    <input 
                      type="text"
                      value={newProduceVariety}
                      onChange={(e) => setNewProduceVariety(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Price (₹/kg)</label>
                    <input 
                      type="number"
                      value={newProducePriceKg}
                      onChange={(e) => setNewProducePriceKg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Available Quantity (Kg)</label>
                    <input 
                      type="number"
                      value={newProduceQtyKg}
                      onChange={(e) => setNewProduceQtyKg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#183925] mb-1">Farm / Mandi Yard Location</label>
                  <input 
                    type="text"
                    value={newProduceLocation}
                    onChange={(e) => setNewProduceLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={postingProduce}
                    className="w-full bg-[#183925] hover:bg-[#122c1d] text-white py-3 rounded-full text-xs font-bold transition shadow-sm"
                  >
                    {postingProduce ? 'Publishing...' : 'List Produce for Sale'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
