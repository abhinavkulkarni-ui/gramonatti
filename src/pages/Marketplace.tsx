import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, ShoppingCart, Sparkles } from 'lucide-react';

export default function Marketplace() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [products, setProducts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));

    fetch('/api/market-trends')
      .then(res => res.json())
      .then(data => {
        setTrends(data);
        getAiInsights(data);
      });
  }, []);

  const getAiInsights = async (marketTrends: any[]) => {
    try {
      const res = await fetch('/api/ai/market-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trends: marketTrends })
      });
      const data = await res.json();
      setAiInsights(data.insights);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
            <p className="text-gray-600 mt-1">Buy and sell agricultural products directly.</p>
          </div>
          {user?.role === 'farmer' && (
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm">
              List Product
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Analytics Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Price Trends Analytics (₹/kg)
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <Line type="monotone" dataKey="wheat" stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="rice" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  <CartesianGrid stroke="#f3f4f6" strokeDasharray="5 5" />
                  <XAxis dataKey="month" tick={{fill: '#6b7280'}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fill: '#6b7280'}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-100 p-6 flex flex-col">
            <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Market AI Insights
            </h2>
            <div className="flex-1 text-amber-800/80 leading-relaxed text-sm">
              {aiInsights ? aiInsights : (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-amber-200/50 rounded w-full"></div>
                  <div className="h-4 bg-amber-200/50 rounded w-5/6"></div>
                  <div className="h-4 bg-amber-200/50 rounded w-4/6"></div>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-amber-200/50 text-xs text-amber-700/60 text-center">
              Powered by Google Gemini
            </div>
          </div>

        </div>

        {/* Product Listings */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="h-6 w-6 text-green-600" />
            Available Products
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={product.id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-48 bg-amber-100 relative">
                  <img src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400" alt="Wheat" className="w-full h-full object-cover mix-blend-multiply opacity-80" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-900">
                    ₹{product.pricePerKg}/kg
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                      {product.quantityAvailable} kg left
                    </span>
                    <button className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg font-medium transition">
                      <ShoppingCart className="h-4 w-4" /> Buy
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
