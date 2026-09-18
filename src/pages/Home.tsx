import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Tractor, Users, Navigation, Sprout, Leaf, Sun, Droplets } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-amber-50/30">
      {/* Hero Section with Agrigo Premium Vibe */}
      <div className="relative min-h-[95vh] w-full flex items-center justify-center overflow-hidden bg-[#1f291e]">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 15, ease: 'easeOut' }}
          src="https://images.unsplash.com/photo-1592982537447-6f23342084c6?auto=format&fit=crop&q=80&w=2940" 
          alt="Lush green field at sunrise"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        {/* Soft Agrigo Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101b10] via-[#101b10]/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#101b10]/90 via-[#101b10]/60 to-transparent"></div>
        
        {/* Decorative Floating Leaves */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 opacity-30 text-green-500 hidden lg:block"
        >
          <Leaf size={120} />
        </motion.div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-8 pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-[#ffb703]/20 backdrop-blur-md border border-[#ffb703]/30 text-[#ffb703] px-4 py-2 rounded-full font-medium mb-6 tracking-wide text-sm uppercase shadow-lg">
              <Sun className="h-4 w-4" />
              Empowering Agriculture Together
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-xl">
              Smart Farming <br />
              <span className="text-[#8CC63F]">Better Future.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed font-light drop-shadow-md">
              RuralRise connects skilled laborers with farmers instantly. Experience AI-driven job matching, real-time GPS tracking, and transparent market insights designed for modern agriculture.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/login" className="w-full sm:w-auto bg-[#8CC63F] hover:bg-[#7ab332] text-[#101b10] px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#8CC63F]/20 hover:-translate-y-1">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/marketplace" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:-translate-y-1 flex justify-center">
                Explore Market
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Feature Highlights (Agrigo Style Cards) */}
      <div className="relative z-20 -mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: 'Labor Connections', desc: 'Find skilled workers or reliable farming jobs instantly.', color: 'bg-[#8CC63F]' },
            { icon: Navigation, title: 'GPS Routing', desc: 'Real-time navigation right to the farm or marketplace.', color: 'bg-[#ffb703]' },
            { icon: Sprout, title: 'Market Insights', desc: 'AI-driven analytics to get the best prices for your crops.', color: 'bg-[#438a5e]' }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className={`h-14 w-14 ${feature.color} text-white rounded-xl flex items-center justify-center mb-6 shadow-md`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-[#101b10] mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative rounded-3xl overflow-hidden shadow-2xl shadow-green-900/10 aspect-square lg:aspect-auto lg:h-[600px]"
            >
              <img src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=2942" alt="Farmer in field" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101b10]/90 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-8 left-8 right-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-white">
                  <h3 className="font-bold text-2xl mb-2 flex items-center gap-2">
                    <Tractor className="text-[#ffb703]" /> Cultivating Success
                  </h3>
                  <p className="text-gray-200 text-sm leading-relaxed">Join thousands of farmers and laborers increasing their daily efficiency through RuralRise.</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h4 className="text-[#8CC63F] font-bold tracking-wider uppercase mb-3 flex items-center gap-2">
                <Droplets className="h-5 w-5" /> About RuralRise
              </h4>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#101b10] mb-6 leading-tight">We're Revolutionizing the Agricultural Workforce</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Finding reliable work or skilled workers in the farming sector used to be a challenge. RuralRise bridges the gap, bringing modern technology directly to the fields.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  'Instant job posting and fast application process.',
                  'AI-based skill matching for precise hiring.',
                  'Secure profiles storing your verified experience.'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-[#8CC63F]/20 p-1 rounded-full text-[#8CC63F]">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <Link to="/login" className="inline-flex items-center gap-2 bg-[#101b10] hover:bg-[#1a2b1a] text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg">
                Join Our Community <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
