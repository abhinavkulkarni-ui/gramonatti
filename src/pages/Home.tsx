import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Sprout, 
  Leaf, 
  Droplets, 
  ArrowRight, 
  TrendingUp, 
  Tractor, 
  ShieldCheck, 
  Users, 
  Calendar,
  CheckCircle2,
  CloudSun,
  Navigation,
  MapPin,
  Clock,
  IndianRupee,
  Award,
  Sparkles,
  Search,
  ShoppingCart
} from 'lucide-react';
import RuralRiseLogo from '../components/RuralRiseLogo';

export default function Home() {
  const [activeDistrict, setActiveDistrict] = useState<'Nashik' | 'Pune' | 'Baramati' | 'Latur'>('Nashik');

  const districtData = {
    Nashik: { temp: '26°C', humidity: '58%', soilMoisture: '72%', mandiArrival: '8,400 Qtl', topCrop: 'Sharbati Wheat & Grapes' },
    Pune: { temp: '28°C', humidity: '52%', soilMoisture: '65%', mandiArrival: '6,200 Qtl', topCrop: 'Sugarcane & Vegetables' },
    Baramati: { temp: '29°C', humidity: '48%', soilMoisture: '61%', mandiArrival: '5,800 Qtl', topCrop: 'Bajra & Dairy Forage' },
    Latur: { temp: '31°C', humidity: '44%', soilMoisture: '59%', mandiArrival: '12,500 Qtl', topCrop: 'Yellow Soybean & Toor Dal' }
  };

  const tickerRates = [
    { crop: 'Sharbati Gold Wheat', price: '₹3,200/Q', change: '+1.8%', up: true },
    { crop: 'Desi Hybrid Bajra', price: '₹2,600/Q', change: '+2.4%', up: true },
    { crop: 'Maldandi Jowar', price: '₹4,200/Q', change: '+0.9%', up: true },
    { crop: 'Yellow Soybean', price: '₹4,800/Q', change: '+3.1%', up: true },
    { crop: 'Organic BT Cotton', price: '₹7,400/Q', change: '+1.5%', up: true },
    { crop: 'Marathwada Toor Dal', price: '₹11,500/Q', change: '+2.8%', up: true },
    { crop: 'Nashik Red Onion', price: '₹2,200/Q', change: '-0.5%', up: false }
  ];

  const featuredProduce = [
    {
      id: 'prod-1',
      name: 'Certified Sharbati Gold Wheat',
      cropType: 'Wheat',
      priceKg: '₹32 / kg',
      priceQuintal: '₹3,200 / Qtl',
      grade: 'Grade A+ Organic',
      location: 'Niphad, Nashik',
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
      fallback: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600',
      badge: 'Bestseller'
    },
    {
      id: 'prod-2',
      name: 'Desi Hybrid Bajra (Pearl Millet)',
      cropType: 'Bajra',
      priceKg: '₹26 / kg',
      priceQuintal: '₹2,600 / Qtl',
      grade: 'High-Iron Nutri',
      location: 'Baramati, Pune',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600',
      fallback: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=600',
      badge: 'Mandi Verified'
    },
    {
      id: 'prod-3',
      name: 'Maldandi Jowar (White Sorghum)',
      cropType: 'Jowar',
      priceKg: '₹42 / kg',
      priceQuintal: '₹4,200 / Qtl',
      grade: 'GI Tagged Heritage',
      location: 'Solapur / Marathwada',
      image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=600',
      fallback: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600',
      badge: 'GI Special'
    },
    {
      id: 'prod-4',
      name: 'High-Protein Yellow Soybean',
      cropType: 'Soybean',
      priceKg: '₹48 / kg',
      priceQuintal: '₹4,800 / Qtl',
      grade: 'JS-335 Certified',
      location: 'Latur Agro Yard',
      image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&q=80&w=600',
      fallback: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&q=80&w=600',
      badge: 'High Demand'
    }
  ];

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-[#fdfbf7] via-[#f4f8f2] to-[#fefcf3] text-[#143d24] overflow-x-hidden pt-16 relative">
      
      {/* Rural Rise Atmospheric Glows */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-200/25 rounded-full blur-3xl pointer-events-none animate-float-slow"></div>
      <div className="absolute top-96 right-10 w-[450px] h-[450px] bg-amber-200/30 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>

      {/* 1. REAL-TIME APMC COMMODITY TICKER */}
      <div className="bg-[#122619] border-b border-[#24452f] text-xs py-2.5 px-4 overflow-hidden relative z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#8CC63F] font-bold shrink-0 uppercase tracking-wider text-[11px]">
            <span className="h-2 w-2 rounded-full bg-[#8CC63F] animate-pulse"></span>
            <span>Live APMC Mandi Rates:</span>
          </div>
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5 text-white/90">
            {tickerRates.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2 shrink-0 text-[11px] sm:text-xs">
                <span className="font-semibold text-white">{t.crop}</span>
                <span className="font-mono text-[#8CC63F] font-bold">{t.price}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${t.up ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                  {t.change}
                </span>
              </div>
            ))}
          </div>
          <Link to="/marketplace" className="shrink-0 hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-[#8CC63F] hover:underline">
            All Crops →
          </Link>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <section className="relative pt-10 pb-16 lg:pt-14 lg:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Eyebrow badge with RuralRise Logo */}
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-[#14532d] border border-[#bbf7d0] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
              <RuralRiseLogo size="sm" showText={false} />
              <span>Gramonnati • Rural Rise Initiative</span>
            </div>

            {/* Main Title with Serif Accent */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#14532d] tracking-tight leading-[1.15] font-bold">
              Empowering Farmers. <br />
              <span className="text-[#16a34a] italic font-normal">Connecting Labor & Mandis.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#496552] max-w-xl font-normal leading-relaxed">
              Gramonnati bridges rural farm owners with skilled agricultural labor through GPS navigation, direct crop selling (Wheat, Bajra, Jowar), and transparent APMC mandi pricing with zero middleman fees.
            </p>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#14532d] to-[#16a34a] hover:brightness-110 text-white px-7 py-3.5 rounded-full font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                <span>Get Started / Instant Login</span>
                <ArrowRight className="h-4 w-4 text-[#fde047]" />
              </Link>
              
              <Link 
                to="/marketplace"
                className="inline-flex items-center gap-2 bg-white hover:bg-[#ecfdf5] text-[#14532d] border border-[#a7f3d0] px-6 py-3.5 rounded-full font-bold text-sm sm:text-base transition shadow-xs hover:-translate-y-0.5"
              >
                <ShoppingCart className="h-4 w-4 text-[#16a34a]" />
                <span>Buy Farm Produce</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-[#55695b] font-medium border-t border-[#e2eae4]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2d6a4f] shrink-0" />
                <span>GPS Labor Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-[#2d6a4f] shrink-0" />
                <span>Daily Wages ₹600 - ₹950</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#2d6a4f] shrink-0" />
                <span>Grade A+ Grains</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Visual: Vibrant Farming Photo with Telemetry Overlay */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#183925]/20 border-4 border-white aspect-[4/5] bg-[#1a3826]">
              <img 
                src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=1200" 
                alt="Indian farmer in golden wheat field with smart agritech tools"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200';
                }}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#183925]/75 via-black/20 to-transparent"></div>
              
              {/* Floating Top Badge */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-md flex items-center gap-2 text-xs font-bold text-[#183925]">
                <div className="h-2 w-2 rounded-full bg-[#8CC63F] animate-ping"></div>
                <span>AgriConnect Live Platform</span>
              </div>

              {/* Floating HUD Telemetry Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/80"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">Telemetry Sensor Active</span>
                    <h4 className="font-bold text-xs text-[#183925]">Nashik Rural Agri Belt</h4>
                  </div>
                  <span className="bg-[#eef5ee] text-[#2d6a4f] text-[11px] font-bold px-2 py-0.5 rounded-full">
                    78% Optimal
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#f5f9f6] p-2 rounded-xl border border-[#dce8de]">
                    <Droplets className="h-3.5 w-3.5 text-sky-600 mx-auto mb-0.5" />
                    <span className="text-[9px] text-gray-500 block">Moisture</span>
                    <span className="font-bold text-[#183925]">68%</span>
                  </div>
                  <div className="bg-[#f5f9f6] p-2 rounded-xl border border-[#dce8de]">
                    <CloudSun className="h-3.5 w-3.5 text-amber-600 mx-auto mb-0.5" />
                    <span className="text-[9px] text-gray-500 block">Weather</span>
                    <span className="font-bold text-[#183925]">27°C Sunny</span>
                  </div>
                  <div className="bg-[#f5f9f6] p-2 rounded-xl border border-[#dce8de]">
                    <Tractor className="h-3.5 w-3.5 text-[#2d6a4f] mx-auto mb-0.5" />
                    <span className="text-[9px] text-gray-500 block">Labor Jobs</span>
                    <span className="font-bold text-[#2d6a4f]">14 Active</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. THREE-ROLE PORTAL SELECTOR: FARMER, LABOURER, ADMIN */}
      <section className="py-12 bg-white border-y border-[#e6ebe7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f] block mb-1">
              Complete Ecosystem
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#183925]">
              Tailored Hub for Every Agricultural Partner
            </h2>
            <p className="text-sm text-[#55695b] mt-1">
              Select your role to access specialized area-wise tools, job postings, GPS routing, or mandi admin analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Role 1: Farmer / Job Provider */}
            <div className="bg-[#fbfdfb] rounded-3xl p-6 border border-[#d8e5da] hover:border-[#2d6a4f] transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#183925] text-[#8CC63F] flex items-center justify-center mb-4 shadow-sm">
                  <Sprout className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d6a4f]">For Farm Owners</span>
                <h3 className="text-xl font-serif text-[#183925] font-bold mt-1 mb-2">Farmer & Producer Portal</h3>
                <p className="text-xs sm:text-sm text-[#55695b] leading-relaxed mb-4">
                  Post harvest jobs area-wise, manage applicant profiles, list grains (Wheat, Bajra, Jowar) for direct sale, and monitor sensor telemetry.
                </p>
                <ul className="space-y-2 text-xs text-[#183925] mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f]" /> Area-wise Job Posting System
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f]" /> Harvest Produce Selling Dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f]" /> Gemini AI Crop Health Doctor
                  </li>
                </ul>
              </div>
              <Link 
                to="/dashboard"
                className="w-full text-center bg-[#183925] hover:bg-[#122c1d] text-white py-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Enter Farmer Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#8CC63F]" />
              </Link>
            </div>

            {/* Role 2: Agricultural Worker / Laborer */}
            <div className="bg-[#fbfdfb] rounded-3xl p-6 border border-[#d8e5da] hover:border-[#2d6a4f] transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#2d6a4f] text-white flex items-center justify-center mb-4 shadow-sm">
                  <Tractor className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d6a4f]">For Skilled Laborers</span>
                <h3 className="text-xl font-serif text-[#183925] font-bold mt-1 mb-2">Agricultural Worker Hub</h3>
                <p className="text-xs sm:text-sm text-[#55695b] leading-relaxed mb-4">
                  Find jobs by daily wages (₹500 - ₹950/day), calculate travel distance, get turn-by-turn GPS directions with Google Maps, and track earnings.
                </p>
                <ul className="space-y-2 text-xs text-[#183925] mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f]" /> Turn-by-Turn GPS Directions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f]" /> 1-Click Job Application & Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f]" /> Download Worker Skill Dossier
                  </li>
                </ul>
              </div>
              <Link 
                to="/dashboard"
                className="w-full text-center bg-[#2d6a4f] hover:bg-[#204e39] text-white py-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Find Jobs & GPS Routes</span>
                <Navigation className="h-3.5 w-3.5 text-[#8CC63F]" />
              </Link>
            </div>

            {/* Role 3: APMC Admin & Market Overseer */}
            <div className="bg-[#fbfdfb] rounded-3xl p-6 border border-[#d8e5da] hover:border-[#2d6a4f] transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#122619] text-[#8CC63F] flex items-center justify-center mb-4 shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d6a4f]">For Mandi Authorities</span>
                <h3 className="text-xl font-serif text-[#183925] font-bold mt-1 mb-2">APMC Mandi Admin Desk</h3>
                <p className="text-xs sm:text-sm text-[#55695b] leading-relaxed mb-4">
                  Oversee regional commodity volume, publish MSP benchmarks, review area-wise laborer employment rates, and verify transactions.
                </p>
                <ul className="space-y-2 text-xs text-[#183925] mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f]" /> State Agri Marketing Statistics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f]" /> Multi-District APMC Benchmarks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2d6a4f]" /> Verified Produce Verification
                  </li>
                </ul>
              </div>
              <Link 
                to="/dashboard"
                className="w-full text-center bg-[#122619] hover:bg-black text-white py-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Access Admin Analytics</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#8CC63F]" />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 4. FEATURED FARM PRODUCTS (WHEAT, BAJRA, JOWAR, SOYBEAN) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f] block mb-1">
              Direct From Farmers
            </span>
            <h2 className="text-3xl font-serif text-[#183925]">
              Featured Harvest Produce
            </h2>
            <p className="text-sm text-[#55695b] mt-1">
              Certified grains, pearl millets, and pulses ready for farm-gate dispatch or mandi delivery.
            </p>
          </div>
          <Link 
            to="/marketplace"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#183925] hover:text-[#2d6a4f] bg-white border border-[#d8e0d9] px-5 py-2.5 rounded-full shadow-sm hover:shadow"
          >
            <span>View Full Marketplace</span>
            <ArrowRight className="h-4 w-4 text-[#8CC63F]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProduce.map((p) => (
            <div 
              key={p.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#e6ebe7] shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Crop Photo with Fallback Handler */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img 
                    src={p.image} 
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = p.fallback;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-[#183925]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                    {p.badge}
                  </span>
                  <span className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-[#183925] text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                    {p.grade}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-[#55695b] mb-1">
                    <MapPin className="h-3.5 w-3.5 text-[#2d6a4f]" />
                    <span>{p.location}</span>
                  </div>
                  <h4 className="font-bold text-[#183925] text-base leading-snug mb-2 group-hover:text-[#2d6a4f] transition">
                    {p.name}
                  </h4>
                  <div className="flex items-baseline justify-between border-t border-[#f0f4f1] pt-3">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold block">Farm Gate Rate</span>
                      <span className="text-base font-bold text-[#2d6a4f]">{p.priceKg}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 font-mono">
                      {p.priceQuintal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-5 pt-0">
                <Link
                  to="/marketplace"
                  className="w-full bg-[#f4f8f5] hover:bg-[#183925] text-[#183925] hover:text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-[#dce8de]"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Buy / Order Now</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INTERACTIVE DISTRICT TELEMETRY & SOIL HUD */}
      <section className="py-16 bg-[#edf4ee] border-y border-[#d8e5da]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
                Precision Agriculture
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#183925]">
                Real-Time Regional Soil & Mandi Telemetry
              </h2>
              <p className="text-sm text-[#55695b] leading-relaxed">
                Connect your farm micro-climate with district-level mandi statistics. Switch districts to see live atmospheric readings and top commodities.
              </p>

              {/* District Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {(['Nashik', 'Pune', 'Baramati', 'Latur'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDistrict(d)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      activeDistrict === d 
                        ? 'bg-[#183925] text-white shadow-sm' 
                        : 'bg-white text-[#183925] border border-[#d8e0d9] hover:bg-gray-50'
                    }`}
                  >
                    {d} District
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Display Card */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#d2ded4]">
              <div className="flex items-center justify-between border-b border-[#e9eee9] pb-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider">Active Monitoring Station</span>
                  <h3 className="text-xl font-serif text-[#183925] font-bold">{activeDistrict} Agro-Climatic Zone</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping"></span>
                  Live Sensors Connected
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#e4eee5]">
                  <CloudSun className="h-5 w-5 text-amber-600 mb-2" />
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Air Temp</span>
                  <span className="text-lg font-bold text-[#183925]">{districtData[activeDistrict].temp}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#e4eee5]">
                  <Droplets className="h-5 w-5 text-sky-600 mb-2" />
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Soil Moisture</span>
                  <span className="text-lg font-bold text-[#183925]">{districtData[activeDistrict].soilMoisture}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#e4eee5]">
                  <TrendingUp className="h-5 w-5 text-[#2d6a4f] mb-2" />
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Mandi Inflow</span>
                  <span className="text-lg font-bold text-[#183925]">{districtData[activeDistrict].mandiArrival}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#e4eee5]">
                  <Sprout className="h-5 w-5 text-[#8CC63F] mb-2" />
                  <span className="text-[11px] text-gray-500 uppercase font-semibold block">Humidity</span>
                  <span className="text-lg font-bold text-[#183925]">{districtData[activeDistrict].humidity}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#eef5ee] border border-[#d8e5da] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#2d6a4f] font-bold uppercase tracking-wider block">Key District Crop</span>
                  <span className="text-sm font-bold text-[#183925]">{districtData[activeDistrict].topCrop}</span>
                </div>
                <Link
                  to="/marketplace"
                  className="bg-[#183925] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#122c1d] transition"
                >
                  View Market Trends
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 6. BOTTOM CTA BANNER */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-r from-[#14532d] to-[#15803d] rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden border border-emerald-600/30">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-3 relative z-10 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#fde047]">Join Gramonnati Rural Rise</span>
            <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              Ready to modernize your farm and expand your reach?
            </h3>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Create your profile today as a Farmer, Laborer, or Trader to unlock GPS job routing, direct crop sales, and live mandi intelligence.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[#fde047] hover:bg-amber-400 text-[#143d24] px-8 py-4 rounded-full font-bold text-base transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-5 w-5 text-[#143d24]" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
