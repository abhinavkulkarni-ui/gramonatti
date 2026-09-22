import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function runGeminiGenerate(prompt: string, timeoutMs: number = 7000): Promise<string> {
  const client = getAiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // models/gemini-3.6-flash as recommended by the API error message, with gemini-3.8-flash as fallback
  const candidateModels = ['gemini-3.6-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const generatePromise = client.models.generateContent({
        model,
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Model ${model} request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] Model ${model} encountered an issue:`, err?.message || err);
    }
  }

  throw lastError || new Error('Failed to generate content with available Gemini models');
}

// --- Mock Database ---
interface UserRecord {
  id: string;
  name: string;
  role: 'farmer' | 'laborer' | 'admin';
  phone?: string;
  email?: string;
  location?: string;
  district?: string;
  skills?: string;
  experience?: string;
  age?: string;
  farmSize?: string;
  crops?: string;
  irrigationType?: string;
  expectedWage?: number;
  mandiDivision?: string;
  profileCompleted: boolean;
}

let users: UserRecord[] = [
  { 
    id: 'farmer-1', 
    name: 'Balasaheb Patil', 
    role: 'farmer', 
    phone: '+91 98220 11223', 
    location: 'Nashik, Maharashtra', 
    district: 'Nashik', 
    farmSize: '18.5', 
    crops: 'Wheat (Sharbati), Bajra, Soybean',
    irrigationType: 'Drip & Borewell',
    profileCompleted: true 
  },
  { 
    id: 'laborer-1', 
    name: 'Santosh Shinde', 
    role: 'laborer', 
    phone: '+91 97654 32109', 
    location: 'Pune Rural, Maharashtra', 
    district: 'Pune',
    skills: 'Tractor Driving, Wheat Harvesting, Drip Pipeline Installation', 
    experience: '6',
    expectedWage: 700,
    profileCompleted: true 
  },
  { 
    id: 'admin-1', 
    name: 'Dr. Ashok Deshmukh (APMC Director)', 
    role: 'admin', 
    phone: '+91 94220 99887', 
    location: 'Pune APMC Directorate', 
    mandiDivision: 'Maharashtra State Agri Marketing Board',
    profileCompleted: true 
  }
];

let jobs = [
  { 
    id: 'job-1', 
    farmerId: 'farmer-1', 
    farmerName: 'Balasaheb Patil Farm',
    farmerPhone: '+91 98220 11223',
    title: 'Wheat Harvesting & Bagging (Golden Sharbati)', 
    category: 'Harvesting', 
    description: 'Need 6 experienced laborers for Sharbati wheat harvesting, bundling, and bagging across 12 acres. Free tea, lunch, and sheltered resting area provided.', 
    pay: 700, 
    wageType: 'per_day',
    location: 'Niphad, Nashik, MH', 
    area: 'Nashik North',
    lat: 20.0760, 
    lng: 74.1089, 
    workersNeeded: 6,
    workersHired: 2,
    startDate: '2026-09-22', 
    durationDays: 4,
    amenities: { foodProvided: true, lodgingProvided: true, transportProvided: false },
    status: 'open' 
  },
  { 
    id: 'job-2', 
    farmerId: 'farmer-1', 
    farmerName: 'Vikas Sheti Farm',
    farmerPhone: '+91 98233 44556',
    title: 'Hydraulic Tractor Rotavator Plowing', 
    category: 'Machinery', 
    description: 'Require skilled tractor driver experienced with 45HP+ Mahindra/John Deere tractors for deep soil turning and bed preparation.', 
    pay: 950, 
    wageType: 'per_day',
    location: 'Baramati Agro Cluster, Pune, MH', 
    area: 'Baramati / Pune South',
    lat: 18.1517, 
    lng: 74.5772, 
    workersNeeded: 2,
    workersHired: 1,
    startDate: '2026-09-24', 
    durationDays: 3,
    amenities: { foodProvided: true, lodgingProvided: false, transportProvided: true },
    status: 'open' 
  },
  { 
    id: 'job-3', 
    farmerId: 'farmer-2', 
    farmerName: 'Kaveri Organic Orchards',
    farmerPhone: '+91 94231 77889',
    title: 'Drip Lateral Installation & Soil Moisture Testing', 
    category: 'Irrigation', 
    description: 'Laying 16mm inline drip lines with fertilizer venturi injectors across 8 acres of Bajra & Jowar crops.', 
    pay: 650, 
    wageType: 'per_day',
    location: 'Igatpuri Hills, Nashik, MH', 
    area: 'Igatpuri / Western Ghats',
    lat: 19.6966, 
    lng: 73.5540, 
    workersNeeded: 4,
    workersHired: 0,
    startDate: '2026-09-25', 
    durationDays: 2,
    amenities: { foodProvided: true, lodgingProvided: true, transportProvided: true },
    status: 'open' 
  },
  { 
    id: 'job-4', 
    farmerId: 'farmer-3', 
    farmerName: 'Shetkari Samruddhi Trust',
    farmerPhone: '+91 91588 33441',
    title: 'Jowar & Bajra Threshing & Grain Sorting', 
    category: 'Harvesting', 
    description: 'Manual stalk feeding into mechanical thresher and grade sorting of pearl millet and sorghum grains into standard 50kg gunny bags.', 
    pay: 600, 
    wageType: 'per_day',
    location: 'Latur Agro Market Zone, MH', 
    area: 'Marathwada / Latur',
    lat: 18.4088, 
    lng: 76.5604, 
    workersNeeded: 5,
    workersHired: 3,
    startDate: '2026-09-28', 
    durationDays: 5,
    amenities: { foodProvided: true, lodgingProvided: true, transportProvided: false },
    status: 'open' 
  },
  { 
    id: 'job-5', 
    farmerId: 'farmer-4', 
    farmerName: 'Green Gold Cotton Producer Co',
    farmerPhone: '+91 98811 55667',
    title: 'Organic Neem Spraying & Manual Weed Removal', 
    category: 'Plant Care', 
    description: 'Precision knapsack spraying of organic botanical bio-pesticides and manual weeding along ridge furrows.', 
    pay: 550, 
    wageType: 'per_day',
    location: 'Aurangabad Rural (Chhatrapati Sambhajinagar), MH', 
    area: 'Aurangabad Central',
    lat: 19.8762, 
    lng: 75.3433, 
    workersNeeded: 8,
    workersHired: 4,
    startDate: '2026-09-30', 
    durationDays: 3,
    amenities: { foodProvided: true, lodgingProvided: false, transportProvided: true },
    status: 'open' 
  }
];

let applications = [
  { 
    id: 'app-1', 
    jobId: 'job-1', 
    laborerId: 'laborer-1', 
    farmerId: 'farmer-1',
    status: 'accepted',
    appliedAt: '2026-09-18T08:30:00.000Z' 
  }
];

let products = [
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
    location: 'Solapur / Osmanabad Belt, Maharashtra',
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
    description: 'Certified non-GMO yellow soybeans with 40%+ protein content and 18.5% oil yield. Machine graded, dust-free, and ideal for soy milk, tofu, or wholesale oil extraction.',
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

let orders = [
  {
    id: 'ord-101',
    productId: 'prod-1',
    productName: 'Certified Sharbati Gold Wheat (Grade A+)',
    cropType: 'Wheat',
    farmerId: 'farmer-1',
    farmerName: 'Balasaheb Patil Farm',
    buyerId: 'buyer-201',
    buyerName: 'Govind Agrotech Mills',
    buyerPhone: '+91 98210 98765',
    deliveryAddress: 'GIDC Industrial Estate, Pune, Maharashtra',
    deliveryType: 'mandi_delivery',
    quantityKg: 200,
    pricePerKg: 32,
    totalAmount: 6400,
    orderDate: '2026-09-17',
    status: 'confirmed'
  }
];

let marketTrends = [
  { month: 'Apr', wheat: 28, bajra: 22, jowar: 36, soy: 42, cotton: 68 },
  { month: 'May', wheat: 29, bajra: 23, jowar: 38, soy: 44, cotton: 70 },
  { month: 'Jun', wheat: 30, bajra: 24, jowar: 39, soy: 45, cotton: 71 },
  { month: 'Jul', wheat: 31, bajra: 24, jowar: 40, soy: 46, cotton: 72 },
  { month: 'Aug', wheat: 31.5, bajra: 25, jowar: 41, soy: 47, cotton: 73 },
  { month: 'Sep', wheat: 32, bajra: 26, jowar: 42, soy: 48, cotton: 74 },
];

// --- API Routes ---
app.get('/api/auth/google/url', (req, res) => {
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

app.get('/auth/callback', (req, res) => {
  // Simulate token exchange for prototype
  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', payload: { name: 'Google User', email: 'google.user@example.com' } }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `);
});

