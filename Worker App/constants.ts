import { ServiceCategory, ExperienceLevel, WorkerProfile, Service, Booking, BookingStatus, Offer, AvailabilityStatus, Review, PortfolioItem, Achievement, ActivityItem, ActivityItemType } from './types';

export const APP_NAME = "WeFixIt Worker";
export const APP_LOGO_NAME = "WeFix"; 

export const DEFAULT_AVAILABILITY_STATUS = AvailabilityStatus.ONLINE;

export const MOCK_EARNINGS_SUMMARY = {
  currentWeek: 255.75,
  lastWeek: 310.50,
};

export const INITIAL_OFFERS: Offer[] = [
  { id: 'offer-001', title: '15% Off First Plumbing Service', description: 'Get 15% off your first plumbing job this month.', discountPercent: 15, validUntil: '2024-12-31T23:59:59Z', isActive: true, code: 'WELCOME15' },
  { id: 'offer-002', title: 'Weekend Electrical Special', description: 'Book any electrical service on a weekend and get $20 off.', discountPercent: 0, isActive: true, validUntil: '2024-12-31T23:59:59Z' },
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-001', name: 'First 10 Jobs', iconName: 'SparklesIcon', description: 'Completed your first 10 jobs successfully!', dateEarned: '2024-07-15T10:00:00Z' },
  { id: 'ach-002', name: 'Top Rated Pro', iconName: 'StarIcon', description: 'Maintained a 5-star average rating for a month.', dateEarned: '2024-08-01T10:00:00Z' },
  { id: 'ach-003', name: 'Quick Responder', iconName: 'ChatBubbleLeftEllipsisIcon', description: 'Responded to 95% of new bookings within 1 hour.', dateEarned: '2024-08-10T10:00:00Z' },
];

export const DEFAULT_PROFILE: WorkerProfile = {
  id: 'worker-007',
  name: 'Alex Johnson',
  email: 'worker@example.com', // Easy login
  phone: '555-0077',
  serviceCategory: ServiceCategory.ELECTRICAL,
  experienceLevel: ExperienceLevel.EXPERT,
  availability: 'Mon-Sat, 8am-6pm. Emergency calls accepted.',
  profilePictureUrl: 'https://picsum.photos/seed/worker007/200/200',
  isVerified: true,
  availabilityStatus: DEFAULT_AVAILABILITY_STATUS,
  isAvailableToday: true, 
  availabilitySetDate: new Date().toISOString().split('T')[0], 
  offers: INITIAL_OFFERS.filter(o => o.isActive).slice(0,2),
  location: { latitude: 34.0522, longitude: -118.2437 },
  achievements: MOCK_ACHIEVEMENTS.slice(0, 2),
};


export const INITIAL_SERVICES: Service[] = [
  { id: 'service-001', name: 'Circuit Breaker Fix', description: 'Repairing and replacing faulty circuit breakers. Ensures safety and functionality of your electrical panel.', price: 90, priceType: 'hourly', experienceYearsInThisService: 5 },
  { id: 'service-002', name: 'Wiring Inspection', description: 'Complete electrical wiring inspection for safety, identifying potential hazards and ensuring code compliance.', price: 180, priceType: 'fixed', experienceYearsInThisService: 7 },
  { id: 'service-003', name: 'Smart Home Setup', description: 'Installation and configuration of smart lighting, thermostats, and other smart home devices for convenience and energy efficiency.', price: 250, priceType: 'fixed', experienceYearsInThisService: 3 },
];

