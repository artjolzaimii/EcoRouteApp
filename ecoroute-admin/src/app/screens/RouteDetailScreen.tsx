import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Navigation, Leaf, Clock, DollarSign, FootprintsIcon as Walk, Bike, Train } from "lucide-react";

const routeSteps = [
  {
    id: 1,
    mode: "walk",
    icon: Walk,
    instruction: "Walk to Green Street Station",
    distance: "280m",
    duration: "4 min",
    co2: "0g",
    color: "blue",
  },
  {
    id: 2,
    mode: "bike",
    icon: Bike,
    instruction: "Cycle via Eco Lane",
    distance: "3.2km",
    duration: "12 min",
    co2: "0g",
    color: "emerald",
  },
  {
    id: 3,
    mode: "metro",
    icon: Train,
    instruction: "Metro Line 2 - 2 stops",
    distance: "1.8km",
    duration: "6 min",
    co2: "45g",
    color: "purple",
  },
  {
    id: 4,
    mode: "walk",
    icon: Walk,
    instruction: "Walk to destination",
    distance: "150m",
    duration: "2 min",
    co2: "0g",
    color: "blue",
  },
];

export default function RouteDetailScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-white flex flex-col">
      {/* Status Bar */}
      <div className="bg-white px-6 pt-3 pb-2 flex items-center justify-between text-sm">
        <span className="font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 border border-gray-800 rounded-sm relative">
            <div className="absolute inset-0.5 bg-gray-800 rounded-[1px]" />
          </div>
          <div className="w-4 h-3 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 8L2.5 6.5L4.5 8.5L7.5 5.5L9 7L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="w-4 h-3 flex items-center justify-center">
            <svg width="16" height="12" viewBox="0 0 16 12">
              <path d="M2 6C2 4.5 3.5 3 5.5 3C6.5 3 7.5 3.5 8 4M8 4C8.5 3.5 9.5 3 10.5 3C12.5 3 14 4.5 14 6M8 4V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="h-1/2 bg-gradient-to-br from-emerald-50 to-blue-50 relative">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/routes")}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </motion.button>
        </div>

        {/* Simplified map grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="detail-map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#10b981" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#detail-map-grid)" />
        </svg>

        {/* Route path */}
        <svg className="absolute inset-0 w-full h-full">
          <path
            d="M 50 300 L 150 200 L 250 180 L 350 100"
            stroke="#10b981"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="8 4"
          />
        </svg>

        {/* Start/End markers */}
        <div className="absolute" style={{ top: "75%", left: "12%" }}>
          <div className="w-4 h-4 bg-[#2D8653] rounded-full border-2 border-white shadow-lg" />
        </div>
        <div className="absolute" style={{ top: "25%", right: "15%" }}>
          <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg" />
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-2xl flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Journey Breakdown */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <h2 className="text-[#1A1A1A] text-xl font-bold mb-4">Journey breakdown</h2>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            {routeSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex gap-4">
                  {/* Icon Column */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 bg-${step.color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 text-${step.color}-600`} strokeWidth={2} />
                    </div>
                    {index < routeSteps.length - 1 && (
                      <div className="w-px h-12 bg-gray-200 my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <p className="text-[#1A1A1A] font-semibold mb-1">
                      {step.instruction}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      <span>{step.distance}</span>
                      <span>•</span>
                      <span>{step.duration}</span>
                    </div>
                    <div className="inline-block">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        step.co2 === "0g" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {step.co2} CO₂
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-4 border border-emerald-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <Leaf className="w-5 h-5 text-[#2D8653]" />
                </div>
                <p className="text-[#1A1A1A] font-bold">45g</p>
                <p className="text-gray-600 text-xs">Total CO₂</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <Clock className="w-5 h-5 text-[#2D8653]" />
                </div>
                <p className="text-[#1A1A1A] font-bold">24 min</p>
                <p className="text-gray-600 text-xs">Total Time</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <DollarSign className="w-5 h-5 text-[#2D8653]" />
                </div>
                <p className="text-[#1A1A1A] font-bold">$2.50</p>
                <p className="text-gray-600 text-xs">Total Cost</p>
              </div>
            </div>
          </div>
        </div>

        {/* Start Route Button */}
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/navigation")}
            className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors flex items-center justify-center gap-2"
          >
            <Navigation className="w-5 h-5" />
            Start Route
          </motion.button>
        </div>
      </div>
    </div>
  );
}
