import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Leaf, 
  Zap, 
  TrendingUp,
  ChevronRight,
  Bus,
  Bike,
  Car,
  Gift,
  X
} from "lucide-react";

export default function HomeScreen() {
  const [selectedMode, setSelectedMode] = useState<string>("bike");
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null);

  const transportModes = [
    { id: "bike", label: "Bike", icon: Bike, color: "emerald" },
    { id: "bus", label: "Transit", icon: Bus, color: "blue" },
    { id: "ev", label: "EV", icon: Car, color: "purple" },
  ];

  // Eco-Partner map pins data
  const ecoPartners = [
    {
      id: 1,
      name: "Green Coffee Co.",
      logo: "☕",
      offer: "Free coffee",
      distance: "120m from route",
      description: "Organic fair-trade coffee shop using 100% renewable energy",
      points: 50,
      position: { top: "28%", left: "35%" }
    },
    {
      id: 2,
      name: "EcoRide Bike Shop",
      logo: "🚴",
      offer: "10% off",
      distance: "On your route",
      description: "Local bike shop offering repairs and eco-friendly gear",
      points: 75,
      position: { top: "58%", left: "65%" }
    }
  ];

  const quickRoutes = [
    {
      name: "Morning Commute",
      from: "Home",
      to: "Office",
      distance: "5.2 km",
      time: "18 min",
      co2Saved: "1.2 kg",
      mode: "bike",
    },
    {
      name: "Grocery Run",
      from: "Office",
      to: "Whole Foods",
      distance: "2.1 km",
      time: "8 min",
      co2Saved: "0.5 kg",
      mode: "bike",
    },
  ];

  return (
    <div className="min-h-full bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pt-4 pb-8 rounded-b-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-emerald-100 text-sm mb-1">Good morning,</p>
          <h1 className="text-white text-2xl font-bold">Ready to make a difference?</h1>
        </motion.div>

        {/* Today's Impact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/80 text-sm font-medium">Today's Impact</span>
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-semibold">+12%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Leaf, value: "3.8 kg", label: "CO₂ Saved" },
              { icon: Clock, value: "45 min", label: "Active Time" },
              { icon: Zap, value: "280", label: "Points" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-1">
                  <stat.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-white/70 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Transport Mode Selector */}
      <div className="px-6 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-lg"
        >
          <h3 className="text-gray-900 font-semibold mb-3">Travel Mode</h3>
          <div className="flex gap-3">
            {transportModes.map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <motion.button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-600"
                      : "bg-gray-50 border-gray-200 active:bg-gray-100"
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <mode.icon
                    className={`w-6 h-6 mx-auto mb-1 ${
                      isSelected ? "text-emerald-600" : "text-gray-400"
                    }`}
                    strokeWidth={isSelected ? 2.5 : 2}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isSelected ? "text-emerald-700" : "text-gray-600"
                    }`}
                  >
                    {mode.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick Route Input with Map Preview */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Mini Map Preview with Eco-Partner Pins */}
          <div className="relative h-40 bg-gradient-to-br from-emerald-50 to-blue-50 overflow-hidden">
            {/* Simplified map grid */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              <defs>
                <pattern id="map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#10b981" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#map-grid)" />
            </svg>

            {/* Sample route line */}
            <svg className="absolute inset-0 w-full h-full">
              <path
                d="M 30 120 Q 120 80, 200 100 T 370 40"
                stroke="#10b981"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.4"
              />
            </svg>

            {/* Eco-Partner Map Pins */}
            {ecoPartners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                className="absolute"
                style={partner.position}
              >
                {/* Pin Point */}
                <div className="relative flex flex-col items-center">
                  {/* Floating Card */}
                  <motion.button
                    onClick={() => setSelectedPartner(partner.id)}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white rounded-xl shadow-lg px-3 py-2 mb-1 flex items-center gap-2 border border-emerald-100 active:shadow-xl transition-shadow"
                  >
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-sm">
                      {partner.logo}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-900 leading-tight">
                        {partner.name}
                      </p>
                      <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">
                        {partner.offer}
                      </span>
                    </div>
                  </motion.button>
                  {/* Pin Tail */}
                  <div className="w-1 h-3 bg-emerald-600 rounded-full" />
                  <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 bg-emerald-600 rounded-full" />
              </div>
              <input
                type="text"
                placeholder="Current location"
                className="flex-1 text-gray-900 placeholder:text-gray-400 outline-none"
                defaultValue="Home"
              />
            </div>
            <div className="pl-4 border-l-2 border-dashed border-gray-200 ml-4 h-6" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-red-600" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Where to?"
                className="flex-1 text-gray-900 placeholder:text-gray-400 outline-none"
              />
            </div>
          </div>
          <button className="w-full bg-emerald-600 text-white py-4 font-semibold active:bg-emerald-700 transition-colors">
            <div className="flex items-center justify-center gap-2">
              <Navigation className="w-5 h-5" />
              Find Eco-Route
            </div>
          </button>
        </motion.div>
      </div>

      {/* Quick Routes */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 font-bold text-lg">Quick Routes</h2>
          <button className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {quickRoutes.map((route, index) => (
            <motion.button
              key={route.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="w-full bg-white rounded-2xl p-4 shadow-sm active:shadow-md active:scale-[0.99] transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-gray-900 font-semibold text-base mb-1">
                    {route.name}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {route.from} → {route.to}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Bike className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {route.distance}
                </span>
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {route.time}
                </span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1 ml-auto">
                  <Leaf className="w-4 h-4" />
                  {route.co2Saved}
                </span>
              </div>
            </motion.button>
          ))}
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