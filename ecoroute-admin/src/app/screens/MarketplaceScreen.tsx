import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ShoppingBag,
  Search,
  Bike,
  Leaf,
  Coffee,
  Book,
  Dumbbell,
  Bus,
  GraduationCap,
  Sparkles,
  MapPin,
  SlidersHorizontal,
  Star,
  MessageCircle,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";

const categories = [
  { id: "all", label: "All", icon: ShoppingBag },
  { id: "bike", label: "Bike", icon: Bike },
  { id: "eco", label: "Eco", icon: Leaf },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "books", label: "Books", icon: Book },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "transport", label: "Transport", icon: Bus },
  { id: "student", label: "Student", icon: GraduationCap },
];

const products = [
  {
    id: 1,
    name: "Premium Bike Lock",
    description: "Heavy-duty U-lock with mounting bracket",
    points: 1200,
    category: "bike",
    image: "🔒",
    inStock: true,
    popular: true,
    seller: {
      name: "EcoGear Store",
      rating: 4.8,
      verified: true,
      location: "2.3 km away",
    },
    rating: 4.7,
    reviews: 124,
    negotiable: true,
  },
  {
    id: 2,
    name: "Reusable Water Bottle",
    description: "Stainless steel, 750ml insulated bottle",
    points: 400,
    category: "eco",
    image: "💧",
    inStock: true,
    popular: true,
    seller: {
      name: "GreenLife Co",
      rating: 4.9,
      verified: true,
      location: "1.5 km away",
    },
    rating: 4.9,
    reviews: 89,
    negotiable: false,
  },
  {
    id: 3,
    name: "Monthly Coffee Pass",
    description: "30 free coffees at partner cafes",
    points: 2500,
    category: "coffee",
    image: "☕",
    inStock: true,
    popular: true,
    seller: {
      name: "Local Brew Network",
      rating: 4.6,
      verified: true,
      location: "3.2 km away",
    },
    rating: 4.8,
    reviews: 203,
    negotiable: false,
  },
  {
    id: 4,
    name: "Bike Repair Kit",
    description: "Complete toolkit for on-the-go repairs",
    points: 800,
    category: "bike",
    image: "🔧",
    inStock: true,
    popular: false,
    seller: {
      name: "City Cycles",
      rating: 4.7,
      verified: false,
      location: "5.1 km away",
    },
    rating: 4.5,
    reviews: 67,
    negotiable: true,
  },
  {
    id: 5,
    name: "Eco Tote Bag Set",
    description: "Set of 3 organic cotton tote bags",
    points: 300,
    category: "eco",
    image: "👜",
    inStock: true,
    popular: false,
    seller: {
      name: "Sustainable Goods",
      rating: 4.8,
      verified: true,
      location: "1.8 km away",
    },
    rating: 4.6,
    reviews: 45,
    negotiable: true,
  },
  {
    id: 6,
    name: "Gym Day Pass (5-pack)",
    description: "5 day passes to partner fitness centers",
    points: 1500,
    category: "gym",
    image: "💪",
    inStock: true,
    popular: true,
    seller: {
      name: "FitHub Partners",
      rating: 4.9,
      verified: true,
      location: "0.8 km away",
    },
    rating: 4.9,
    reviews: 156,
    negotiable: false,
  },
  {
    id: 7,
    name: "Bookstore Gift Card",
    description: "$25 gift card for local bookstores",
    points: 2000,
    category: "books",
    image: "📚",
    inStock: true,
    popular: false,
    seller: {
      name: "Indie Book Collective",
      rating: 4.7,
      verified: true,
      location: "4.2 km away",
    },
    rating: 4.7,
    reviews: 92,
    negotiable: false,
  },
  {
    id: 8,
    name: "Transit Pass (Weekly)",
    description: "7-day unlimited public transport pass",
    points: 1800,
    category: "transport",
    image: "🚌",
    inStock: true,
    popular: true,
    seller: {
      name: "City Transport",
      rating: 4.5,
      verified: true,
      location: "1.2 km away",
    },
    rating: 4.6,
    reviews: 178,
    negotiable: false,
  },
  {
    id: 9,
    name: "Student Meal Vouchers",
    description: "10 meal vouchers for campus dining",
    points: 1000,
    category: "student",
    image: "🍽️",
    inStock: true,
    popular: false,
    seller: {
      name: "Campus Dining",
      rating: 4.4,
      verified: true,
      location: "2.7 km away",
    },
    rating: 4.3,
    reviews: 134,
    negotiable: false,
  },
  {
    id: 10,
    name: "Bamboo Cutlery Set",
    description: "Travel utensil set with carrying case",
    points: 250,
    category: "eco",
    image: "🥢",
    inStock: true,
    popular: false,
    seller: {
      name: "EcoWare",
      rating: 4.8,
      verified: true,
      location: "3.5 km away",
    },
    rating: 4.8,
    reviews: 56,
    negotiable: true,
  },
  {
    id: 11,
    name: "Bike Lights Set",
    description: "Front and rear LED safety lights",
    points: 600,
    category: "bike",
    image: "💡",
    inStock: true,
    popular: true,
    seller: {
      name: "Night Rider Co",
      rating: 4.9,
      verified: false,
      location: "6.3 km away",
    },
    rating: 4.7,
    reviews: 112,
    negotiable: true,
  },
  {
    id: 12,
    name: "Coffee Beans (1kg)",
    description: "Premium organic fair-trade coffee",
    points: 900,
    category: "coffee",
    image: "☕",
    inStock: true,
    popular: false,
    seller: {
      name: "Bean There Coffee",
      rating: 4.8,
      verified: true,
      location: "2.1 km away",
    },
    rating: 4.8,
    reviews: 78,
    negotiable: false,
  },
];

