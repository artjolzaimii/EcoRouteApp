// Mock data for EcoRoute Admin Panel

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'User' | 'Partner' | 'Admin';
  status: 'Active' | 'Suspended';
  greenPoints: number;
  lifetimePoints: number;
  totalTrips: number;
  co2Saved: number;
  currentStreak: number;
  longestStreak: number;
  joinedDate: string;
  lastActive: string;
  city: string;
  country: string;
}

export interface Trip {
  id: string;
  userId: string;
  date: string;
  origin: string;
  destination: string;
  mode: 'Walking' | 'Cycling' | 'Transit' | 'Mixed';
  distance: number;
  co2Saved: number;
  pointsEarned: number;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'TRIP_EARNED' | 'BADGE_BONUS' | 'STREAK_BONUS' | 'COUPON_REDEEMED' | 'ADMIN_ADJUSTMENT';
  amount: number;
  balanceAfter: number;
  date: string;
  note: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionType: 'Trips Count' | 'CO2 Saved' | 'Total KM' | 'Streak Days' | 'Specific Mode';
  conditionValue: number;
  mode?: 'Walking' | 'Cycling' | 'Transit' | 'Mixed';
  pointsReward: number;
  active: boolean;
  earnedByCount: number;
}

export interface Partner {
  id: string;
  businessName: string;
  category: string;
  description: string;
  logo?: string;
  website: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  triggerRadius: number;
  monthlyFee: number;
  status: 'Active' | 'Pending' | 'Suspended' | 'Rejected';
  pinViews: number;
  activeCoupons: number;
  redemptions: number;
  dateApplied: string;
}

export interface Coupon {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  discountType: 'Percentage' | 'Fixed' | 'Free Item';
  discountValue: number | string;
  earnType: 'Free' | 'Points' | 'Trips';
  earnValue: number;
  validFrom: string;
  validUntil: string;
  maxRedemptions: number;
  currentRedemptions: number;
  maxPerUser: number;
  active: boolean;
}

export interface ActivityEvent {
  id: string;
  type: 'trip' | 'user' | 'partner' | 'badge';
  description: string;
  timestamp: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Chen',
    email: 'alex@email.com',
    role: 'User',
    status: 'Active',
    greenPoints: 2450,
    lifetimePoints: 3200,
    totalTrips: 87,
    co2Saved: 142.5,
    currentStreak: 5,
    longestStreak: 14,
    joinedDate: '2026-01-15',
    lastActive: '2026-04-07',
    city: 'Berlin',
    country: 'Germany'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    role: 'User',
    status: 'Active',
    greenPoints: 3890,
    lifetimePoints: 4100,
    totalTrips: 124,
    co2Saved: 218.3,
    currentStreak: 12,
    longestStreak: 18,
    joinedDate: '2025-11-03',
    lastActive: '2026-04-07',
    city: 'Amsterdam',
    country: 'Netherlands'
  },
  {
    id: '3',
    name: 'James Wilson',
    email: 'j.wilson@email.com',
    role: 'User',
    status: 'Active',
    greenPoints: 1820,
    lifetimePoints: 2100,
    totalTrips: 56,
    co2Saved: 95.8,
    currentStreak: 3,
    longestStreak: 9,
    joinedDate: '2026-02-20',
    lastActive: '2026-04-06',
    city: 'Copenhagen',
    country: 'Denmark'
  },
  {
    id: '4',
    name: 'Sophie Dubois',
    email: 'sophie.d@email.com',
    role: 'Partner',
    status: 'Active',
    greenPoints: 450,
    lifetimePoints: 450,
    totalTrips: 12,
    co2Saved: 18.2,
    currentStreak: 0,
    longestStreak: 4,
    joinedDate: '2026-03-10',
    lastActive: '2026-04-05',
    city: 'Paris',
    country: 'France'
  },
  {
    id: '5',
    name: 'Admin User',
    email: 'admin@ecoroute.com',
    role: 'Admin',
    status: 'Active',
    greenPoints: 0,
    lifetimePoints: 0,
    totalTrips: 0,
    co2Saved: 0,
    currentStreak: 0,
    longestStreak: 0,
    joinedDate: '2025-09-01',
    lastActive: '2026-04-07',
    city: 'Berlin',
    country: 'Germany'
  }
];

