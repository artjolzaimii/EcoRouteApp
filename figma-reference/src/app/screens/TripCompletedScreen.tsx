import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { CheckCircle2, Leaf, Zap, MapPin, Clock } from "lucide-react";
import confetti from "canvas-confetti";

export default function TripCompletedScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    // Confetti animation on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#2D8653", "#10b981", "#34d399"],
    });
  }, []);

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-[#F1EFE8] flex flex-col">
      {/* Status Bar */}
      <div className="bg-[#F1EFE8] px-6 pt-3 pb-2 flex items-center justify-between text-sm">
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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center mb-6"
          >
            <div className="w-32 h-32 bg-[#2D8653] rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-20 h-20 text-white" strokeWidth={2} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[#1A1A1A] text-3xl font-bold mb-4"
          >
            Trip completed!
          </motion.h1>

          {/* CO2 Saved Highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl p-6 shadow-lg mb-6"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Leaf className="w-8 h-8 text-[#2D8653]" />
              <p className="text-5xl font-bold text-[#2D8653]">1.2 kg</p>
            </div>
            <p className="text-gray-600 text-lg">CO₂ saved</p>
          </motion.div>

          {/* Points Earned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-4 border border-emerald-100 mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-6 h-6 text-[#2D8653]" />
              <p className="text-2xl font-bold text-[#2D8653]">+85</p>
            </div>
            <p className="text-gray-600">Green Points earned</p>
          </motion.div>

          {/* Journey Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-4 shadow-lg mb-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-[#1A1A1A] font-bold">5.4 km</p>
                <p className="text-gray-600 text-sm">Distance</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-[#1A1A1A] font-bold">24 min</p>
                <p className="text-gray-600 text-sm">Duration</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-600 text-sm">Mode combination</p>
              <p className="text-[#1A1A1A] font-semibold">Walk • Bike • Metro</p>
            </div>
          </motion.div>

          {/* Motivational Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-gray-600 text-lg mb-8"
          >
            Every green trip counts! 🌍
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/impact")}
              className="w-full bg-white text-[#2D8653] py-4 rounded-2xl font-bold border-2 border-[#2D8653] active:bg-gray-50 transition-colors"
            >
              View Impact
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/home")}
              className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors"
            >
              Back to Home
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
