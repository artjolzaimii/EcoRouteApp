import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Clock,
  Leaf,
  Navigation2,
  TrendingUp,
  AlertCircle,
  Bike,
  Bus,
  Footprints,
  Zap,
  X,
  Gift,
  ArrowRight,
} from "lucide-react";

export default function RoutesScreen() {
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null);

  const routes = [
    {
      id: 0,
      name: "Eco-Optimal",
      mode: "bike",
      icon: Bike,
      distance: "5.2 km",
      duration: "18 min",
      co2Saved: "1.2 kg",
      calories: "145 kcal",
      difficulty: "Moderate",
      rating: "Best",
      color: "emerald",
      highlights: ["Protected bike lanes", "Scenic route", "Low traffic"],
    },
    {
      id: 1,
      name: "Transit Mix",
      mode: "transit",
      icon: Bus,
      distance: "5.4 km",
      duration: "22 min",
      co2Saved: "0.9 kg",
      calories: "45 kcal",
      difficulty: "Easy",
      rating: "Good",
      color: "blue",
      highlights: ["Express bus", "2 min wait", "Air conditioned"],
    },
    {
      id: 2,
      name: "Walking Path",
      mode: "walk",
      icon: Footprints,
      distance: "4.8 km",
      duration: "58 min",
      co2Saved: "1.3 kg",
      calories: "320 kcal",
      difficulty: "Active",
      rating: "Great",
      color: "amber",
      highlights: ["Park route", "Shaded paths", "Coffee stops"],
    },
  ];

  // Eco-Partner map pins
  const ecoPartners = [
    {
      id: 1,
      name: "Sustainable Smoothies",
      logo: "🥤",
      offer: "15% off",
      distance: "85m from route",
      description: "100% organic smoothies with reusable cups",
      points: 60,
      position: { top: "35%", left: "45%" }
    },
    {
      id: 2,
      name: "Green Coffee Co.",
      logo: "☕",
      offer: "Free coffee",
      distance: "On your route",
      description: "Organic fair-trade coffee shop using 100% renewable energy",
      points: 50,
      position: { top: "65%", left: "70%" }
    }
  ];

  // Sponsored Eco-Partner card data
  const sponsoredPartner = {
    logo: "🌿",
    name: "Plant Power Café",
    headline: "Stop at Plant Power — earn 50 bonus points",
    distance: "120m",
    offer: "Free plant-based snack",
    description: "Vegan café powered by solar energy",
    points: 50,
  };

  const selectedRouteData = routes[selectedRoute];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Map Area */}
      <div className="relative h-[45%] bg-gradient-to-br from-emerald-100 to-blue-100">
        {/* Simplified Map Illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-full h-full"
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid lines for map feel */}
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="0.5"
                  opacity="0.1"
                />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#grid)" />

            {/* Route paths */}
            <path
              d="M 50 250 Q 150 200, 200 150 T 350 50"
              stroke="#10b981"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8 4"
              opacity="0.3"
            />
            <path
              d="M 50 250 Q 120 180, 200 150 T 350 50"
              stroke="#10b981"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />

            {/* Start marker */}
            <circle cx="50" cy="250" r="12" fill="#10b981" />
            <circle cx="50" cy="250" r="6" fill="white" />

            {/* End marker */}
            <circle cx="350" cy="50" r="12" fill="#ef4444" />
            <circle cx="350" cy="50" r="6" fill="white" />
          </svg>
        </div>

        {/* Eco-Partner Map Pins */}
        {ecoPartners.map((partner, index) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
            className="absolute z-20"
            style={partner.position}
          >
            <div className="relative flex flex-col items-center">
              {/* Floating Card */}
              <motion.button
                onClick={() => setSelectedPartner(partner.id)}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-xl shadow-lg px-2.5 py-1.5 mb-1 flex items-center gap-1.5 border border-emerald-100 active:shadow-xl transition-shadow"
              >
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs">
                  {partner.logo}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-gray-900 leading-tight">
                    {partner.name}
                  </p>
                  <span className="inline-block bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1 py-0.5 rounded">
                    {partner.offer}
                  </span>
                </div>
              </motion.button>
              {/* Pin Tail */}
              <div className="w-0.5 h-2 bg-emerald-600 rounded-full" />
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
            </div>
          </motion.div>
        ))}

        {/* Top Bar */}
        <div className="absolute top-4 left-0 right-0 px-6 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                <Navigation2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-semibold text-sm">Home → Office</p>
                <p className="text-gray-500 text-xs">3 routes available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Impact Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 right-6 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg z-10"
        >
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-500">Today</p>
              <p className="text-sm font-bold text-emerald-600">+3.8 kg saved</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Route Options */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-6 relative z-10 shadow-2xl overflow-y-auto">
        <div className="px-6 pt-6 pb-4">
          {/* Handle */}
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

          <h2 className="text-gray-900 font-bold text-xl mb-4">
            Choose Your Route
          </h2>

          {/* Route Cards */}
          <div className="space-y-3 mb-6">
            {routes.map((route, index) => {
              const isSelected = selectedRoute === index;
              const Icon = route.icon;

              return (
                <motion.button
                  key={route.id}
                  onClick={() => setSelectedRoute(index)}
                  className={`w-full rounded-2xl border-2 p-4 transition-all text-left ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-600 shadow-md"
                      : "bg-gray-50 border-gray-200 active:bg-gray-100"
                  }`}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isSelected ? "bg-emerald-600" : "bg-white"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            isSelected ? "text-white" : "text-gray-600"
                          }`}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div>
                        <h3
                          className={`font-semibold text-base mb-1 ${
                            isSelected ? "text-emerald-900" : "text-gray-900"
                          }`}
                        >
                          {route.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {route.distance}
                          </span>
                          <span className="text-gray-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {route.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        route.rating === "Best"
                          ? "bg-emerald-100 text-emerald-700"
                          : route.rating === "Great"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {route.rating}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Leaf className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-600">
                        {route.co2Saved}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-gray-600">{route.calories}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{route.difficulty}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pt-3 border-t border-emerald-200"
                    >
                      <div className="flex flex-wrap gap-2">
                        {route.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className="text-xs bg-white text-emerald-700 px-2 py-1 rounded-full border border-emerald-200"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Sponsored Eco-Partner Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 p-4 mb-6 relative overflow-hidden"
          >
            {/* Eco-Partner badge */}
            <div className="absolute top-3 right-3">
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200">
                Eco-Partner
              </span>
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0 border border-emerald-100">
                {sponsoredPartner.logo}
              </div>
              <div className="flex-1 pr-16">
                <h3 className="text-gray-900 font-bold text-base mb-1">
                  {sponsoredPartner.headline}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {sponsoredPartner.distance} from route
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full border border-emerald-200">
                    <Gift className="w-3 h-3" />
                    {sponsoredPartner.offer}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-700">
                  +{sponsoredPartner.points} bonus points
                </span>
              </div>
              <button className="flex items-center gap-1 text-emerald-700 font-semibold text-sm active:scale-95 transition-transform">
                Add stop
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Start Navigation Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:bg-emerald-700 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <Navigation2 className="w-5 h-5" />
              Start Navigation
            </div>
          </motion.button>
        </div>
      </div>

      {/* Eco-Partner Bottom Sheet */}
      <AnimatePresence>
        {selectedPartner !== null && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedPartner(null)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto"
            >
              <div className="bg-white rounded-t-3xl shadow-2xl">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="px-6 pb-8">
                  {ecoPartners
                    .filter((p) => p.id === selectedPartner)
                    .map((partner) => (
                      <div key={partner.id}>
                        {/* Close button */}
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() => setSelectedPartner(null)}
                            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:bg-gray-200"
                          >
                            <X className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                            {partner.logo}
                          </div>
                          <div className="flex-1">
                            <span className="inline-block text-emerald-600 text-xs font-semibold mb-1">
                              Eco-Partner
                            </span>
                            <h3 className="text-gray-900 font-bold text-xl mb-1">
                              {partner.name}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {partner.distance}
                            </p>
                          </div>
                        </div>

                        <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Gift className="w-5 h-5 text-emerald-600" />
                            <span className="text-emerald-900 font-bold text-lg">
                              {partner.offer}
                            </span>
                          </div>
                          <p className="text-emerald-700 text-sm">
                            {partner.description}
                          </p>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Zap className="w-5 h-5 text-emerald-600" />
                              <div>
                                <p className="text-gray-900 font-semibold">
                                  Earn +{partner.points} points
                                </p>
                                <p className="text-gray-600 text-xs">
                                  When you visit on this route
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg active:bg-emerald-700"
                        >
                          Earn with this route
                        </motion.button>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}