// Mock Partners
export const mockPartners: Partner[] = [
  {
    id: '1',
    businessName: 'Green Coffee Berlin',
    category: 'Café',
    description: 'Organic, fair-trade coffee shop with plant-based options',
    website: 'https://greencoffeeberlin.de',
    phone: '+49 30 12345678',
    address: 'Kastanienallee 45',
    city: 'Berlin',
    country: 'Germany',
    lat: 52.5311,
    lng: 13.4105,
    triggerRadius: 300,
    monthlyFee: 99,
    status: 'Active',
    pinViews: 1247,
    activeCoupons: 3,
    redemptions: 89,
    dateApplied: '2025-10-15'
  },
  {
    id: '2',
    businessName: 'Bike Lab Berlin',
    category: 'Bike Shop',
    description: 'Full-service bike shop and repair center',
    website: 'https://bikelab.de',
    phone: '+49 30 98765432',
    address: 'Torstraße 112',
    city: 'Berlin',
    country: 'Germany',
    lat: 52.5289,
    lng: 13.4015,
    triggerRadius: 250,
    monthlyFee: 149,
    status: 'Active',
    pinViews: 892,
    activeCoupons: 2,
    redemptions: 56,
    dateApplied: '2025-11-20'
  },
  {
    id: '3',
    businessName: 'EcoGym Amsterdam',
    category: 'Fitness',
    description: 'Sustainable fitness studio with bike-powered equipment',
    website: 'https://ecogym.nl',
    phone: '+31 20 1234567',
    address: 'Prinsengracht 234',
    city: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.3676,
    lng: 4.8852,
    triggerRadius: 400,
    monthlyFee: 199,
    status: 'Pending',
    pinViews: 0,
    activeCoupons: 0,
    redemptions: 0,
    dateApplied: '2026-04-05'
  },
  {
    id: '4',
    businessName: 'Plant Power Bistro',
    category: 'Restaurant',
    description: '100% plant-based restaurant with local ingredients',
    website: 'https://plantpower.dk',
    phone: '+45 33 123456',
    address: 'Nørrebrogade 78',
    city: 'Copenhagen',
    country: 'Denmark',
    lat: 55.6893,
    lng: 12.5537,
    triggerRadius: 300,
    monthlyFee: 129,
    status: 'Pending',
    pinViews: 0,
    activeCoupons: 0,
    redemptions: 0,
    dateApplied: '2026-04-06'
  },
  {
    id: '5',
    businessName: 'Zero Waste Store',
    category: 'Retail',
    description: 'Package-free grocery and household goods',
    website: 'https://zerowaste.fr',
    phone: '+33 1 23456789',
    address: 'Rue de Rivoli 89',
    city: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    triggerRadius: 200,
    monthlyFee: 79,
    status: 'Pending',
    pinViews: 0,
    activeCoupons: 0,
    redemptions: 0,
    dateApplied: '2026-04-07'
  }
];

