import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, MapPin, Clock, TrendingUp } from "lucide-react";

const recentSearches = [
  { id: 1, from: "Home", to: "Office", time: "2 hours ago" },
  { id: 2, from: "Office", to: "Whole Foods", time: "Yesterday" },
  { id: 3, from: "Home", to: "City Park", time: "2 days ago" },
];

const popularDestinations = [
  { id: 1, name: "Downtown Station", address: "Main Street, City Center" },
  { id: 2, name: "City Park", address: "Green Avenue" },
  { id: 3, name: "University Campus", address: "Campus Drive" },
  { id: 4, name: "Shopping District", address: "Commerce Street" },
];

export default function SearchExpandedScreen() {
  const navigate = useNavigate();
  const [toValue, setToValue] = useState("");

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-white flex flex-col">
      {/* Status Bar */}
      <div className="bg-white px-6 pt-3 pb-2 flex items-center justify-between text-sm border-b border-gray-100">
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

      {/* Header with Back */}
      <div className="px-6 py-4 border-b border-gray-100">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-[#2D8653] font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>
      </div>

      {/* Search Inputs */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="space-y-4">
          {/* From Field */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-[#2D8653] rounded-full" />
            </div>
            <input
              type="text"
              value="Current location"
              readOnly
              className="flex-1 text-[#1A1A1A] font-medium outline-none bg-transparent"
            />
          </div>

          {/* Connecting Line */}
          <div className="pl-4 border-l-2 border-dashed border-gray-200 ml-4 h-6" />

          {/* To Field */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-red-600" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="Where to?"
              value={toValue}
              onChange={(e) => setToValue(e.target.value)}
              autoFocus
              className="flex-1 text-[#1A1A1A] placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent Searches */}
        <div className="px-6 py-6 border-b border-gray-100">
          <h3 className="text-[#1A1A1A] font-bold text-lg mb-4">Recent</h3>
          <div className="space-y-3">
            {recentSearches.map((search) => (
              <motion.button
                key={search.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/routes")}
                className="w-full flex items-center gap-4 py-3 active:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[#1A1A1A] font-semibold">
                    {search.from} → {search.to}
                  </p>
                  <p className="text-gray-500 text-sm">{search.time}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Popular Destinations */}
        <div className="px-6 py-6">
          <h3 className="text-[#1A1A1A] font-bold text-lg mb-4">Popular destinations</h3>
          <div className="space-y-3">
            {popularDestinations.map((destination) => (
              <motion.button
                key={destination.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/routes")}
                className="w-full flex items-center gap-4 py-3 active:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-[#2D8653]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[#1A1A1A] font-semibold">
                    {destination.name}
                  </p>
                  <p className="text-gray-500 text-sm">{destination.address}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard Spacer (simulated) */}
      <div className="h-64 bg-gray-100 border-t border-gray-200 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Keyboard visible</p>
      </div>
    </div>
  );
}
