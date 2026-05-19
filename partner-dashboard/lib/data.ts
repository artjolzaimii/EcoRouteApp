import type { Product, Order, ActivityItem, Category } from './types'

export const PRODUCTS: Product[] = [
  {
    id: 1, title: 'Refurbished City Bike',
    cat: 'bike', catLabel: 'Bike',
    glyph: 'BIKE / REFURB / 21-SPEED',
    payment: 'both', money: 240, points: 2400, stock: 8,
    status: 'active', negotiable: true,
    desc: 'Restored aluminum frame, new brake pads, LED lights, helmet included.',
    updated: '2 days ago',
  },
  {
    id: 2, title: 'Monthly Coffee Pass',
    cat: 'coffee', catLabel: 'Coffee',
    glyph: 'COFFEE / 30-CUPS',
    payment: 'points', money: 0, points: 1500, stock: 50,
    status: 'active', negotiable: false,
    desc: '30 free coffees at any of our 8 partner cafés across the city.',
    updated: '5 days ago',
  },
  {
    id: 3, title: 'Bike Tune-Up Service',
    cat: 'repair', catLabel: 'Repair Services',
    glyph: 'SERVICE / 60-MIN',
    payment: 'both', money: 45, points: 800, stock: 999,
    status: 'active', negotiable: false,
    desc: 'Full bike inspection, brake adjustment, gear tuning and chain lube.',
    updated: 'Yesterday',
  },
  {
    id: 4, title: 'Stainless Reusable Bottle',
    cat: 'reuse', catLabel: 'Reusable Items',
    glyph: 'BOTTLE / 750ML',
    payment: 'both', money: 28, points: 500, stock: 124,
    status: 'active', negotiable: false,
    desc: 'Double-wall insulated 750ml bottle in matte sage. Lifetime warranty.',
    updated: '1 week ago',
  },
  {
    id: 5, title: 'Weekly Transit Pass',
    cat: 'transit', catLabel: 'Transit',
    glyph: 'TRANSIT / 7-DAY',
    payment: 'points', money: 0, points: 950, stock: 200,
    status: 'active', negotiable: false,
    desc: '7 days of unlimited rides on city buses, trams and the metro.',
    updated: '3 days ago',
  },
  {
    id: 6, title: 'Organic Hemp Tote',
    cat: 'fashion', catLabel: 'Sustainable Fashion',
    glyph: 'TOTE / HEMP / NATURAL',
    payment: 'money', money: 18, points: 0, stock: 0,
    status: 'out', negotiable: false,
    desc: 'Heavy-duty 100% organic hemp tote, undyed natural finish.',
    updated: '4 days ago',
  },
  {
    id: 7, title: 'E-Scooter Day Rental',
    cat: 'scooter', catLabel: 'Scooter',
    glyph: 'SCOOTER / 24H',
    payment: 'both', money: 22, points: 450, stock: 12,
    status: 'active', negotiable: true,
    desc: '24-hour rental, includes helmet and full charge. Free swap stations.',
    updated: 'Today',
  },
  {
    id: 8, title: 'Beeswax Food Wraps',
    cat: 'eco', catLabel: 'Eco Products',
    glyph: 'WRAP / 3-PACK',
    payment: 'both', money: 14, points: 280, stock: 60,
    status: 'draft', negotiable: false,
    desc: 'Set of three reusable wraps in sizes S/M/L. Washable for up to a year.',
    updated: 'Just now',
  },
]

export const ORDERS: Order[] = [
  { id: 'EC-7281', customer: 'Maria Santos',   product: 'Refurbished City Bike',    paymentLabel: '€240',          payment: 'money',  status: 'shipped',   date: 'May 10' },
  { id: 'EC-7278', customer: 'Alex Chen',      product: 'Monthly Coffee Pass',      paymentLabel: '1,500 pts',     payment: 'points', status: 'redeemed',  date: 'May 10' },
  { id: 'EC-7274', customer: 'Lena Becker',    product: 'Bike Tune-Up Service',     paymentLabel: '€45',           payment: 'money',  status: 'pending',   date: 'May 9'  },
  { id: 'EC-7270', customer: 'Tomás Iglesias', product: 'Stainless Bottle (750ml)', paymentLabel: '500 pts',       payment: 'points', status: 'redeemed',  date: 'May 9'  },
  { id: 'EC-7263', customer: 'Priya Shah',     product: 'E-Scooter Day Rental',     paymentLabel: '€22 + 100 pts', payment: 'both',   status: 'completed', date: 'May 8'  },
  { id: 'EC-7259', customer: 'Jonas Weber',    product: 'Weekly Transit Pass',      paymentLabel: '950 pts',       payment: 'points', status: 'redeemed',  date: 'May 8'  },
  { id: 'EC-7252', customer: 'Sofia Rossi',    product: 'Bike Tune-Up Service',     paymentLabel: '800 pts',       payment: 'points', status: 'cancelled', date: 'May 7'  },
]

export const ACTIVITY: ActivityItem[] = [
  { kind: 'order', icon: 'cart',     text: 'Maria Santos bought Refurbished City Bike for €240',       time: '2 minutes ago'  },
  { kind: 'eco',   icon: 'sparkles', text: 'Alex Chen redeemed Monthly Coffee Pass for 1,500 pts',     time: '14 minutes ago' },
  { kind: 'amber', icon: 'star',     text: 'New 5★ review on Bike Tune-Up Service',                    time: '1 hour ago'     },
  { kind: 'order', icon: 'pkg',      text: 'Order EC-7263 marked as shipped',                          time: '3 hours ago'    },
  { kind: 'eco',   icon: 'eye',      text: 'E-Scooter Day Rental reached 1,000 views this week',       time: 'Yesterday'      },
  { kind: 'blue',  icon: 'edit',     text: 'You updated Beeswax Food Wraps — saved as draft',          time: 'Yesterday'      },
]

export const CATEGORIES: Category[] = [
  { id: 'all',     label: 'All categories'       },
  { id: 'bike',    label: 'Bike'                 },
  { id: 'scooter', label: 'Scooter'              },
  { id: 'eco',     label: 'Eco Products'         },
  { id: 'coffee',  label: 'Coffee'               },
  { id: 'transit', label: 'Transit'              },
  { id: 'reuse',   label: 'Reusable Items'       },
  { id: 'fashion', label: 'Sustainable Fashion'  },
  { id: 'repair',  label: 'Repair Services'      },
]

export const ECO_TAG_SUGGESTIONS = [
  'Plastic-free', 'Locally sourced', 'Refurbished', 'Vegan', 'Plant-based',
  'Recyclable', 'Compostable', 'Fair trade', 'Carbon neutral', 'Reusable',
]
