import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  X, 
  Navigation, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  Compass, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Job } from '../types';
import RuralRiseLogo from './RuralRiseLogo';
import { 
  getGoogleMapsDirectionsUrl, 
  getGoogleMapsPinUrl,
  requestDeviceGps, 
  calculateHaversineDistance, 
  generateFieldMilestones,
  getStoredUserGps,
  DEFAULT_AGRI_HUBS
} from '../lib/geoUtils';

interface DestinationMapModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  userLocation?: [number, number];
}

// Leaflet Map Auto-Sizer and Bounds Controller
function MapController({ 
  origin, 
  destination 
}: { 
  origin: [number, number]; 
  destination: [number, number]; 
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size after modal transition completes to prevent blank or gray tiles
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (origin && destination) {
        const bounds = L.latLngBounds([origin, destination]);
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 13 });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [map, origin[0], origin[1], destination[0], destination[1]]);

  return null;
}

// High-visibility crisp SVG Leaflet Markers (No broken external image dependencies)
const UserStartIcon = L.divIcon({
  className: 'user-origin-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      <div style="position: absolute; width: 36px; height: 36px; background: rgba(34, 197, 94, 0.35); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 28px; height: 28px; background: #15803d; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const DestinationFarmIcon = L.divIcon({
  className: 'destination-farm-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px;">
      <div style="position: absolute; width: 42px; height: 42px; background: rgba(220, 38, 38, 0.3); border-radius: 50%; animation: pulse 2s infinite;"></div>
      <div style="position: relative; width: 32px; height: 32px; background: #b91c1c; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21]
});

