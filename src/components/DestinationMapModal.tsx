import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  X, 
  Navigation, 
  MapPin, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  Clock, 
  Compass, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  ArrowRight
} from 'lucide-react';
import { Job } from '../types';
import RuralRiseLogo from './RuralRiseLogo';

interface DestinationMapModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  userLocation?: [number, number];
}

// Marker icons
const FarmerDestinationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const UserStartIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function DestinationMapModal({
  job,
  isOpen,
  onClose,
  userLocation = [19.9975, 73.7898] // Nashik Base
}: DestinationMapModalProps) {
  const [currentGps, setCurrentGps] = useState<[number, number]>(userLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>('Base Point Active');

  if (!isOpen || !job) return null;

  const destCoords: [number, number] = [job.lat, job.lng];

  // Generate intermediate waypoint for realistic agrarian road curvature
  const midLat = (currentGps[0] + destCoords[0]) / 2 + 0.012;
  const midLng = (currentGps[1] + destCoords[1]) / 2 - 0.008;

  const routePositions: [number, number][] = [
    currentGps,
    [midLat, midLng],
    destCoords
  ];

  const handleRequestLiveGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('GPS hardware unavailable, using base coords');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentGps([pos.coords.latitude, pos.coords.longitude]);
        setGpsStatus('Live GPS Locked');
        setIsLocating(false);
      },
      () => {
        // Fallback gracefully without error
        setGpsStatus('Simulated GPS Active');
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const distanceKm = job.distanceKm || Math.max(8, Math.round(
    Math.sqrt(
      Math.pow((destCoords[0] - currentGps[0]) * 111, 2) +
      Math.pow((destCoords[1] - currentGps[1]) * 111, 2)
    )
  ));

  const estMinutes = Math.round((distanceKm / 35) * 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-[#bbf7d0] my-4 relative overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#14532d] via-[#16a34a] to-[#14532d] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <RuralRiseLogo size="sm" showText={false} />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#fde047] block">
                In-Site Farm Gate GPS Navigator
              </span>
              <h3 className="text-base sm:text-lg font-serif font-bold leading-tight">
                Route to {job.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestLiveGps}
              disabled={isLocating}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/25 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5"
              title="Detect live GPS coordinates"
            >
              <Navigation className={`h-3.5 w-3.5 text-[#fde047] ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'My Live GPS'}</span>
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
            <div className="h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-[#cfe2d2] shadow-inner relative z-0">
              <MapContainer 
                center={destCoords} 
                zoom={11} 
                scrollWheelZoom={true} 
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                {/* User Origin Marker */}
                <Marker position={currentGps} icon={UserStartIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="text-emerald-800 block">Your Current Point</strong>
                      <span>Status: {gpsStatus}</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Destination Farm Marker */}
                <Marker position={destCoords} icon={FarmerDestinationIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="text-[#14532d] block">{job.title}</strong>
                      <span className="block text-gray-600">{job.location}</span>
                      <span className="font-bold text-emerald-700">Wage: ₹{job.pay}/day</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Direct Road Route Polyline */}
                <Polyline 
                  positions={routePositions} 
                  color="#15803d" 
                  weight={5} 
                  opacity={0.85} 
                  dashArray="4, 8" 
                />
              </MapContainer>
            </div>

            {/* Quick Live GPS & Coordinates Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#f6faf6] rounded-xl border border-[#d8e5da] text-[11px] text-[#496552]">
              <div className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-[#15803d]" />
                <span>Farm Gate Coords: <strong className="font-mono text-[#14532d]">{job.lat.toFixed(4)}° N, {job.lng.toFixed(4)}° E</strong></span>
              </div>
              <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                {gpsStatus}
              </span>
            </div>
          </div>

          {/* Turn-by-Turn Route Instructions & Producer Contact */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4">
              {/* Trip Summary Card */}
              <div className="bg-gradient-to-br from-[#ecfdf5] to-[#fefce8] p-4 rounded-2xl border border-[#bbf7d0] space-y-2">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#15803d]">Est. Distance</span>
                    <h4 className="text-2xl font-bold text-[#14532d]">{distanceKm} km</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-amber-700">Travel Duration</span>
                    <h4 className="text-xl font-bold text-amber-900">~{estMinutes} mins</h4>
                  </div>
                </div>
                <div className="text-[11px] text-[#3d5a44] pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                  <span>Transport Mode: <strong>Tractor / Two-Wheeler</strong></span>
                  <span className="text-emerald-800 font-bold">Clear Rural Route</span>
                </div>
              </div>

              {/* Turn-by-Turn Milestones */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#dce8de] space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#14532d] flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-[#15803d]" />
                  <span>Turn-by-Turn Field Directions</span>
                </h5>

                <div className="space-y-2.5 text-xs">
                  <div className="flex gap-2.5 items-start">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <div>
                      <p className="font-semibold text-[#14532d]">Head towards Taluka Main Agrarian Highway</p>
                      <p className="text-[11px] text-gray-500">Continue straight for {(distanceKm * 0.35).toFixed(1)} km past the local sugar cooperative.</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <div>
                      <p className="font-semibold text-[#14532d]">Turn onto Canal Field Road at Gate 3</p>
                      <p className="text-[11px] text-gray-500">Follow the paved canal distributary road for {(distanceKm * 0.45).toFixed(1)} km.</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <div>
                      <p className="font-semibold text-[#14532d]">Arrive at Destination: {job.location}</p>
                      <p className="text-[11px] text-gray-500">Field Gate landmark marked with Gramonnati harvest flag.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Contact Farmer Options */}
            <div className="space-y-2 pt-2 border-t border-[#e2ede4]">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Farmer Coordination:</span>
              
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${job.farmerPhone || '+919822011223'}`}
                  className="bg-[#14532d] hover:bg-[#166534] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Phone className="h-3.5 w-3.5 text-[#fde047]" />
                  <span>Call {job.farmerName.split(' ')[0]}</span>
                </a>

                <a
                  href={`https://wa.me/${(job.farmerPhone || '+919822011223').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Namaste ${job.farmerName}, I am navigating to your field for the job "${job.title}". Current ETA is ${estMinutes} mins.`
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