export default function MarketplaceScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"popular" | "points" | "distance">("popular");

  const userPoints = 2840;

  let filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || product.category === activeCategory;
    const matchesLocation =
      !showNearbyOnly || parseFloat(product.seller.location) <= 3;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "popular") return b.reviews - a.reviews;
    if (sortBy === "points") return a.points - b.points;
    if (sortBy === "distance")
      return parseFloat(a.seller.location) - parseFloat(b.seller.location);
    return 0;
  });

  return (
    <div className="min-h-full bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pt-6 pb-12 rounded-b-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-6 h-6 text-white" />
            <h1 className="text-white text-2xl font-bold">Marketplace</h1>
          </div>
          <p className="text-emerald-100 text-sm">
            Redeem points for eco-friendly products
          </p>
        </motion.div>

        {/* Points Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Available Points</p>
              <p className="text-white text-3xl font-bold">
                {userPoints.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Bar with Filters */}
      <div className="px-6 -mt-8 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl shadow-lg border-0 text-gray-900 placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl shadow-lg p-4 space-y-4"
            >
              <div>
                <label className="text-gray-700 text-sm font-semibold mb-2 block">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy("popular")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold ${
                      sortBy === "popular"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Popular
                  </button>
                  <button
                    onClick={() => setSortBy("points")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold ${
                      sortBy === "points"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Points
                  </button>
                  <button
                    onClick={() => setSortBy("distance")}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold ${
                      sortBy === "distance"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Nearest
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-gray-700 text-sm font-semibold">
                    Available Near You (within 3km)
                  </span>
                </div>
                <button
                  onClick={() => setShowNearbyOnly(!showNearbyOnly)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    showNearbyOnly ? "bg-emerald-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      showNearbyOnly ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Category Filter */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;

            return (
              <motion.button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-white text-gray-700 active:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                <span className="text-sm font-semibold">{category.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-6 grid grid-cols-2 gap-4">
        {filteredProducts.map((product, index) => {
          const canAfford = userPoints >= product.points;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                !canAfford ? "opacity-60" : ""
              }`}
            >
              {/* Product Image */}
              <div
                onClick={() => navigate(`/marketplace/product/${product.id}`)}
                className="bg-gradient-to-br from-emerald-50 to-emerald-100 aspect-square flex items-center justify-center text-6xl relative active:scale-95 transition-transform"
              >
                {product.image}
                {product.popular && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Popular
                  </div>
                )}
                {product.seller.verified && (
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1">
                    <BadgeCheck className="w-4 h-4" fill="currentColor" />
                  </div>
                )}
                {product.negotiable && (
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Negotiable
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div
                  onClick={() => navigate(`/marketplace/product/${product.id}`)}
                  className="active:opacity-70"
                >
                  <h3 className="text-gray-900 font-bold text-sm mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-xs mb-2 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Rating & Location */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star
                        className="w-3 h-3 text-yellow-500"
                        fill="currentColor"
                      />
                      <span className="text-xs text-gray-700 font-semibold">
                        {product.rating}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({product.reviews})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {product.seller.location}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold text-sm">
                        {product.points}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/marketplace/product/${product.id}`)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold ${
                      canAfford
                        ? "bg-emerald-600 text-white active:bg-emerald-700"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/marketplace/chat/${product.seller.name}`)}
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center active:bg-gray-200"
                  >
                    <MessageCircle className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-2">
            No products found
          </h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your search or filter
          </p>
        </div>
      )}
    </div>
  );
}