export const INITIAL_BOOKINGS: Booking[] = [
  { id: 'booking-001', clientName: 'Maria Garcia', serviceName: 'Circuit Breaker Fix', serviceId: 'service-001', date: '2024-07-28', time: '11:00 AM', location: '321 Palm Ave, Cityville', status: BookingStatus.PENDING, notes: 'Main breaker keeps tripping.' },
  { id: 'booking-002', clientName: 'Kenji Tanaka', serviceName: 'Wiring Inspection', serviceId: 'service-002', date: '2024-07-29', time: '03:00 PM', location: '789 Maple Dr, Cityville', status: BookingStatus.CONFIRMED },
  { id: 'booking-003', clientName: 'Linda White', serviceName: 'Smart Home Setup', serviceId: 'service-003', date: '2024-08-02', time: '10:00 AM', location: '654 Birch St, Cityville', status: BookingStatus.COMPLETED },
  { id: 'booking-004', clientName: 'Samuel Green', serviceName: 'Circuit Breaker Fix', serviceId: 'service-001', date: '2024-08-05', time: '01:00 PM', location: '987 Willow Rd, Cityville', status: BookingStatus.IN_PROGRESS },
  { id: 'booking-005', clientName: 'Alice Brown', serviceName: 'Circuit Breaker Fix', serviceId: 'service-001', date: '2024-08-01', time: '09:00 AM', location: '111 Oak Ln, Cityville', status: BookingStatus.COMPLETED },
];

export const INITIAL_REVIEWS: Review[] = [
  { id: 'review-001', bookingId: 'booking-003', clientName: 'Linda White', rating: 5, comment: 'Alex did an amazing job setting up my smart home system! Very professional and efficient.', date: '2024-08-03T14:00:00Z', workerResponse: 'Thank you, Linda! Glad you are enjoying your new setup.' },
  { id: 'review-002', bookingId: 'booking-005', clientName: 'Alice Brown', rating: 4, comment: 'Good service, fixed the breaker quickly. Arrived a little late though.', date: '2024-08-01T17:00:00Z' },
  { id: 'review-003', bookingId: 'booking-001', clientName: 'Maria Garcia', rating: 2, comment: 'The issue wasn\'t fully resolved and I had to call again. Not happy with the outcome.', date: '2024-07-30T09:00:00Z', appealReason: 'Follow-up appointment scheduled and issue fully resolved. Misunderstanding.', appealStatus: 'pending' },
];

export const INITIAL_PORTFOLIO_ITEMS: PortfolioItem[] = [
  { id: 'pf-001', title: 'Smart Kitchen Lighting', description: 'Installed custom LED strip lighting and smart controls for a modern kitchen.', imageUrl: 'https://picsum.photos/seed/portfolio1/600/400', serviceTag: 'Smart Home Setup', clientVerified: true, dateAdded: '2024-08-05T10:00:00Z' },
  { id: 'pf-002', title: 'Panel Upgrade & Rewire', description: 'Full electrical panel upgrade for an older home, including partial rewiring for safety.', imageUrl: 'https://picsum.photos/seed/portfolio2/600/400', serviceTag: 'Wiring Inspection', dateAdded: '2024-07-20T10:00:00Z' },
];

export const INITIAL_ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 'act-001', type: ActivityItemType.NEW_BOOKING, text: 'New booking request: Circuit Breaker Fix from Maria Garcia.', date: '2024-07-28T10:00:00Z', iconName: 'CalendarDaysIcon', relatedId: 'booking-001' },
  { id: 'act-002', type: ActivityItemType.REVIEW_RECEIVED, text: 'New 4-star review from Alice Brown for Circuit Breaker Fix.', date: '2024-08-01T17:05:00Z', iconName: 'StarIcon', relatedId: 'review-002' },
  { id: 'act-003', type: ActivityItemType.ACHIEVEMENT_UNLOCKED, text: 'Achievement Unlocked: First 10 Jobs!', date: '2024-07-15T10:01:00Z', iconName: 'SparklesIcon', relatedId: 'ach-001' },
  { id: 'act-004', type: ActivityItemType.BOOKING_COMPLETED, text: 'Booking completed: Smart Home Setup for Linda White.', date: '2024-08-02T11:00:00Z', iconName: 'CheckCircleIcon', relatedId: 'booking-003' },
];


export const SERVICE_CATEGORIES_OPTIONS = Object.values(ServiceCategory);
export const EXPERIENCE_LEVELS_OPTIONS = Object.values(ExperienceLevel);
export const BOOKING_STATUS_OPTIONS = Object.values(BookingStatus);
export const AVAILABILITY_STATUS_OPTIONS = Object.values(AvailabilityStatus); 