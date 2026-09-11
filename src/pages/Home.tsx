import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Tractor, Users, Landmark, MapPin, Sparkles, Sprout, Navigation } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen pt-16 font-sans">
      {/* Hero Section with Image Background */}
      <div className="relative h-[90vh] w-full overflow-hidden bg-green-950">
        <motion.img 
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: 'easeOut' }}
          src="/assets/aistudio/image.png" 
          alt="Lush green field at sunset"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Adjusted the gradient overlay to make the colors richer and text more readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-950 via-green-900/80 to-transparent mix-blend-multiply opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 to-transparent"></div>
        
        <div className="absolute inset-0 flex flex-col items-start justify-center text-white px-6 sm:px-12 lg:px-24">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-3xl"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <Sprout className="h-10 w-10 text-green-400" />
              </div>
              <span className="text-4xl font-black tracking-tight text-white drop-shadow-md">RURALRISE</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-lg leading-[1.1]">
              Bridging the gap between <span className="text-green-400">Labor</span> & <span className="text-yellow-400">Farms</span>
            </h1>
            <p className="text-xl md:text-2xl text-green-50/90 mb-10 max-w-2xl leading-relaxed drop-shadow-md font-light">
              An advanced AI-powered platform empowering agricultural teams, job givers, and laborers to connect, organize, and thrive together through real-time GPS and market insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Link to="/login" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-1">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/marketplace" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-2xl text-lg font-semibold transition-all hover:-translate-y-1 flex justify-center">
                Explore Market
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-4xl md:text-5xl font-extrabold text-green-950 mb-6 leading-tight">Revolutionizing the Agricultural Workforce</h2>
              <p className="text-lg text-green-800/80 mb-6 leading-relaxed">
                RuralRise was built with a single vision: to bridge the gap between hardworking agricultural laborers and the farmers or organizations that need them. We understand that finding reliable work or skilled workers in the farming sector can be challenging.
              </p>
              <p className="text-lg text-green-800/80 leading-relaxed mb-8">
                By integrating real-time GPS tracking, AI-driven job matching, and transparent market insights, we empower the agricultural community to operate more efficiently.
              </p>
              <div className="flex flex-wrap items-center gap-6 text-green-900 font-bold">
                <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 shadow-sm"><Sparkles className="h-5 w-5 text-yellow-500" /> AI Matched Jobs</div>
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm"><Navigation className="h-5 w-5 text-blue-500" /> Live GPS Routing</div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-green-900/15 h-[500px]"
            >
              <img src="/assets/aistudio/image.png" alt="RuralRise Vision" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
                  <h3 className="font-bold text-xl mb-2">Real-Time Connectivity</h3>
                  <p className="text-green-50 text-sm leading-relaxed">Laborers and farmers are connected instantly, ensuring crops are harvested on time and workers get paid fairly.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-green-50 border-t border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-green-950 mb-4">Empowering the Ecosystem</h2>
            <p className="text-xl text-green-700/80 max-w-2xl mx-auto">Everything you need to manage your farm workforce or find your next agricultural job.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              delay={0.1}
              icon={<Users className="h-8 w-8 text-green-600" />}
              title="Smart Job Matching"
              description="AI-powered suggestions connect the right laborers with the right tasks instantly based on skills and location."
            />
            <FeatureCard 
              delay={0.2}
              icon={<MapPin className="h-8 w-8 text-green-600" />}
              title="Live GPS Routing"
              description="Integrated maps calculate travel distance and guide workers directly to the farm with Google Maps deep linking."
            />
            <FeatureCard 
              delay={0.3}
              icon={<Landmark className="h-8 w-8 text-green-600" />}
              title="Market Insights"
              description="Real-time price trends for crops like wheat, helping farmers sell at the right time using AI analysis."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -8 }}
      className="bg-white p-8 rounded-[2rem] shadow-sm border border-green-100 hover:shadow-2xl hover:shadow-green-900/10 transition-all duration-300"
    >
      <div className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-green-950 mb-3">{title}</h3>
      <p className="text-green-800/70 leading-relaxed text-lg">{description}</p>
    </motion.div>
  );
}
