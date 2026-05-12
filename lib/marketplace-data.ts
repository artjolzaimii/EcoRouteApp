export type Seller = {
  name: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  verified: boolean;
  location: string;
  distanceKm: number;
  responseTime: string;
};

export type UserReview = {
  name: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
};

export type MarketplaceProduct = {
  id: number;
  name: string;
  description: string;
  fullDescription: string;
  points: number;
  category: string;
  image: string;
  inStock: boolean;
  popular: boolean;
  negotiable: boolean;
  rating: number;
  reviews: number;
  features: string[];
  shipping: string;
  seller: Seller;
  userReviews: UserReview[];
};

export type MarketplaceCategory = {
  id: string;
  label: string;
  icon: string;
};

export const CATEGORIES: MarketplaceCategory[] = [
  { id: 'all',       label: 'All',     icon: 'bag-handle-outline' },
  { id: 'bike',      label: 'Bike',    icon: 'bicycle-outline' },
  { id: 'eco',       label: 'Eco',     icon: 'leaf-outline' },
  { id: 'coffee',    label: 'Coffee',  icon: 'cafe-outline' },
  { id: 'books',     label: 'Books',   icon: 'book-outline' },
  { id: 'gym',       label: 'Gym',     icon: 'barbell-outline' },
  { id: 'transport', label: 'Transit', icon: 'bus-outline' },
  { id: 'student',   label: 'Student', icon: 'school-outline' },
];

