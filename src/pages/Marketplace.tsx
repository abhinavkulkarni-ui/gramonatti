import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Sparkles, 
  Plus, 
  Sprout, 
  Check, 
  Filter, 
  X, 
  MapPin, 
  Phone, 
  PhoneCall,
  MessageSquare,
  IndianRupee, 
  ShieldCheck, 
  Calendar, 
  Download, 
  Wheat, 
  CheckCircle2, 
  ArrowRight,
  FileText,
  ExternalLink,
  Droplet
} from 'lucide-react';
import { FarmProduct, ProductOrder, UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import RuralRiseLogo from '../components/RuralRiseLogo';

export default function Marketplace() {
  const userStr = localStorage.getItem('user');
  const user: UserProfile | null = userStr ? JSON.parse(userStr) : null;

  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // List Produce Modal state
  const [showListModal, setShowListModal] = useState(false);
  const [newCropType, setNewCropType] = useState<FarmProduct['cropType']>('Wheat');
  const [newCropVariety, setNewCropVariety] = useState('Sharbati Premium');
  const [newProductName, setNewProductName] = useState('Certified Sharbati Gold Wheat');
  const [newPricePerKg, setNewPricePerKg] = useState('32');
  const [newQuantityKg, setNewQuantityKg] = useState('1000');
  const [newGrade, setNewGrade] = useState<'A+' | 'A' | 'B'>('A+');
  const [newLocation, setNewLocation] = useState(user?.location || 'Nashik, Maharashtra');
  const [newDesc, setNewDesc] = useState('Golden grain harvested with organic protocol, moisture tested below 10%.');

  // Contact Farmer Modal state
  const [contactingProduct, setContactingProduct] = useState<FarmProduct | null>(null);

  // Buy Produce Modal state
  const [buyingProduct, setBuyingProduct] = useState<FarmProduct | null>(null);
  const [orderQuantityKg, setOrderQuantityKg] = useState<number>(100);
  const [deliveryType, setDeliveryType] = useState<'farm_pickup' | 'mandi_delivery'>('mandi_delivery');
  const [buyerName, setBuyerName] = useState(user?.name || 'Kisan Trader');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || '+91 98220 12345');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.location || 'Pune APMC Yard, Maharashtra');
  const [confirmedOrder, setConfirmedOrder] = useState<ProductOrder | null>(null);

  const [toastMessage, setToastMessage] = useState('');

  const defaultMockProducts: FarmProduct[] = [
    { 
      id: 'prod-1', 
      farmerId: 'farmer-1', 
      farmerName: 'Balasaheb Patil Farm',
      farmerPhone: '+91 98220 11223',
      name: 'Certified Sharbati Gold Wheat (Grade A+)', 
      category: 'Cereals',
      cropType: 'Wheat',
      variety: 'Sharbati Premium',
      pricePerKg: 32, 
      pricePerQuintal: 3200,
      quantityAvailableKg: 1200, 
      minOrderKg: 50,
      description: 'Sun-ripened, golden-amber Sharbati wheat grains grown with zero synthetic fertilizers. High protein (14.2%), low moisture (9.8%), ideal for premium rotis and artisanal bakeries.',
      location: 'Niphad, Nashik, Maharashtra',
      mandiBenchmarkRate: 2950,
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800',
      harvestDate: '2026-09-10',
      organicCertified: true,
      qualityGrade: 'A+',
      status: 'active'
    },
    { 
      id: 'prod-2', 
      farmerId: 'farmer-1', 
      farmerName: 'Balasaheb Patil Farm',
      farmerPhone: '+91 98220 11223',
      name: 'Desi Hybrid Bajra (Pearl Millet)', 
      category: 'Millets',
      cropType: 'Bajra',
      variety: 'Desi Dhanashakti',
      pricePerKg: 26, 
      pricePerQuintal: 2600,
      quantityAvailableKg: 2500, 
      minOrderKg: 100,
      description: 'High-iron, drought-resilient pearl millet cultivated in alluvial loamy soil. Cleaned, double-sieved, and moisture tested to 10.5%. Rich in calcium and dietary fiber.',
      location: 'Baramati, Pune Rural, Maharashtra',
      mandiBenchmarkRate: 2350,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
      harvestDate: '2026-09-12',
      organicCertified: true,
      qualityGrade: 'A+',
      status: 'active'
    },
    { 
      id: 'prod-3', 
      farmerId: 'farmer-2', 
      farmerName: 'Kaveri Organic Orchards',
      farmerPhone: '+91 94231 77889',
      name: 'Maldandi Jowar (White Sorghum Grain)', 
      category: 'Millets',
      cropType: 'Jowar',
      variety: 'M-35-1 (Maldandi Special)',
      pricePerKg: 42, 
      pricePerQuintal: 4200,
      quantityAvailableKg: 1800, 
      minOrderKg: 50,
      description: 'Celebrated Maharashtra Maldandi Jowar with gleaming pearl-white bold grains. Naturally gluten-free, ground into soft, sweet bhakris. Naturally pest-free crop.',
      location: 'Solapur / Marathwada, Maharashtra',
      mandiBenchmarkRate: 3800,
      imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=800',
      harvestDate: '2026-09-14',
      organicCertified: true,
      qualityGrade: 'A+',
      status: 'active'
    },
    { 
      id: 'prod-4', 
      farmerId: 'farmer-3', 
      farmerName: 'Shetkari Samruddhi Trust',
      farmerPhone: '+91 91588 33441',
      name: 'High-Protein Yellow Soybean (JS-335)', 
      category: 'Oilseeds',
      cropType: 'Soybean',
      variety: 'JS-335 Certified Seed Line',
      pricePerKg: 48, 
      pricePerQuintal: 4800,
      quantityAvailableKg: 3500, 
      minOrderKg: 200,
      description: 'Certified non-GMO yellow soybeans with 40%+ protein content and 18.5% oil yield. Machine graded, dust-free, and ideal for processing and animal feed.',
      location: 'Latur APMC Yard, Maharashtra',
      mandiBenchmarkRate: 4620,
      imageUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&q=80&w=800',
      harvestDate: '2026-09-15',
      organicCertified: false,
      qualityGrade: 'A',
      status: 'active'
    },
    { 
      id: 'prod-5', 
      farmerId: 'farmer-4', 
      farmerName: 'Green Gold Cotton Producer Co',
      farmerPhone: '+91 98811 55667',
      name: 'Long-Staple Raw Cotton Bales (Organic)', 
      category: 'Cash Crops',
      cropType: 'Cotton',
      variety: 'Suvin / Shankar-6',
      pricePerKg: 74, 
      pricePerQuintal: 7400,
      quantityAvailableKg: 5000, 
      minOrderKg: 500,
      description: '30mm+ staple length white cotton, hand-picked with minimal trash (<2.5%). Moisture contained below 7.5%, pristine tensile strength for spinning mills.',
      location: 'Jalna / Aurangabad Mandi, Maharashtra',
      mandiBenchmarkRate: 7150,
      imageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&q=80&w=800',
      harvestDate: '2026-09-08',
      organicCertified: true,
      qualityGrade: 'A+',
      status: 'active'
    },
    { 
      id: 'prod-6', 
      farmerId: 'farmer-1', 
      farmerName: 'Balasaheb Patil Farm',
      farmerPhone: '+91 98220 11223',
      name: 'Unpolished Marathwada Toor Dal (Pigeon Pea)', 
      category: 'Pulses',
      cropType: 'Toor Dal',
      variety: 'BSMR-736 (Red Gram)',
      pricePerKg: 115, 
      pricePerQuintal: 11500,
      quantityAvailableKg: 900, 
      minOrderKg: 25,
      description: 'Unpolished, chemical-free red gram split dal dried in traditional rural sun-yards. Highest natural nutritive protein retention, authentic desi aroma.',
      location: 'Latur, Maharashtra',
      mandiBenchmarkRate: 10800,
      imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&q=80&w=800',
      harvestDate: '2026-09-14',
      organicCertified: true,
      qualityGrade: 'A+',
      status: 'active'
    }
  ];

  const mockTrends = [
    { month: 'Apr', wheat: 28, bajra: 22, jowar: 36, soy: 42, cotton: 68 },
    { month: 'May', wheat: 29, bajra: 23, jowar: 38, soy: 44, cotton: 70 },
    { month: 'Jun', wheat: 30, bajra: 24, jowar: 39, soy: 45, cotton: 71 },
    { month: 'Jul', wheat: 31, bajra: 24, jowar: 40, soy: 46, cotton: 72 },
    { month: 'Aug', wheat: 31.5, bajra: 25, jowar: 41, soy: 47, cotton: 73 },
    { month: 'Sep', wheat: 32, bajra: 26, jowar: 42, soy: 48, cotton: 74 },
  ];

  useEffect(() => {
    fetchProducts();
    setTrends(mockTrends);
    getAiInsights(mockTrends);
  }, []);

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
      console.warn("Using default products dataset:", e);
      setProducts(defaultMockProducts);
    }
  };

  const getAiInsights = async (marketTrends: any[]) => {
    try {
      const res = await fetch('/api/ai/market-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trends: marketTrends })
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data.insights);
      } else {
        setAiInsights("Market Advisory: Sharbati Wheat and Maldandi Jowar are commanding a +8% price premium due to high urban mill demand. Pearl Millet (Bajra) rates are stable with MSP support.");
      }
    } catch (e) {
      setAiInsights("Market Advisory: Sharbati Wheat and Maldandi Jowar are commanding a +8% price premium due to high urban mill demand. Pearl Millet (Bajra) rates are stable with MSP support.");
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(newPricePerKg);
    const qtyNum = Number(newQuantityKg);

    const imageMap: Record<string, string> = {
      'Wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800',
      'Bajra': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
      'Jowar': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=800',
      'Soybean': 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&q=80&w=800',
      'Cotton': 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&q=80&w=800',
      'Toor Dal': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&q=80&w=800',
      'Mustard': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
      'Onion': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800',
      'Other': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800'
    };

    const categoryMap: Record<string, FarmProduct['category']> = {
      'Wheat': 'Cereals',
      'Bajra': 'Millets',
      'Jowar': 'Millets',
      'Soybean': 'Oilseeds',
      'Cotton': 'Cash Crops',
      'Toor Dal': 'Pulses',
      'Mustard': 'Oilseeds',
      'Onion': 'Vegetables',
      'Other': 'Cereals'
    };

    const newProduct: FarmProduct = {
      id: `prod-${Date.now()}`,
      farmerId: user?.id || 'farmer-1',
      farmerName: user?.name || 'Balasaheb Patil Farm',
      farmerPhone: user?.phone || '+91 98220 11223',
      name: newProductName,
      cropType: newCropType,
      category: categoryMap[newCropType] || 'Cereals',
      variety: newCropVariety,
      pricePerKg: priceNum,
      pricePerQuintal: priceNum * 100,
      quantityAvailableKg: qtyNum,
      minOrderKg: 50,
      description: newDesc,
      location: newLocation,
      mandiBenchmarkRate: Math.round(priceNum * 95),
      imageUrl: imageMap[newCropType] || imageMap['Wheat'],
      harvestDate: new Date().toISOString().split('T')[0],
      organicCertified: newGrade === 'A+',
      qualityGrade: newGrade,
      status: 'active'
    };

    // Save to Firestore
    try {
      await addDoc(collection(db, 'products'), newProduct);
    } catch (err) {
      console.warn("Firestore write fallback:", err);
    }

    setProducts(prev => [newProduct, ...prev]);
    setShowListModal(false);
    showToast(`Successfully listed ${newProductName} on AgriConnect Marketplace!`);
  };

  const handleOpenBuy = (product: FarmProduct) => {
    setBuyingProduct(product);
    setOrderQuantityKg(Math.min(product.minOrderKg || 100, product.quantityAvailableKg));
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyingProduct) return;

    const total = orderQuantityKg * buyingProduct.pricePerKg;
    const newOrder: ProductOrder = {
      id: `ord-${Date.now()}`,
      productId: buyingProduct.id,
      productName: buyingProduct.name,
      cropType: buyingProduct.cropType,
      farmerId: buyingProduct.farmerId,
      farmerName: buyingProduct.farmerName,
      buyerId: user?.id || `buyer-${Date.now()}`,
      buyerName: buyerName.trim() || 'Kisan Trader',
      buyerPhone: buyerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      deliveryType,
      quantityKg: orderQuantityKg,
      pricePerKg: buyingProduct.pricePerKg,
      totalAmount: total,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'confirmed'
    };

    // Save to Firestore
    try {
      await addDoc(collection(db, 'orders'), newOrder);
    } catch (err) {
      console.warn("Order save fallback:", err);
    }

    // Decrement available quantity locally
    setProducts(prev => prev.map(p => {
      if (p.id === buyingProduct.id) {
        const remaining = Math.max(0, p.quantityAvailableKg - orderQuantityKg);
        return {
          ...p,
          quantityAvailableKg: remaining,
          status: remaining === 0 ? 'sold_out' : 'active'
        };
      }
      return p;
    }));

    setConfirmedOrder(newOrder);
    setBuyingProduct(null);
    showToast(`Order #${newOrder.id} placed successfully for ₹${total.toLocaleString('en-IN')}!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' 
      || p.category === selectedCategory 
      || (selectedCategory === 'Millets' && (p.cropType === 'Bajra' || p.cropType === 'Jowar'))
      || (selectedCategory === 'Wheat' && p.cropType === 'Wheat');
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) 
      || p.cropType.toLowerCase().includes(searchQuery.toLowerCase())
      || p.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-to-br from-[#fdfbf7] via-[#f4f8f2] to-[#fefcf3] text-[#143d24] relative overflow-hidden">
      
      {/* Animated Glowing Rural Backdrops */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
      <div className="absolute top-1/2 left-5 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none animate-float-slow"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-[#d8e5da] shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#15803d] mb-1.5">
              <RuralRiseLogo size="sm" showText={false} />
              <span>Gramonnati Direct Agricultural Mandi & Exchange</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#14532d] tracking-tight font-bold">
              Farm Produce Trading & Mandi Benchmarks
            </h1>
            <p className="text-[#496552] text-xs sm:text-sm mt-1 max-w-2xl">
              Direct farm-gate buying and selling for Wheat, Bajra, Jowar, Soybean, Pulses, and Cash Crops. Contact farmers directly or place instant mandi orders with transparent pricing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowListModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#14532d] to-[#16a34a] hover:brightness-110 text-white px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 text-[#fde047]" />
              <span>Sell Harvest Produce</span>
            </button>
          </div>
        </header>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#eef5ee] border border-[#d2e5d5] text-[#183925] text-sm font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
            <Check className="h-5 w-5 text-[#2d6a4f] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 6-Month Price Trends & AI Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          {/* Price Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-[#e6ebe7]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <div>
                <h2 className="text-lg font-serif text-[#183925] flex items-center gap-2 font-bold">
                  <TrendingUp className="h-5 w-5 text-[#2d6a4f]" />
                  APMC Benchmark Price Trends (₹/kg)
                </h2>
                <p className="text-xs text-[#55695b]">Historical mandi movements for Wheat, Bajra, Jowar, and Soy</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#183925]"></span> Wheat</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#8CC63F]"></span> Bajra</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]"></span> Jowar</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Soy</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2ee" />
                  <XAxis dataKey="month" stroke="#8e9f93" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8e9f93" fontSize={11} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} unit="₹" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #d8e5da', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#183925' }}
                  />
                  <Line type="monotone" dataKey="wheat" name="Wheat" stroke="#183925" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="bajra" name="Bajra" stroke="#8CC63F" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="jowar" name="Jowar" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="soy" name="Soybean" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Market Advisory Box */}
          <div className="bg-[#183925] text-white rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#2d6a4f]/50 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8CC63F] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#8CC63F]" />
                  Gemini Agritech Advisory
                </span>
                <span className="text-[10px] bg-white/10 text-gray-200 px-2.5 py-0.5 rounded-full">
                  Real-time APMC Feed
                </span>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">
                  Market Timing & Pricing Advice
                </h3>
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-normal">
                  {aiInsights}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-300">
                  <span>Top Rising Crop:</span>
                  <span className="font-bold text-[#8CC63F]">Sharbati Wheat (+8%)</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>MSP Support Status:</span>
                  <span className="font-bold text-emerald-300">Active across 18 Mandis</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-4">
              <button
                type="button"
                onClick={() => getAiInsights(trends)}
                className="w-full bg-[#8CC63F] hover:bg-[#7cb337] text-[#122619] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Refresh AI Market Forecast</span>
              </button>
            </div>
          </div>

        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-[#e6ebe7]">
          
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            {['All', 'Wheat', 'Millets', 'Cereals', 'Oilseeds', 'Cash Crops', 'Pulses'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-[#183925] text-white shadow-sm' 
                    : 'bg-[#f4f7f4] text-[#55695b] hover:bg-gray-100'
                }`}
              >
                {cat === 'Millets' ? 'Millets (Bajra / Jowar)' : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search crop, variety, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 text-xs rounded-xl border border-[#d8e0d9] focus:border-[#244b2f] outline-none"
            />
          </div>

        </div>

        {/* Product Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#e6ebe7] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Product Image */}
                <div className="relative h-52 bg-gray-100 overflow-hidden">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Category & Grade Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-[#183925]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                      {product.cropType}
                    </span>
                    {product.organicCertified && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Organic
                      </span>
                    )}
                  </div>

                  <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-[#183925] text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    {product.variety}
                  </span>

                  <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-mono px-2 py-0.5 rounded-md">
                    {product.quantityAvailableKg} kg left
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs text-[#55695b] mb-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#2d6a4f]" /> {product.location}
                    </span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {product.qualityGrade}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#183925] leading-snug mb-2 group-hover:text-[#2d6a4f] transition">
                    {product.name}
                  </h3>

                  <p className="text-xs text-[#55695b] line-clamp-2 leading-relaxed mb-3">
                    {product.description}
                  </p>

                  {/* Quality & Lot Specs */}
                  <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] font-semibold text-[#14532d]">
                    <span className="bg-[#ecfdf5] border border-[#bbf7d0] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Droplet className="h-3 w-3 text-sky-600" /> {product.cropType === 'Wheat' ? '9.8% Moisture' : '10.5% Moisture'}
                    </span>
                    <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                      Min Order: {product.minOrderKg || 50} kg
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                      Grade {product.qualityGrade || 'A+'}
                    </span>
                  </div>

                  {/* Pricing Box */}
                  <div className="bg-[#f7faf7] p-3 rounded-2xl border border-[#e4eee5] space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-gray-500 font-medium">Farm Gate Price:</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-[#14532d]">₹{product.pricePerKg}</span>
                        <span className="text-xs text-gray-500 font-normal"> / kg</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-600 border-t border-[#e8f0e9] pt-1">
                      <span>Mandi Quintal Rate:</span>
                      <span className="font-mono font-bold text-[#14532d]">₹{product.pricePerQuintal.toLocaleString('en-IN')} / Qtl</span>
                    </div>
                  </div>

                  {/* Farmer Info & Location */}
                  <div className="mt-3 text-[11px] text-[#55695b] flex items-center justify-between">
                    <span>Producer: <strong className="text-[#14532d]">{product.farmerName}</strong></span>
                    <span className="text-gray-400">Harvest: {product.harvestDate}</span>
                  </div>
                </div>
              </div>

              {/* Dual Action Buttons: Contact Farmer + Buy Order */}
              <div className="p-5 pt-0 flex gap-2">
                <button
                  type="button"
                  onClick={() => setContactingProduct(product)}
                  className="flex-1 bg-white hover:bg-[#ecfdf5] text-[#14532d] border border-[#a7f3d0] py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs hover:border-[#15803d]"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-[#16a34a]" />
                  <span>Contact</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenBuy(product)}
                  disabled={product.quantityAvailableKg <= 0}
                  className="flex-1 bg-gradient-to-r from-[#14532d] to-[#16a34a] hover:brightness-110 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShoppingCart className="h-3.5 w-3.5 text-[#fde047]" />
                  <span>{product.quantityAvailableKg > 0 ? 'Buy Order' : 'Sold Out'}</span>
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Recent Purchase Confirmation Banner / Invoice Preview */}
        {confirmedOrder && (
          <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#2d6a4f] shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e6ebe7] gap-3">
              <div>
                <span className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" /> Order Confirmed & Stored
                </span>
                <h3 className="text-xl font-serif text-[#183925] font-bold mt-1">
                  Gramonnati Rural Rise Mandi Commodity Receipt #{confirmedOrder.id}
                </h3>
              </div>
              <button 
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 bg-[#f4f8f5] hover:bg-[#eaf3eb] text-[#183925] px-4 py-2 rounded-xl text-xs font-bold border border-[#d8e5da]"
              >
                <Download className="h-3.5 w-3.5 text-[#2d6a4f]" />
                <span>Print Invoice</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4 text-xs">
              <div>
                <span className="text-gray-500 block">Produce:</span>
                <strong className="text-[#183925]">{confirmedOrder.productName}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Quantity Ordered:</span>
                <strong className="text-[#183925]">{confirmedOrder.quantityKg} kg ({confirmedOrder.quantityKg / 100} Qtl)</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Total Amount:</span>
                <strong className="text-[#2d6a4f] text-sm">₹{confirmedOrder.totalAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Delivery Choice:</span>
                <strong className="text-[#183925]">{confirmedOrder.deliveryType === 'farm_pickup' ? 'Farm-Gate Pickup' : 'Mandi Transport'}</strong>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 bg-[#fbfdfb] p-3 rounded-xl border border-[#dce8de] flex items-center justify-between">
              <span>Farmer Contact: {confirmedOrder.farmerName} • Dispatching from {confirmedOrder.deliveryAddress}</span>
              <span className="font-bold text-[#2d6a4f]">Status: Payment & Transporter Scheduled</span>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: BUY PRODUCE CHECKOUT MODAL */}
      <AnimatePresence>
        {buyingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#d8e5da] my-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setBuyingProduct(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d6a4f]">
                  Gramonnati Rural Rise Direct Purchase
                </span>
                <h3 className="text-2xl font-serif text-[#183925] font-bold mt-1">
                  {buyingProduct.name}
                </h3>
                <p className="text-xs text-[#55695b] mt-0.5">
                  Sold by {buyingProduct.farmerName} • {buyingProduct.location}
                </p>
              </div>

              <form onSubmit={handleConfirmPurchase} className="space-y-4">
                
                {/* Quantity Selector */}
                <div className="p-4 bg-[#f8faf8] rounded-2xl border border-[#e0eae2]">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-[#183925]">
                      Select Purchase Quantity (Kg)
                    </label>
                    <span className="text-xs text-gray-500">
                      Max: {buyingProduct.quantityAvailableKg} kg
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      min={buyingProduct.minOrderKg || 25}
                      max={buyingProduct.quantityAvailableKg}
                      step="25"
                      value={orderQuantityKg}
                      onChange={(e) => setOrderQuantityKg(Number(e.target.value))}
                      className="w-32 px-3 py-2 bg-white rounded-xl border border-[#d8e0d9] text-sm font-bold outline-none text-[#183925]"
                      required
                    />
                    <span className="text-xs text-gray-500">
                      = {(orderQuantityKg / 100).toFixed(2)} Quintals
                    </span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex gap-2 mt-3">
                    {[50, 100, 250, 500, 1000].filter(q => q <= buyingProduct.quantityAvailableKg).map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setOrderQuantityKg(q)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          orderQuantityKg === q 
                            ? 'bg-[#183925] text-white border-[#183925]' 
                            : 'bg-white text-[#55695b] border-[#d8e0d9]'
                        }`}
                      >
                        {q} kg
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Option */}
                <div>
                  <label className="block text-xs font-bold text-[#183925] mb-2">
                    Logistics / Delivery Preference
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('mandi_delivery')}
                      className={`p-3 rounded-xl border text-left transition ${
                        deliveryType === 'mandi_delivery'
                          ? 'border-[#2d6a4f] bg-[#eef5ee] text-[#183925] font-bold'
                          : 'border-[#d8e0d9] bg-white text-gray-600'
                      }`}
                    >
                      <span>Mandi Transporter</span>
                      <span className="text-[10px] text-gray-500 block font-normal mt-0.5">Delivered to nearest APMC yard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('farm_pickup')}
                      className={`p-3 rounded-xl border text-left transition ${
                        deliveryType === 'farm_pickup'
                          ? 'border-[#2d6a4f] bg-[#eef5ee] text-[#183925] font-bold'
                          : 'border-[#d8e0d9] bg-white text-gray-600'
                      }`}
                    >
                      <span>Farm-Gate Pickup</span>
                      <span className="text-[10px] text-gray-500 block font-normal mt-0.5">Pick up directly from farmer</span>
                    </button>
                  </div>
                </div>

                {/* Buyer Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Buyer / Trader Name</label>
                    <input 
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Contact Phone</label>
                    <input 
                      type="text"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#183925] mb-1">Delivery / Warehouse Address</label>
                  <input 
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    required
                  />
                </div>

                {/* Live Total Cost Calculation */}
                <div className="p-4 bg-[#183925] text-white rounded-2xl space-y-1 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span>Base Price ({orderQuantityKg} kg × ₹{buyingProduct.pricePerKg}):</span>
                    <span className="font-mono font-bold">₹{(orderQuantityKg * buyingProduct.pricePerKg).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Mandi Cess & Weighment:</span>
                    <span className="text-[#8CC63F]">Waived (Gramonnati Partner)</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-white/20">
                    <span>Total Payable:</span>
                    <span className="text-[#8CC63F] font-mono">₹{(orderQuantityKg * buyingProduct.pricePerKg).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-[#8CC63F] hover:bg-[#7cb337] text-[#122619] py-3.5 rounded-full font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Purchase & Notify Farmer</span>
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CONTACT FARMER DETAILS MODAL (FOR BUYERS) */}
      <AnimatePresence>
        {contactingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#bbf7d0] my-8 relative overflow-hidden"
            >
              {/* Decorative accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#14532d] via-[#16a34a] to-[#ca8a04]"></div>

              <button 
                onClick={() => setContactingProduct(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#15803d] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[#15803d]" /> Verified Producer Contact
                </span>
                <h3 className="text-xl font-serif text-[#14532d] font-bold mt-2">
                  {contactingProduct.farmerName}
                </h3>
                <p className="text-xs text-[#496552] flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-[#15803d]" /> {contactingProduct.location}
                </p>
              </div>

              {/* Commodity Summary Card */}
              <div className="bg-[#f7faf7] p-3.5 rounded-2xl border border-[#dce8de] mb-5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#14532d]">{contactingProduct.name}</span>
                  <span className="font-mono font-bold text-emerald-800">₹{contactingProduct.pricePerKg}/kg</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#55695b]">
                  <span>Available Stock:</span>
                  <span className="font-bold">{contactingProduct.quantityAvailableKg} kg ({contactingProduct.quantityAvailableKg / 100} Qtl)</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#55695b]">
                  <span>APMC Benchmark:</span>
                  <span className="font-bold">₹{contactingProduct.pricePerQuintal.toLocaleString('en-IN')}/Qtl</span>
                </div>
              </div>

              {/* Instant Contact Action Buttons */}
              <div className="space-y-2.5 mb-5">
                <a
                  href={`tel:${contactingProduct.farmerPhone || '+919822011223'}`}
                  className="w-full bg-[#14532d] hover:bg-[#166534] text-white py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Phone className="h-4 w-4 text-[#fde047]" />
                  <span>Call Farmer Directly ({contactingProduct.farmerPhone || '+91 98220 11223'})</span>
                </a>

                <a
                  href={`https://wa.me/${(contactingProduct.farmerPhone || '+919822011223').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Namaste ${contactingProduct.farmerName}, I am interested in buying ${contactingProduct.name} (Grade ${contactingProduct.qualityGrade}) listed on Gramonnati Rural Rise at ₹${contactingProduct.pricePerKg}/kg. Please share availability for dispatch.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
              </div>

              {/* Farm Gate Dispatch Advice */}
              <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 text-[11px] text-amber-950 space-y-1">
                <strong className="block text-amber-900 font-bold">Gramonnati Buyer Guarantee:</strong>
                <p>
                  You can inspect the harvest at farm gate before payment. Weighment slip & moisture certificate will be provided at the local APMC yard upon loading.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[11px] text-gray-500">Ready to buy right away?</span>
                <button
                  type="button"
                  onClick={() => {
                    const prod = contactingProduct;
                    setContactingProduct(null);
                    handleOpenBuy(prod);
                  }}
                  className="text-xs font-bold text-[#14532d] hover:underline flex items-center gap-1"
                >
                  <ShoppingCart className="h-3.5 w-3.5 text-[#15803d]" />
                  <span>Proceed to Buy Order →</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: LIST HARVEST PRODUCE FOR SALE (FARMER SYSTEM) */}
      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#d8e5da] my-8 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowListModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d6a4f]">
                  Farmer Produce Selling System
                </span>
                <h3 className="text-2xl font-serif text-[#183925] font-bold mt-1">
                  List Harvest Crop for Sale
                </h3>
                <p className="text-xs text-[#55695b] mt-0.5">
                  Publish your grain stock to mandi buyers and mills across Maharashtra.
                </p>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Crop Type</label>
                    <select 
                      value={newCropType}
                      onChange={(e) => {
                        const ct = e.target.value as any;
                        setNewCropType(ct);
                        if (ct === 'Wheat') {
                          setNewProductName('Certified Sharbati Gold Wheat');
                          setNewCropVariety('Sharbati Premium');
                          setNewPricePerKg('32');
                        } else if (ct === 'Bajra') {
                          setNewProductName('Desi Hybrid Bajra (Pearl Millet)');
                          setNewCropVariety('Desi Dhanashakti');
                          setNewPricePerKg('26');
                        } else if (ct === 'Jowar') {
                          setNewProductName('Maldandi Jowar (White Sorghum)');
                          setNewCropVariety('M-35-1 Maldandi');
                          setNewPricePerKg('42');
                        } else if (ct === 'Soybean') {
                          setNewProductName('Yellow Soybean (JS-335)');
                          setNewCropVariety('JS-335 Certified');
                          setNewPricePerKg('48');
                        } else if (ct === 'Cotton') {
                          setNewProductName('Raw Cotton Bales (Suvin)');
                          setNewCropVariety('Suvin Long Staple');
                          setNewPricePerKg('74');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    >
                      <option value="Wheat">Wheat (Gahu)</option>
                      <option value="Bajra">Bajra (Pearl Millet)</option>
                      <option value="Jowar">Jowar (Sorghum)</option>
                      <option value="Soybean">Yellow Soybean</option>
                      <option value="Cotton">Cotton (Kapas)</option>
                      <option value="Toor Dal">Toor Dal (Pigeon Pea)</option>
                      <option value="Mustard">Mustard Seeds</option>
                      <option value="Onion">Onion (Kanda)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Crop Variety</label>
                    <input 
                      type="text"
                      value={newCropVariety}
                      onChange={(e) => setNewCropVariety(e.target.value)}
                      placeholder="e.g. Sharbati / Maldandi"
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#183925] mb-1">Listing Title</label>
                  <input 
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Price (₹/kg)</label>
                    <input 
                      type="number"
                      value={newPricePerKg}
                      onChange={(e) => setNewPricePerKg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs font-bold text-[#183925] outline-none focus:border-[#2d6a4f]"
                      required
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      = ₹{(Number(newPricePerKg || 0) * 100).toLocaleString('en-IN')}/Qtl
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Total Stock (Kg)</label>
                    <input 
                      type="number"
                      value={newQuantityKg}
                      onChange={(e) => setNewQuantityKg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs font-bold text-[#183925] outline-none focus:border-[#2d6a4f]"
                      required
                    />
                    <span className="text-[10px] text-[#2d6a4f] mt-1 block font-medium">
                      = {(Number(newQuantityKg || 0) / 100).toFixed(1)} Quintals
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#183925] mb-1">Grade</label>
                    <select 
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none bg-white"
                    >
                      <option value="A+">Grade A+ (Premium / Export)</option>
                      <option value="A">Grade A (Standard Mandi)</option>
                      <option value="B">Grade B (Commercial Mill)</option>
                    </select>
                  </div>
                </div>

                {/* Estimated Lot Valuation Badge */}
                <div className="p-3 bg-[#f2f7f3] rounded-2xl border border-[#d4e6d6] flex items-center justify-between text-xs">
                  <span className="text-[#2d6a4f] font-semibold">Total Estimated Lot Value:</span>
                  <span className="font-mono font-bold text-[#183925] text-sm">
                    ₹{(Number(newPricePerKg || 0) * Number(newQuantityKg || 0)).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#183925] mb-1">Farm / Mandi Location</label>
                  <input 
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Niphad, Nashik, Maharashtra"
                    className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#183925] mb-1">Crop Description & Moisture Spec</label>
                  <textarea 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-[#d8e0d9] text-xs outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#183925] hover:bg-[#122c1d] text-white py-3 rounded-full text-xs font-bold transition shadow-sm hover:shadow"
                  >
                    Publish Produce to Marketplace
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