app.post('/api/register', (req, res) => {
  const { phone, role, password } = req.body; // simulated registration
  let user = users.find(u => u.phone === phone);
  if (user) {
    return res.status(400).json({ error: 'User already exists' });
  }
  user = { id: String(Date.now()), name: 'New User', role, phone, location: 'Unknown', profileCompleted: false };
  users.push(user);
  res.json({ user });
});

app.post('/api/profile/update', (req, res) => {
  const { id, name, location, skills, experience, age, farmSize, crops } = req.body;
  let user = users.find(u => u.id === id);
  if (user) {
    user.name = name || user.name;
    user.location = location || user.location;
    if (skills !== undefined) user.skills = skills;
    if (experience !== undefined) user.experience = experience;
    if (age !== undefined) user.age = age;
    if (farmSize !== undefined) user.farmSize = farmSize;
    if (crops !== undefined) user.crops = crops;
    user.profileCompleted = true;
    res.json({ user });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/auth/phone', (req, res) => {
  const { phone, password, role } = req.body;
  let user = users.find(u => u.phone === phone);
  
  if (!user) {
    // Auto-register if not found
    user = { 
      id: String(Date.now()), 
      name: 'New User', 
      role, 
      phone, 
      location: 'Unknown', 
      profileCompleted: false 
    };
    users.push(user);
  } else if (user.role !== role) {
    // If they exist but selected a different role, maybe just update or warn
    // For simplicity, we just log them in and ignore the role they selected on login.
  }
  
  res.json({ user });
});

app.post('/api/auth/google/login', (req, res) => {
  const { email, name } = req.body;
  let user = users.find(u => u.email === email);
  if (!user) {
    user = { id: String(Date.now()), name, email, role: 'laborer', phone: 'Not provided', location: 'Unknown', profileCompleted: false };
    users.push(user);
  }
  res.json({ user });
});

app.get('/api/jobs', (req, res) => {
  const { area, category } = req.query;
  let filtered = jobs;
  if (area) {
    filtered = filtered.filter(j => j.location.toLowerCase().includes(String(area).toLowerCase()) || j.area.toLowerCase().includes(String(area).toLowerCase()));
  }
  if (category) {
    filtered = filtered.filter(j => j.category.toLowerCase() === String(category).toLowerCase());
  }
  res.json(filtered);
});

app.post('/api/jobs', (req, res) => {
  const job = { 
    id: `job-${Date.now()}`, 
    lat: req.body.lat || (19.9975 + (Math.random() - 0.5) * 0.1), 
    lng: req.body.lng || (73.7898 + (Math.random() - 0.5) * 0.1), 
    workersHired: 0,
    status: 'open',
    createdAt: new Date().toISOString(),
    ...req.body 
  };
  jobs.unshift(job);
  res.json(job);
});

app.get('/api/applications', (req, res) => {
  const { laborerId, farmerId } = req.query;
  let filteredApps = applications;
  if (laborerId) {
    filteredApps = filteredApps.filter(a => a.laborerId === laborerId);
  }
  if (farmerId) {
    const farmerJobIds = jobs.filter(j => j.farmerId === farmerId).map(j => j.id);
    filteredApps = filteredApps.filter(a => farmerJobIds.includes(a.jobId) || a.farmerId === farmerId);
  }
  
  // Enrich with job and user data
  const enriched = filteredApps.map(app => {
    const job = jobs.find(j => j.id === app.jobId);
    const user = users.find(u => u.id === app.laborerId);
    return { ...app, job, user };
  });
  
  res.json(enriched);
});

app.post('/api/apply', (req, res) => {
  const { jobId, laborerId, farmerId } = req.body;
  const existing = applications.find(a => a.jobId === jobId && a.laborerId === laborerId);
  if (existing) {
    return res.status(400).json({ error: 'Already applied for this job' });
  }
  const job = jobs.find(j => j.id === jobId);
  const newApp = { 
    id: `app-${Date.now()}`, 
    jobId, 
    laborerId, 
    farmerId: farmerId || (job ? job.farmerId : 'farmer-1'),
    status: 'pending',
    appliedAt: new Date().toISOString()
  };
  applications.unshift(newApp);
  res.json(newApp);
});

app.patch('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const appIndex = applications.findIndex(a => a.id === id);
  if (appIndex !== -1) {
    applications[appIndex].status = status;
    res.json(applications[appIndex]);
  } else {
    res.status(404).json({ error: 'Application not found' });
  }
});

