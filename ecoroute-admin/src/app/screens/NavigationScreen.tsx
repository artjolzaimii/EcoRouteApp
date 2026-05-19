import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Bike, X } from "lucide-react";

export default function NavigationScreen() {
  const navigate = useNavigate();
  const [progress] = useState(45); // Route progress percentage

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-white flex flex-col">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/30 to-transparent px-6 pt-3 pb-8 flex items-center justify-between text-sm text-white">
        <span className="font-medium drop-shadow">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 border border-white rounded-sm relative">
            <div className="absolute inset-0.5 bg-white rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="flex-1 bg-gradient-to-br from-emerald-100 to-blue-100 relative">
        {/* Map grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="nav-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10b981" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#nav-map-grid)" />
        </svg>

        {/* Active route path */}
        <svg className="absolute inset-0 w-full h-full">
          <path
            d="M 215 700 L 215 500 L 250 300 L 280 150"
            stroke="#2D8653"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          {/* User position marker */}
          <circle cx="215" cy="500" r="12" fill="#2D8653" stroke="white" strokeWidth="3" />
        </svg>

        {/* Instruction Card */}
        <div className="absolute top-20 left-4 right-4 z-10">
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#2D8653] rounded-2xl flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-9 h-9 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-[#1A1A1A] text-2xl font-bold">
                  Turn left onto Green Street
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-lg font-semibold">
              In 120m
            </p>
          </motion.div>
        </div>

        {/* Current Mode Pill */}
        <div className="absolute top-64 left-4 z-10">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2"
          >
            <Bike className="w-5 h-5 text-[#2D8653]" />
            <span className="text-[#1A1A1A] font-semibold text-sm">Cycling</span>
          </motion.div>
        </div>

        {/* Bottom Panel */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-t-3xl shadow-2xl p-6"
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm font-medium">Route progress</span>
                <span className="text-[#2D8653] text-sm font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-[#2D8653] rounded-full"
                />
              </div>
            </div>

            {/* Next Step Preview */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-gray-600 text-sm mb-1">Next step</p>
              <p className="text-[#1A1A1A] font-semibold">
                Continue on Green Street for 800m
              </p>
            </div>

            {/* Live CO2 Counter */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-4 mb-4 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">CO₂ saved so far</p>
                  <p className="text-[#2D8653] text-2xl font-bold">0.6 kg</p>
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center"
                >
                  🌱
                </motion.div>
              </div>
            </div>

            {/* End Route Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/trip-completed")}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg active:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              End Route
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
