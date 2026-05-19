import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, MapPin, Clock, Leaf, Bike, Bus, Footprints, Trash2, BookmarkX } from "lucide-react";

interface SavedRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  co2Saved: string;
  modes: ("walk" | "bike" | "bus")[];
  dateSaved: string;
}

export default function SavedRoutesScreen() {
  const navigate = useNavigate();
  
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([
    {
      id: "1",
      name: "Morning Commute",
      origin: "Home",
      destination: "Office",
      distance: "5.2 km",
      duration: "18 min",
      co2Saved: "1.2 kg",
      modes: ["bike", "bus"],
      dateSaved: "Mar 15, 2026",
    },
    {
      id: "2",
      name: "Grocery Trip",
      origin: "Office",
      destination: "Whole Foods Market",
      distance: "2.1 km",
      duration: "8 min",
      co2Saved: "0.5 kg",
      modes: ["walk", "bike"],
      dateSaved: "Mar 10, 2026",
    },
    {
      id: "3",
      name: "Gym Route",
      origin: "Home",
      destination: "Green Fitness Center",
      distance: "3.8 km",
      duration: "14 min",
      co2Saved: "0.8 kg",
      modes: ["bike"],
      dateSaved: "Mar 5, 2026",
    },
  ]);

  const handleDelete = (id: string) => {
    setSavedRoutes(savedRoutes.filter(route => route.id !== id));
  };

  const getModeIcon = (mode: "walk" | "bike" | "bus") => {
    switch (mode) {
      case "walk":
        return Footprints;
      case "bike":
        return Bike;
      case "bus":
        return Bus;
    }
  };

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-[#F1EFE8] flex flex-col overflow-y-auto">
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

      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:shadow"
        >
          <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
        </motion.button>
        <h1 className="text-[#1A1A1A] text-2xl font-bold">Saved Routes</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8">
        {savedRoutes.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full py-12"
          >
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
              <BookmarkX className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-[#1A1A1A] text-2xl font-bold mb-3 text-center">
              No saved routes yet
            </h2>
            <p className="text-gray-600 text-base text-center max-w-xs leading-relaxed mb-8">
              Start a trip to save your favorite routes for quick access
            </p>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/home")}
              className="bg-[#2D8653] text-white px-8 py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors"
            >
              Find a Route
            </motion.button>
          </motion.div>
        ) : (
          /* Routes List */
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {savedRoutes.map((route, index) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className="bg-white rounded-3xl p-5 shadow-lg"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-[#1A1A1A] text-lg font-bold mb-2">
                        {route.name}
                      </h3>
                      
                      {/* Origin and Destination */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 bg-[#2D8653] rounded-full mt-1 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{route.origin}</p>
                        </div>
                        <div className="flex items-start gap-2 pl-1">
                          <div className="w-1 h-6 border-l-2 border-dashed border-gray-300 ml-1" />
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{route.destination}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {route.distance}
                        </span>
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {route.duration}
                        </span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Leaf className="w-4 h-4" />
                          {route.co2Saved}
                        </span>
                      </div>

                      {/* Transport Modes */}
                      <div className="flex items-center gap-2 mb-2">
                        {route.modes.map((mode, idx) => {
                          const Icon = getModeIcon(mode);
                          return (
                            <div
                              key={idx}
                              className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"
                            >
                              <Icon className="w-5 h-5 text-[#2D8653]" />
                            </div>
                          );
                        })}
                      </div>

                      {/* Date Saved */}
                      <p className="text-gray-500 text-xs">
                        Saved on {route.dateSaved}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(route.id)}
                      className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center active:bg-red-100 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </motion.button>
                  </div>

                  {/* Use Route Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/routes")}
                    className="w-full bg-[#2D8653] text-white py-3 rounded-xl font-semibold active:bg-[#1A5C38] transition-colors"
                  >
                    Use this route
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