export default function DestinationMapModal({
  job,
  isOpen,
  onClose,
  userLocation
}: DestinationMapModalProps) {
  const [currentGps, setCurrentGps] = useState<[number, number]>(() => {
    if (userLocation && userLocation[0] && userLocation[1]) {
      return userLocation;
    }
    return getStoredUserGps();
  });

  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>('Origin Active');
  const [isLiveGps, setIsLiveGps] = useState(false);

  // Sync initial location when modal opens or job changes
  useEffect(() => {
    if (isOpen) {
      if (userLocation && userLocation[0] && userLocation[1]) {
        setCurrentGps(userLocation);
      } else {
        setCurrentGps(getStoredUserGps());
      }
    }
  }, [isOpen, userLocation]);

  if (!isOpen || !job) return null;

  // Destination coordinates guaranteed from job
  const destCoords: [number, number] = [
    job.lat || 19.9975, 
    job.lng || 73.7898
  ];

  // Dynamic intermediate road curves between origin & destination for agrarian visualization
  const midLat = (currentGps[0] + destCoords[0]) / 2 + 0.011;
  const midLng = (currentGps[1] + destCoords[1]) / 2 - 0.009;

  const routePositions: [number, number][] = [
    currentGps,
    [midLat, midLng],
    destCoords
  ];

  // Request high-precision live device GPS
  const handleRequestLiveGps = async () => {
    setIsLocating(true);
    setGpsStatus('Requesting Device GPS...');
    const result = await requestDeviceGps();
    setCurrentGps(result.coords);
    setGpsStatus(result.message);
    setIsLiveGps(!result.isSimulated);
    setIsLocating(false);
  };

  // Calculate actual distance & travel duration
  const haversineDist = calculateHaversineDistance(
    currentGps[0],
    currentGps[1],
    destCoords[0],
    destCoords[1]
  );
  const distanceKm = job.distanceKm || (haversineDist > 0 ? haversineDist : 14);
  const estMinutes = Math.max(10, Math.round((distanceKm / 35) * 60));

  // Turn-by-Turn Field Milestones
  const milestones = generateFieldMilestones(job.title, job.location, distanceKm);

  // Google Maps Turn-by-Turn URL (origin -> destination)
  const googleMapsTurnByTurnUrl = getGoogleMapsDirectionsUrl(
    destCoords[0],
    destCoords[1],
    job.location,
    currentGps[0],
    currentGps[1]
  );

  // Google Maps Direct Pin URL
  const googleMapsPinUrl = getGoogleMapsPinUrl(
    destCoords[0],
    destCoords[1],
    `${job.title} - ${job.location}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-emerald-200 my-3 relative overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#14532d] via-[#15803d] to-[#14532d] px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <RuralRiseLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#fde047] block">
                  Gramonnati GPS Destination Navigator
                </span>
                <span className="text-[10px] px-2 py-0.2 bg-white/20 rounded-full font-mono text-emerald-100">
                  {destCoords[0].toFixed(4)}°N, {destCoords[1].toFixed(4)}°E
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold leading-tight truncate max-w-xs sm:max-w-md">
                Route to: {job.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Google Maps Turn-by-Turn Button in Header */}
            <a
              href={googleMapsTurnByTurnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#14532d] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95"
              title="Launch Google Maps Turn-by-Turn Navigation with Destination Route"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-[#14532d]" />
              <span className="hidden sm:inline font-bold">Google Maps Navigation</span>
              <span className="sm:hidden font-bold">Google Maps</span>
            </a>

            {/* Live GPS Lock Button */}
            <button
              type="button"
              onClick={handleRequestLiveGps}
              disabled={isLocating}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/25 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-70"
              title="Detect real device GPS coordinates"
            >
              <Navigation className={`h-3.5 w-3.5 text-[#fde047] ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isLocating ? 'Locating...' : 'My Live GPS'}</span>
            </button>

            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition text-white"
              title="Close Navigator"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Map + Turn-by-Turn Guidance */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Interactive Leaflet Map Inside Modal */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="h-72 sm:h-96 w-full rounded-2xl overflow-hidden border-2 border-emerald-300/80 shadow-inner relative z-0 bg-[#e5e7eb]">
              <MapContainer 
                center={destCoords} 
                zoom={12} 
                scrollWheelZoom={true} 
                className="h-full w-full"
              >
                {/* Dynamically resizes & fits bounds to origin + destination */}
                <MapController origin={currentGps} destination={destCoords} />

                <TileLayer 
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                />
                
                {/* User Origin Marker */}
                <Marker position={currentGps} icon={UserStartIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="text-emerald-800 block text-sm">📍 Your Starting Point</strong>
                      <span className="text-gray-600 block mt-0.5">{gpsStatus}</span>
                      <span className="font-mono text-[10px] text-gray-500">{currentGps[0].toFixed(4)}, {currentGps[1].toFixed(4)}</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Destination Farm Marker */}
                <Marker position={destCoords} icon={DestinationFarmIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="text-[#14532d] block text-sm">🌾 {job.title}</strong>
                      <span className="block text-gray-700 font-semibold">{job.location}</span>
                      <span className="block text-gray-500">Producer: {job.farmerName}</span>
                      <span className="font-bold text-emerald-700 block mt-1">Wage: ₹{job.pay}/day</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Direct Road Route Polyline */}
                <Polyline 
                  positions={routePositions} 
                  color="#15803d" 
                  weight={5} 
                  opacity={0.9} 
                  dashArray="6, 8" 
                />
              </MapContainer>
            </div>

            {/* Quick Live GPS & Coordinates Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#f6faf6] rounded-xl border border-[#d8e5da] text-[11px] text-[#496552]">
              <div className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-[#15803d]" />
                <span>Destination Farm Coords: <strong className="font-mono text-[#14532d]">{destCoords[0].toFixed(4)}° N, {destCoords[1].toFixed(4)}° E</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  isLiveGps 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {gpsStatus}
                </span>
              </div>
            </div>

            {/* Google Maps Turn-by-Turn Banner (Prominent Callout) */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-amber-50/60 rounded-2xl border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#14532d] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Navigation className="h-4 w-4 text-[#fde047]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#14532d]">
                    Google Maps Turn-by-Turn Route Navigation
                  </h4>
                  <p className="text-[11px] text-[#425e4a] leading-tight mt-0.5">
                    Opens active voice & driving directions directly to <strong>{job.location}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={googleMapsTurnByTurnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#14532d] hover:bg-[#0f3d21] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-amber-300" />
                  <span>Start Turn-by-Turn</span>
                </a>
                <a
                  href={googleMapsPinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white hover:bg-gray-50 text-[#14532d] border border-gray-300 px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                  title="View Exact Destination Pin on Google Maps"
                >
                  <MapPin className="h-3 w-3 text-red-600" />
                  <span>Pin View</span>
                </a>
              </div>
            </div>

          </div>

          {/* Turn-by-Turn Route Instructions & Producer Contact */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4">
              {/* Trip Summary Card */}
              <div className="bg-gradient-to-br from-[#ecfdf5] to-[#fefce8] p-4 rounded-2xl border border-[#bbf7d0] space-y-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#15803d]">Calculated Distance</span>
                    <h4 className="text-2xl font-bold text-[#14532d]">{distanceKm} km</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-amber-700">Estimated Travel Time</span>
                    <h4 className="text-xl font-bold text-amber-900">~{estMinutes} mins</h4>
                  </div>
                </div>
                <div className="text-[11px] text-[#3d5a44] pt-1.5 border-t border-emerald-200/60 flex items-center justify-between">
                  <span>Transit Mode: <strong>Tractor / Bike / Pickup</strong></span>
                  <span className="text-emerald-800 font-bold">🌾 Rural Field Gate</span>
                </div>
              </div>

              {/* Turn-by-Turn Field Milestones */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#dce8de] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#14532d] flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-[#15803d]" />
                    <span>In-Site Step-by-Step Directions</span>
                  </h5>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {milestones.length} Milestones
                  </span>
                </div>

                <div className="space-y-2.5 text-xs max-h-56 overflow-y-auto pr-1">
                  {milestones.map((m) => (
                    <div key={m.step} className="flex gap-2.5 items-start">
                      <span className={`h-5 w-5 rounded-full font-bold flex items-center justify-center shrink-0 text-[10px] ${
                        m.step === milestones.length 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {m.step}
                      </span>
                      <div>
                        <p className="font-semibold text-[#14532d]">{m.instruction}</p>
                        <p className="text-[11px] text-[#526a57] mt-0.5">{m.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct Contact Farmer Options */}
            <div className="space-y-2 pt-2 border-t border-[#e2ede4]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Producer Field Contact:</span>
                <span className="text-[11px] text-[#14532d] font-semibold">{job.farmerName}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${job.farmerPhone || '+919822011223'}`}
                  className="bg-[#14532d] hover:bg-[#166534] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Phone className="h-3.5 w-3.5 text-[#fde047]" />
                  <span>Call {job.farmerName?.split(' ')[0] || 'Farmer'}</span>
                </a>

                <a
                  href={`https://wa.me/${(job.farmerPhone || '+919822011223').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Namaste ${job.farmerName}, I am on the way to your farm for "${job.title}". Distance is ${distanceKm} km (approx. ${estMinutes} mins).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp ETA</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