app.get('/api/products', (req, res) => {
  const { cropType, category } = req.query;
  let filtered = products;
  if (cropType) {
    filtered = filtered.filter(p => p.cropType.toLowerCase() === String(cropType).toLowerCase());
  }
  if (category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }
  res.json(filtered);
});

app.post('/api/products', (req, res) => {
  const newProduct = {
    id: `prod-${Date.now()}`,
    status: 'active',
    harvestDate: new Date().toISOString().split('T')[0],
    organicCertified: true,
    qualityGrade: 'A+',
    ...req.body
  };
  products.unshift(newProduct);
  res.json(newProduct);
});

app.get('/api/orders', (req, res) => {
  const { farmerId, buyerId } = req.query;
  let filtered = orders;
  if (farmerId) {
    filtered = filtered.filter(o => o.farmerId === farmerId);
  }
  if (buyerId) {
    filtered = filtered.filter(o => o.buyerId === buyerId);
  }
  res.json(filtered);
});

app.post('/api/orders', (req, res) => {
  const order = {
    id: `ord-${Date.now()}`,
    orderDate: new Date().toISOString().split('T')[0],
    status: 'confirmed',
    ...req.body
  };
  orders.unshift(order);
  
  // Decrement quantity available
  const prod = products.find(p => p.id === order.productId);
  if (prod) {
    prod.quantityAvailableKg = Math.max(0, prod.quantityAvailableKg - (order.quantityKg || 0));
    if (prod.quantityAvailableKg === 0) {
      prod.status = 'sold_out';
    }
  }

  res.json(order);
});

