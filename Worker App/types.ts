export enum ServiceCategory {
  PLUMBING = 'Plumbing',
  ELECTRICAL = 'Electrical',
  CLEANING = 'Cleaning',
  HVAC = 'HVAC',
  HANDYMAN = 'Handyman',
  PAINTING = 'Painting',
}

export enum ExperienceLevel {
  BEGINNER = 'Beginner (<2 years)',
  INTERMEDIATE = 'Intermediate (2-5 years)',
  EXPERT = 'Expert (>5 years)',
}

export enum AvailabilityStatus {
  ONLINE = 'Online', 
  OFFLINE = 'Offline', 
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountPercent?: number;
  validUntil?: string; 
  isActive: boolean;
  code?: string;
}

export interface Achievement {
  id: string;
  name: string;
  iconName: string; // e.g., 'SparklesIcon', 'TrophyIcon'
  description: string;
  dateEarned: string; // ISO date string
}

export interface WorkerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePicture?: {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
  };
  isVerified?: boolean;
  serviceCategory?: string;
  experienceLevel?: string;
  availability?: string;
  availabilityStatus?: string;
  location?: { latitude: number; longitude: number };
}

export interface Service {
  _id: string;
  userEmail: string;
  phoneNumber?: string;  // Worker's phone number
  title: string;
  description?: string;
  price?: number;
  category?: string;
  priceType?: 'fixed' | 'hourly';
  availability?: string;
  locationName?: string;
  locationCoords?: { lat: number; lng: number };
  tags?: string[];
  maxDistance?: number;
  experienceRequired?: string;
  images?: string[];
}

export enum BookingStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
  IN_PROGRESS = 'In Progress',
}

export interface Booking {
  _id: string;
  serviceId: string;
  workerId: string;
  workerEmail: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  bookingDate: string | Date;
  status: BookingStatus;
  address: {
    text: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  notes?: string;
  price?: number;
  serviceFee?: number;
  totalAmount?: number;
  paymentStatus?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // For backward compatibility
  date?: string | Date;
  time?: string;
  location?: string;
  serviceName?: string;
  clientName?: string;
  clientPhone?: string;
  completed?: boolean;
  completedAt?: string | Date;
  completionRequested?: boolean;
}

export interface Review {
  _id: string;
  booking: string;
  bookingId: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  worker: {
    id: string;
    name: string;
    email: string;
  };
  rating: number;
  review: string;
  workerResponse?: {
    response: string;
    respondedAt: Date;
    status: 'pending' | 'responded';
    responderId: string;
    responderName: string;
    responderRole: 'worker' | 'admin';
  };
  createdAt: Date;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string; // For now, only images
  serviceTag?: string; // e.g., "Electrical Wiring", "Pipe Repair"
  clientVerified?: boolean;
  dateAdded: string; // ISO date string
}

export enum ActivityItemType {
  NEW_BOOKING = 'New Booking',
  BOOKING_CONFIRMED = 'Booking Confirmed',
  BOOKING_COMPLETED = 'Booking Completed',
  REVIEW_RECEIVED = 'New Review',
  PROFILE_UPDATED = 'Profile Updated',
  ACHIEVEMENT_UNLOCKED = 'Achievement Unlocked',
}

export interface ActivityItem {
  id: string;
  type: ActivityItemType;
  text: string; // e.g., "New booking request from John Doe."
  date: string; // ISO date string
  iconName: string; // e.g., 'CalendarDaysIcon', 'StarIcon'
  relatedId?: string; // e.g., bookingId or reviewId
}


export type AppView = 'profile' | 'services' | 'bookings' | 'analytics' | 'reviews' | 'portfolio' | 'activity';
export type AuthView = 'login' | 'signup' | 'otp';
export type OtpContext = 'login' | 'signup';

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';
export type Theme = 'light' | 'dark'; 