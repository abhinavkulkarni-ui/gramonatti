export type UserRole = 'farmer' | 'laborer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  location: string;
  district?: string;
  taluka?: string;
  lat?: number;
  lng?: number;
  profileCompleted: boolean;
  emailVerified?: boolean;
  // Farmer / Job Provider specific
  farmName?: string;
  farmSize?: string;
  crops?: string;
  soilType?: string;
  irrigationType?: string;
  farmGateAddress?: string;
  equipment?: string[];
  kisanCardId?: string;
  // Laborer specific
  age?: number;
  gender?: string;
  skills?: string;
  experience?: string;
  expectedWage?: number;
  availability?: 'available' | 'busy';
  workingRadiusKm?: number;
  emergencyContact?: string;
  emergencyPhone?: string;
  // Common Financial / Bank DBT Details (direct wage or produce payouts)
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  aadhaarNumber?: string;
  // Admin specific
  mandiDivision?: string;
  adminCode?: string;
  createdAt?: string;
}

export interface Job {
  id: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  title: string;
  category: 'Harvesting' | 'Machinery' | 'Irrigation' | 'Plant Care' | 'Sowing' | 'Loading & Transport';
  description: string;
  pay: number; // wage per day in INR
  wageType?: 'per_day' | 'per_acre' | 'per_hour' | 'daily';
  location: string;
  area: string; // Taluka/District/Zone
  lat: number;
  lng: number;
  workersNeeded: number;
  workersHired?: number;
  startDate?: string;
  date?: string;
  durationDays?: number;
  distanceKm?: number;
  amenities?: string[] | {
    foodProvided: boolean;
    lodgingProvided: boolean;
    transportProvided: boolean;
  };
  status: 'open' | 'in_progress' | 'completed';
  createdAt?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle?: string;
  jobLocation?: string;
  dailyWage?: number;
  laborerId: string;
  laborerName?: string;
  laborerPhone?: string;
  laborerSkills?: string;
  laborerExperience?: string;
  farmerId: string;
  farmerName?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  appliedAt: string;
  job?: Job;
  user?: UserProfile;
}

export interface FarmProduct {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerWhatsapp?: string;
  name: string;
  category: 'Cereals' | 'Millets' | 'Pulses' | 'Oilseeds' | 'Cash Crops' | 'Vegetables';
  cropType: 'Wheat' | 'Bajra' | 'Jowar' | 'Soybean' | 'Cotton' | 'Toor Dal' | 'Mustard' | 'Onion' | 'Other';
  variety: string; // e.g. Sharbati, Lokwan, Hybrid Desi, Maldandi
  pricePerKg: number;
  pricePerQuintal: number;
  quantityAvailableKg: number;
  minOrderKg: number;
  description: string;
  location: string;
  taluka?: string;
  moisturePercent?: number;
  mandiBenchmarkRate?: number;
  imageUrl: string;
  harvestDate: string;
  organicCertified: boolean;
  qualityGrade: 'A+' | 'A' | 'B';
  status: 'active' | 'sold_out';
}

export interface ProductOrder {
  id: string;
  productId: string;
  productName: string;
  cropType: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  deliveryType: 'farm_pickup' | 'mandi_delivery';
  quantityKg: number;
  pricePerKg: number;
  totalAmount: number;
  orderDate: string;
  status: 'confirmed' | 'dispatched' | 'delivered';
}