export const PRODUCTS: MarketplaceProduct[] = [
  {
    id: 1,
    name: 'Premium Bike Lock',
    description: 'Heavy-duty U-lock with mounting bracket',
    fullDescription:
      'Protect your bike with this premium U-lock featuring hardened steel construction, weather-resistant coating, and an easy-mount bracket. Includes two keys and a protective coating to prevent scratches on your bike frame.',
    points: 1200,
    category: 'bike',
    image: '🔒',
    inStock: true,
    popular: true,
    negotiable: true,
    rating: 4.7,
    reviews: 124,
    features: ['Hardened steel construction', 'Weather-resistant coating', 'Includes mounting bracket', '2 keys included'],
    shipping: 'Free shipping • Arrives in 5-7 days',
    seller: { name: 'EcoGear Store', avatar: '🏪', rating: 4.8, totalReviews: 342, verified: true, location: '2.3 km away', distanceKm: 2.3, responseTime: 'Usually responds in 2 hours' },
    userReviews: [
      { name: 'Sarah M.', avatar: '👩', rating: 5, date: '2 days ago', comment: 'Excellent quality! Very sturdy and easy to install.', helpful: 24 },
      { name: 'Mike R.', avatar: '👨', rating: 4, date: '1 week ago', comment: 'Great lock, but a bit heavy to carry around.', helpful: 12 },
      { name: 'Emma L.', avatar: '👧', rating: 5, date: '2 weeks ago', comment: "Best bike lock I've owned. Worth every point!", helpful: 18 },
    ],
  },
  {
    id: 2,
    name: 'Reusable Water Bottle',
    description: 'Stainless steel, 750ml insulated bottle',
    fullDescription:
      'Stay hydrated sustainably with this premium stainless steel water bottle. Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and dishwasher safe.',
    points: 400,
    category: 'eco',
    image: '💧',
    inStock: true,
    popular: true,
    negotiable: false,
    rating: 4.9,
    reviews: 89,
    features: ['750ml capacity', '24hr cold / 12hr hot', 'BPA-free materials', 'Dishwasher safe'],
    shipping: 'Free shipping • Arrives in 3-5 days',
    seller: { name: 'GreenLife Co', avatar: '🌿', rating: 4.9, totalReviews: 567, verified: true, location: '1.5 km away', distanceKm: 1.5, responseTime: 'Usually responds in 1 hour' },
    userReviews: [
      { name: 'Alex K.', avatar: '🧑', rating: 5, date: '3 days ago', comment: 'Keeps my drinks cold all day! Love it.', helpful: 31 },
    ],
  },
  {
    id: 3,
    name: 'Monthly Coffee Pass',
    description: '30 free coffees at partner cafes',
    fullDescription:
      'Enjoy a full month of free coffee at any of our partner cafes. Valid at 50+ locations across the city. Includes hot and cold beverages up to a regular size.',
    points: 2500,
    category: 'coffee',
    image: '☕',
    inStock: true,
    popular: true,
    negotiable: false,
    rating: 4.8,
    reviews: 203,
    features: ['Valid at 50+ partner cafes', 'Hot and cold beverages', '30-day validity', 'Regular size included'],
    shipping: 'Digital delivery • Instant access',
    seller: { name: 'Local Brew Network', avatar: '☕', rating: 4.6, totalReviews: 198, verified: true, location: '3.2 km away', distanceKm: 3.2, responseTime: 'Usually responds in 3 hours' },
    userReviews: [
      { name: 'Jordan T.', avatar: '🧔', rating: 5, date: '1 day ago', comment: 'Amazing deal! Saved so much on my daily coffee.', helpful: 45 },
      { name: 'Lisa P.', avatar: '👩‍🦰', rating: 5, date: '5 days ago', comment: 'Easy to use and great cafe selection.', helpful: 28 },
    ],
  },
  {
    id: 4,
    name: 'Bike Repair Kit',
    description: 'Complete toolkit for on-the-go repairs',
    fullDescription:
      'Never get stranded again with this comprehensive bike repair kit. Includes everything you need for common roadside repairs.',
    points: 800,
    category: 'bike',
    image: '🔧',
    inStock: true,
    popular: false,
    negotiable: true,
    rating: 4.5,
    reviews: 67,
    features: ['Tire levers & patch kit', 'Multi-tool with 16 functions', 'Mini pump included', 'Compact carry bag'],
    shipping: 'Free shipping • Arrives in 5-7 days',
    seller: { name: 'City Cycles', avatar: '🚲', rating: 4.7, totalReviews: 234, verified: false, location: '5.1 km away', distanceKm: 5.1, responseTime: 'Usually responds in 4 hours' },
    userReviews: [
      { name: 'Tom B.', avatar: '👨‍🔧', rating: 4, date: '3 days ago', comment: 'Good kit, has everything you need for basic repairs.', helpful: 15 },
    ],
  },
  {
    id: 5,
    name: 'Eco Tote Bag Set',
    description: 'Set of 3 organic cotton tote bags',
    fullDescription:
      'Ditch the plastic with this set of 3 beautifully designed organic cotton tote bags. Durable, washable, and stylish.',
    points: 300,
    category: 'eco',
    image: '👜',
    inStock: true,
    popular: false,
    negotiable: true,
    rating: 4.6,
    reviews: 45,
    features: ['100% organic cotton', 'Set of 3 bags', 'Machine washable', 'Various sizes included'],
    shipping: 'Free shipping • Arrives in 3-5 days',
    seller: { name: 'Sustainable Goods', avatar: '🌱', rating: 4.8, totalReviews: 421, verified: true, location: '1.8 km away', distanceKm: 1.8, responseTime: 'Usually responds in 2 hours' },
    userReviews: [
      { name: 'Emma S.', avatar: '👩‍🎨', rating: 5, date: '1 week ago', comment: 'Beautiful and sturdy. Use them every day!', helpful: 22 },
    ],
  },
  {
    id: 6,
    name: 'Gym Day Pass (5-pack)',
    description: '5 day passes to partner fitness centers',
    fullDescription:
      'Access to 20+ partner gyms and fitness centers across the city. Perfect for trying different workout environments.',
    points: 1500,
    category: 'gym',
    image: '💪',
    inStock: true,
    popular: true,
    negotiable: false,
    rating: 4.9,
    reviews: 156,
    features: ['5 day passes included', 'Valid at 20+ gyms', '90-day validity', 'All equipment access'],
    shipping: 'Digital delivery • Instant access',
    seller: { name: 'FitHub Partners', avatar: '🏋️', rating: 4.9, totalReviews: 789, verified: true, location: '0.8 km away', distanceKm: 0.8, responseTime: 'Usually responds in 1 hour' },
    userReviews: [
      { name: 'Chris M.', avatar: '🏃', rating: 5, date: '2 days ago', comment: 'Fantastic value! Tried 4 different gyms already.', helpful: 38 },
      { name: 'Sam W.', avatar: '🧗', rating: 5, date: '4 days ago', comment: 'Great way to explore different fitness options.', helpful: 19 },
    ],
  },
  {
    id: 7,
    name: 'Bookstore Gift Card',
    description: '$25 gift card for local bookstores',
    fullDescription:
      'Support your local literary community with a $25 gift card valid at 15+ independent bookstores in the city.',
    points: 2000,
    category: 'books',
    image: '📚',
    inStock: true,
    popular: false,
    negotiable: false,
    rating: 4.7,
    reviews: 92,
    features: ['$25 value', 'Valid at 15+ bookstores', 'No expiry date', 'Supports local businesses'],
    shipping: 'Digital delivery • Instant access',
    seller: { name: 'Indie Book Collective', avatar: '📖', rating: 4.7, totalReviews: 312, verified: true, location: '4.2 km away', distanceKm: 4.2, responseTime: 'Usually responds in 5 hours' },
    userReviews: [
      { name: 'Rachel G.', avatar: '📚', rating: 5, date: '1 week ago', comment: 'Love supporting local bookshops. Perfect gift!', helpful: 27 },
    ],
  },
  {
    id: 8,
    name: 'Transit Pass (Weekly)',
    description: '7-day unlimited public transport pass',
    fullDescription:
      "Unlimited travel on all city buses, trams, and metro lines for 7 consecutive days. Activate when you're ready.",
    points: 1800,
    category: 'transport',
    image: '🚌',
    inStock: true,
    popular: true,
    negotiable: false,
    rating: 4.6,
    reviews: 178,
    features: ['7 days unlimited travel', 'All buses and metro', 'Flexible activation', 'City-wide coverage'],
    shipping: 'Digital delivery • Instant access',
    seller: { name: 'City Transport', avatar: '🏙️', rating: 4.5, totalReviews: 892, verified: true, location: '1.2 km away', distanceKm: 1.2, responseTime: 'Usually responds in 2 hours' },
    userReviews: [
      { name: 'David L.', avatar: '🚇', rating: 4, date: '3 days ago', comment: 'Great value for a week of commuting.', helpful: 42 },
    ],
  },
  {
    id: 9,
    name: 'Student Meal Vouchers',
    description: '10 meal vouchers for campus dining',
    fullDescription:
      'Keep your energy up with 10 hot meal vouchers redeemable at any campus dining hall or partner restaurant nearby.',
    points: 1000,
    category: 'student',
    image: '🍽️',
    inStock: true,
    popular: false,
    negotiable: false,
    rating: 4.3,
    reviews: 134,
    features: ['10 meal vouchers', 'Valid at campus dining', 'Partner restaurants included', '30-day validity'],
    shipping: 'Digital delivery • Instant access',
    seller: { name: 'Campus Dining', avatar: '🎓', rating: 4.4, totalReviews: 567, verified: true, location: '2.7 km away', distanceKm: 2.7, responseTime: 'Usually responds in 3 hours' },
    userReviews: [
      { name: 'Maya R.', avatar: '👩‍🎓', rating: 4, date: '5 days ago', comment: 'Very convenient, especially during exam season.', helpful: 33 },
    ],
  },
  {
    id: 10,
    name: 'Bamboo Cutlery Set',
    description: 'Travel utensil set with carrying case',
    fullDescription:
      'Say goodbye to single-use plastic with this elegant bamboo cutlery set. Perfect for picnics, office lunches, and travel.',
    points: 250,
    category: 'eco',
    image: '🥢',
    inStock: true,
    popular: false,
    negotiable: true,
    rating: 4.8,
    reviews: 56,
    features: ['Organic bamboo', 'Knife, fork, spoon & chopsticks', 'Linen carry pouch', 'Easy to clean'],
    shipping: 'Free shipping • Arrives in 3-5 days',
    seller: { name: 'EcoWare', avatar: '🌿', rating: 4.8, totalReviews: 234, verified: true, location: '3.5 km away', distanceKm: 3.5, responseTime: 'Usually responds in 2 hours' },
    userReviews: [
      { name: 'Nina J.', avatar: '🌸', rating: 5, date: '2 weeks ago', comment: 'Beautiful quality and feels great to use.', helpful: 14 },
    ],
  },
  {
    id: 11,
    name: 'Bike Lights Set',
    description: 'Front and rear LED safety lights',
    fullDescription:
      'Stay visible and safe on the road with this high-brightness LED light set. USB rechargeable with multiple flash modes.',
    points: 600,
    category: 'bike',
    image: '💡',
    inStock: true,
    popular: true,
    negotiable: true,
    rating: 4.7,
    reviews: 112,
    features: ['Front and rear lights', 'USB rechargeable', '5 light modes', 'Waterproof IPX5'],
    shipping: 'Free shipping • Arrives in 5-7 days',
    seller: { name: 'Night Rider Co', avatar: '🌙', rating: 4.9, totalReviews: 178, verified: false, location: '6.3 km away', distanceKm: 6.3, responseTime: 'Usually responds in 3 hours' },
    userReviews: [
      { name: 'Pete V.', avatar: '🚴', rating: 5, date: '1 week ago', comment: 'Super bright and easy to attach. Love the battery life.', helpful: 29 },
    ],
  },
  {
    id: 12,
    name: 'Coffee Beans (1kg)',
    description: 'Premium organic fair-trade coffee',
    fullDescription:
      'Single-origin organic coffee beans, ethically sourced and freshly roasted. Rich, smooth flavor with notes of chocolate and caramel.',
    points: 900,
    category: 'coffee',
    image: '☕',
    inStock: true,
    popular: false,
    negotiable: false,
    rating: 4.8,
    reviews: 78,
    features: ['Single-origin beans', 'Fair-trade certified', 'Freshly roasted', 'Resealable bag'],
    shipping: 'Free shipping • Arrives in 3-5 days',
    seller: { name: 'Bean There Coffee', avatar: '☕', rating: 4.8, totalReviews: 345, verified: true, location: '2.1 km away', distanceKm: 2.1, responseTime: 'Usually responds in 2 hours' },
    userReviews: [
      { name: 'Sophie L.', avatar: '👩‍🍳', rating: 5, date: '4 days ago', comment: "Best coffee I've had. The flavor is incredible!", helpful: 21 },
    ],
  },
];
