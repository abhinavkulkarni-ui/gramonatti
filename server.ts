import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Mock Database ---
let users = [
  { id: '1', name: 'Ravi Kumar', role: 'laborer', phone: '9876543210', location: 'Pune, MH', skills: 'Tractor Driving, Harvesting', profileCompleted: true },
  { id: '2', name: 'Suresh Farm', role: 'farmer', phone: '8765432109', location: 'Nashik, MH', farmSize: '15', profileCompleted: true },
];

let jobs = [
  { id: '1', farmerId: '2', title: 'Wheat Harvesting', category: 'Harvesting', description: 'Need 5 workers for 3 days of wheat harvesting.', pay: 500, location: 'Nashik, MH', lat: 19.9975, lng: 73.7898, date: '2026-09-15', status: 'open' },
  { id: '2', farmerId: '2', title: 'Tractor Driving', category: 'Machinery', description: 'Need experienced tractor driver for plowing.', pay: 800, location: 'Nashik, MH', lat: 20.0, lng: 73.8, date: '2026-09-18', status: 'open' },
  { id: '3', farmerId: '2', title: 'Rice Planting', category: 'Planting', description: 'Require skilled labor for rice field planting.', pay: 450, location: 'Igatpuri, MH', lat: 19.6966, lng: 73.5540, date: '2026-10-01', status: 'open' },
];

let applications = [
  { id: '1', jobId: '1', laborerId: '1', status: 'pending' }
];

let products = [
  { id: '1', farmerId: '2', name: 'Wheat (Grade A)', pricePerKg: 30, quantityAvailable: 500, description: 'Freshly harvested wheat.' },
];

let marketTrends = [
  { month: 'Jan', wheat: 28, rice: 40, soy: 45 },
  { month: 'Feb', wheat: 29, rice: 42, soy: 44 },
  { month: 'Mar', wheat: 30, rice: 41, soy: 46 },
  { month: 'Apr', wheat: 32, rice: 43, soy: 48 },
  { month: 'May', wheat: 31, rice: 44, soy: 50 },
  { month: 'Jun', wheat: 29, rice: 45, soy: 49 },
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
  res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
  const job = { id: String(Date.now()), lat: 19.9975, lng: 73.7898, ...req.body, status: 'open' };
  jobs.push(job);
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
    filteredApps = filteredApps.filter(a => farmerJobIds.includes(a.jobId));
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
  const { jobId, laborerId } = req.body;
  if (applications.find(a => a.jobId === jobId && a.laborerId === laborerId)) {
    return res.status(400).json({ error: 'Already applied' });
  }
  const app = { id: String(Date.now()), jobId, laborerId, status: 'pending' };
  applications.push(app);
  res.json(app);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/market-trends', (req, res) => {
  res.json(marketTrends);
});

// Gemini AI Routes
app.post('/api/ai/job-match', async (req, res) => {
  try {
    const { userProfile, availableJobs } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ suggestion: "AI not available. Please check job board." });
    }

    const prompt = `
      You are an AI assistant for Gramonatti, a platform linking laborers with jobs.
      User Profile: ${JSON.stringify(userProfile)}
      Available Jobs: ${JSON.stringify(availableJobs)}
      
      Based on the user's profile and the available jobs, suggest the best matching job and explain why in a short paragraph (2-3 sentences).
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.json({ suggestion: response.text });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate AI suggestion' });
  }
});

app.post('/api/ai/market-insights', async (req, res) => {
  try {
    const { trends } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ insights: "AI insights unavailable." });
    }

    const prompt = `
      You are an agricultural market analyst for Gramonatti.
      Here are the recent price trends (per kg) for crops: ${JSON.stringify(trends)}
      
      Provide a brief (3-4 sentences) market insight and pricing advice for a farmer looking to sell wheat right now.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.json({ insights: response.text });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate AI insights' });
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