// Mock Coupons
export const mockCoupons: Coupon[] = [
  {
    id: '1',
    partnerId: '1',
    title: '10% off your coffee',
    description: 'Get 10% off any drink when you arrive by eco-transport',
    discountType: 'Percentage',
    discountValue: 10,
    earnType: 'Free',
    earnValue: 0,
    validFrom: '2026-04-01',
    validUntil: '2026-05-31',
    maxRedemptions: 500,
    currentRedemptions: 89,
    maxPerUser: 10,
    active: true
  },
  {
    id: '2',
    partnerId: '1',
    title: 'Free pastry with coffee',
    description: 'Free organic pastry with any coffee purchase',
    discountType: 'Free Item',
    discountValue: 'Organic Pastry',
    earnType: 'Points',
    earnValue: 500,
    validFrom: '2026-04-01',
    validUntil: '2026-06-30',
    maxRedemptions: 200,
    currentRedemptions: 34,
    maxPerUser: 3,
    active: true
  },
  {
    id: '3',
    partnerId: '2',
    title: '€15 off bike service',
    description: '€15 discount on any bike service or repair',
    discountType: 'Fixed',
    discountValue: 15,
    earnType: 'Trips',
    earnValue: 10,
    validFrom: '2026-03-15',
    validUntil: '2026-12-31',
    maxRedemptions: 100,
    currentRedemptions: 23,
    maxPerUser: 2,
    active: true
  }
];

// Mock Badges
export const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first eco-trip',
    icon: 'footprints',
    conditionType: 'Trips Count',
    conditionValue: 1,
    pointsReward: 50,
    active: true,
    earnedByCount: 847
  },
  {
    id: '2',
    name: 'Eco Warrior',
    description: 'Complete 50 eco-trips',
    icon: 'shield',
    conditionType: 'Trips Count',
    conditionValue: 50,
    pointsReward: 300,
    active: true,
    earnedByCount: 124
  },
  {
    id: '3',
    name: 'Car-Free Week',
    description: 'Complete 7 consecutive eco-trips',
    icon: 'flame',
    conditionType: 'Streak Days',
    conditionValue: 7,
    pointsReward: 200,
    active: true,
    earnedByCount: 87
  },
  {
    id: '4',
    name: 'Carbon Saver',
    description: 'Save 100kg of CO2',
    icon: 'leaf',
    conditionType: 'CO2 Saved',
    conditionValue: 100,
    pointsReward: 400,
    active: true,
    earnedByCount: 156
  },
  {
    id: '5',
    name: 'Cycling Champion',
    description: 'Complete 20 trips by bicycle',
    icon: 'bike',
    conditionType: 'Specific Mode',
    conditionValue: 20,
    mode: 'Cycling',
    pointsReward: 250,
    active: true,
    earnedByCount: 98
  },
  {
    id: '6',
    name: 'Transit Pro',
    description: 'Complete 30 trips by public transit',
    icon: 'bus',
    conditionType: 'Specific Mode',
    conditionValue: 30,
    mode: 'Transit',
    pointsReward: 250,
    active: true,
    earnedByCount: 134
  }
];

// Mock Activity Feed
export const mockActivityEvents: ActivityEvent[] = [
  { id: '1', type: 'user', description: 'New user registered — alex@email.com', timestamp: '2 min ago' },
  { id: '2', type: 'trip', description: 'Trip completed — 1.4kg CO2 saved', timestamp: '5 min ago' },
  { id: '3', type: 'partner', description: 'Partner approved — Bike Lab Berlin', timestamp: '12 min ago' },
  { id: '4', type: 'badge', description: 'Badge earned — Car-Free Week by user Maria', timestamp: '18 min ago' },
  { id: '5', type: 'trip', description: 'Coupon redeemed — ECO-X7K2M9 at Green Coffee', timestamp: '23 min ago' },
  { id: '6', type: 'trip', description: 'Trip completed — 2.1kg CO2 saved', timestamp: '31 min ago' },
  { id: '7', type: 'user', description: 'New user registered — james.w@email.com', timestamp: '45 min ago' },
  { id: '8', type: 'badge', description: 'Badge earned — First Steps by user Sophie', timestamp: '1 hour ago' },
  { id: '9', type: 'partner', description: 'New partner application — EcoGym Amsterdam', timestamp: '2 hours ago' },
  { id: '10', type: 'trip', description: 'Trip completed — 0.8kg CO2 saved', timestamp: '2 hours ago' }
];