app.get('/api/market-trends', (req, res) => {
  res.json(marketTrends);
});

app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalFarmers: users.filter(u => u.role === 'farmer').length + 2480,
    totalLaborers: users.filter(u => u.role === 'laborer').length + 6120,
    totalJobs: jobs.length + 84,
    totalProductsListed: products.length + 320,
    totalOrdersValueINR: orders.reduce((sum, o) => sum + o.totalAmount, 0) + 18450000,
    apmcDistricts: ['Nashik', 'Pune', 'Baramati', 'Latur', 'Solapur', 'Aurangabad']
  });
});

// Gemini AI Routes
app.post('/api/ai/job-match', async (req, res) => {
  const { userProfile, availableJobs } = req.body;
  
  const fallbackMatch = userProfile?.role === 'farmer'
    ? "Recommendation: Wheat harvest demand in Nashik & Pune is at peak season. Harvester crews with tractor attachments are operating at ₹750/day."
    : "Top Match: Sharbati Wheat Harvesting in Niphad (₹750/day, 14 km away) matches your skill profile and certifications with 98% compatibility!";

  if (!process.env.GEMINI_API_KEY) {
    return res.json({ suggestion: fallbackMatch });
  }

  try {
    const prompt = `
      You are an expert agrarian employment assistant for Gramonatti, an Indian rural labor and farmer portal.
      User Profile: ${JSON.stringify(userProfile)}
      Available Jobs: ${JSON.stringify(availableJobs)}
      
      Based on the user's profile and the available jobs, suggest the best matching job and explain why in a concise, encouraging paragraph (2-3 sentences). Include specific wage rate, crop type, and location compatibility.
    `;
    
    const text = await runGeminiGenerate(prompt);
    res.json({ suggestion: text });
  } catch (error) {
    console.error('AI Job Match Error:', error);
    res.json({ suggestion: fallbackMatch });
  }
});

app.post('/api/ai/market-insights', async (req, res) => {
  const { trends } = req.body;
  
  const fallbackInsight = "Market Advisory: Sharbati Wheat and Maldandi Jowar are commanding a +8% to +12% price premium due to high mill demand across Maharashtra APMC mandis. Pearl Millet (Bajra) rates remain solid above MSP.";

  if (!process.env.GEMINI_API_KEY) {
    return res.json({ insights: fallbackInsight });
  }

  try {
    const prompt = `
      You are an agricultural market analyst for Gramonatti APMC intelligence.
      Recent price trends (per kg) for crops: ${JSON.stringify(trends)}
      
      Provide a brief (3-4 sentences) market insight and pricing advice for a farmer looking to sell grain or millets right now. Mention MSP benchmarks, mandi arrival timing, and moisture testing advice.
    `;
    
    const text = await runGeminiGenerate(prompt);
    res.json({ insights: text });
  } catch (error) {
    console.error('AI Market Insights Error:', error);
    res.json({ insights: fallbackInsight });
  }
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
