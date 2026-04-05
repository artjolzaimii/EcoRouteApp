import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Download, Share2, Leaf, MapPin, DollarSign, Award } from "lucide-react";

const dailyCO2Data = [
  { day: "1", value: 0.8 },
  { day: "5", value: 1.2 },
  { day: "10", value: 0.9 },
  { day: "15", value: 1.5 },
  { day: "20", value: 1.3 },
  { day: "25", value: 1.1 },
  { day: "30", value: 1.4 },
];

export default function MonthlyReportScreen() {
  const navigate = useNavigate();
  const maxValue = Math.max(...dailyCO2Data.map(d => d.value));

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-[#F1EFE8] flex flex-col overflow-y-auto">
      {/* Status Bar */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pt-3 pb-2 flex items-center justify-between text-sm text-white">
        <span className="font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 border border-white rounded-sm relative">
            <div className="absolute inset-0.5 bg-white rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/impact")}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-white text-xl font-bold">March 2026</h1>
          <div className="w-10" />
        </div>

        {/* Hero Stat */}
        <div className="text-center">
          <p className="text-white/80 mb-2">Total CO₂ saved</p>
          <p className="text-white text-6xl font-bold mb-2">34.2 kg</p>
          <div className="flex items-center justify-center gap-2 text-white/90">
            <div className="w-6 h-1 bg-white/30 rounded-full" />
            <span className="text-sm font-semibold">↑ 18% from last month</span>
            <div className="w-6 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: MapPin, value: "42", label: "Trips" },
            { icon: Leaf, value: "156 km", label: "Distance" },
            { icon: DollarSign, value: "$87", label: "Saved" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-lg text-center"
            >
              <div className="flex justify-center mb-2">
                <stat.icon className="w-6 h-6 text-[#2D8653]" />
              </div>
              <p className="text-[#1A1A1A] font-bold text-lg mb-1">{stat.value}</p>
              <p className="text-gray-600 text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Equivalent Impact */}
      <div className="px-6 mb-6">
        <h2 className="text-[#1A1A1A] font-bold text-lg mb-4">Environmental equivalent</h2>
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-2xl">
                🌳
              </div>
              <div>
                <p className="text-[#1A1A1A] font-bold">12 trees planted</p>
                <p className="text-gray-600 text-sm">CO₂ absorption equivalent</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl">
                🚗
              </div>
              <div>
                <p className="text-[#1A1A1A] font-bold">85 km avoided</p>
                <p className="text-gray-600 text-sm">Car trips equivalent</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-2xl">
                ✈️
              </div>
              <div>
                <p className="text-[#1A1A1A] font-bold">0.08 flights</p>
                <p className="text-gray-600 text-sm">Short-haul flight equivalent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badge */}
      <div className="px-6 mb-6">
        <h2 className="text-[#1A1A1A] font-bold text-lg mb-4">This month's badge</h2>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 shadow-lg text-center">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Award className="w-12 h-12 text-white" />
            </div>
          </div>
          <p className="text-white font-bold text-xl mb-1">Eco Champion</p>
          <p className="text-white/80 text-sm">Saved over 30kg CO₂ this month</p>
        </div>
      </div>

      {/* Chart */}
      <div className="px-6 mb-6">
        <h2 className="text-[#1A1A1A] font-bold text-lg mb-4">Daily CO₂ trend</h2>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-end justify-between h-40 gap-2">
            {dailyCO2Data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.value / maxValue) * 100}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full bg-[#2D8653] rounded-t-lg"
                />
                <span className="text-gray-600 text-xs">{item.day}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 text-sm mt-4">March 2026</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-8 space-y-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white text-[#2D8653] py-4 rounded-2xl font-bold border-2 border-[#2D8653] active:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download PDF
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share Report
        </motion.button>
      </div>
    </div>
  );
}