// Mock Trips
export const mockTrips: Trip[] = [
  {
    id: '1',
    userId: '1',
    date: '2026-04-07',
    origin: 'Alexanderplatz',
    destination: 'Prenzlauer Berg',
    mode: 'Cycling',
    distance: 3.2,
    co2Saved: 1.4,
    pointsEarned: 21
  },
  {
    id: '2',
    userId: '1',
    date: '2026-04-06',
    origin: 'Home',
    destination: 'Office',
    mode: 'Transit',
    distance: 8.5,
    co2Saved: 2.8,
    pointsEarned: 28
  },
  {
    id: '3',
    userId: '1',
    date: '2026-04-05',
    origin: 'Office',
    destination: 'Café',
    mode: 'Walking',
    distance: 1.2,
    co2Saved: 0.5,
    pointsEarned: 8
  }
];

// Mock Points Transactions
export const mockPointsTransactions: PointsTransaction[] = [
  {
    id: '1',
    userId: '1',
    type: 'TRIP_EARNED',
    amount: 21,
    balanceAfter: 2450,
    date: '2026-04-07',
    note: 'Trip completed: Alexanderplatz → Prenzlauer Berg'
  },
  {
    id: '2',
    userId: '1',
    type: 'BADGE_BONUS',
    amount: 200,
    balanceAfter: 2429,
    date: '2026-04-05',
    note: 'Badge earned: Car-Free Week'
  },
  {
    id: '3',
    userId: '1',
    type: 'COUPON_REDEEMED',
    amount: -500,
    balanceAfter: 2229,
    date: '2026-04-03',
    note: 'Redeemed: Free pastry at Green Coffee Berlin'
  },
  {
    id: '4',
    userId: '1',
    type: 'STREAK_BONUS',
    amount: 50,
    balanceAfter: 2729,
    date: '2026-04-02',
    note: '3-day streak milestone'
  }
];

// Dashboard metrics
export const dashboardMetrics = {
  totalUsers: 847,
  usersToday: 12,
  totalTrips: 34521,
  tripsWeeklyChange: 8.3,
  co2SavedLifetime: 58234,
  treesEquivalent: 2649,
  activePartners: 15,
  pendingPartners: 3
};

// Chart data for Analytics
export const dailyStatsLast30Days = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 2, 8 + i).toISOString().split('T')[0],
  trips: Math.floor(Math.random() * 200) + 800,
  co2Saved: Math.floor(Math.random() * 400) + 1500
}));

export const tripModeDistribution = [
  { mode: 'Walking', count: 8234, percentage: 23.8 },
  { mode: 'Cycling', count: 12456, percentage: 36.1 },
  { mode: 'Transit', count: 11231, percentage: 32.5 },
  { mode: 'Mixed', count: 2600, percentage: 7.6 }
];

export const topCitiesByTrips = [
  { city: 'Berlin', trips: 12456 },
  { city: 'Amsterdam', trips: 9821 },
  { city: 'Copenhagen', trips: 8234 },
  { city: 'Paris', trips: 6789 },
  { city: 'Munich', trips: 5432 },
  { city: 'Vienna', trips: 4567 },
  { city: 'Stockholm', trips: 3890 },
  { city: 'Brussels', trips: 3245 },
  { city: 'Hamburg', trips: 2987 },
  { city: 'Oslo', trips: 2456 }
];

export const partnerCategories = [
  'Café',
  'Restaurant',
  'Bike Shop',
  'Fitness',
  'Retail',
  'Co-working',
  'Hotel',
  'Entertainment',
  'Services',
  'Other'
];

export const badgeIcons = [
  'leaf',
  'bike',
  'bus',
  'footprints',
  'flame',
  'star',
  'trophy',
  'tree',
  'shield',
  'heart',
  'compass',
  'clock',
  'mountain',
  'sun',
  'droplet',
  'zap',
  'award',
  'target',
  'gem',
  'crown'
];
