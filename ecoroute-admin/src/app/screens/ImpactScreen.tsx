import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Leaf,
  TrendingUp,
  Award,
  Calendar,
  Droplets,
  Wind,
  TreePine,
  Zap,
  Clock,
  MapPin,
  FileText,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function ImpactScreen() {
  const navigate = useNavigate();
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "year">("week");

  const stats = {
    week: {
      co2: 18.5,
      trees: 2.8,
      water: 450,
      distance: 52.3,
      trips: 14,
    },
    month: {
      co2: 76.2,
      trees: 11.4,
      water: 1850,
      distance: 215.7,
      trips: 58,
    },
    year: {
      co2: 892.4,
      trees: 134.2,
      water: 21600,
      distance: 2544.3,
      trips: 687,
    },
  };

  const currentStats = stats[timeFrame];

  const achievements = [
    {
      icon: TreePine,
      title: "Forest Guardian",
      description: "Saved equivalent of 100 trees",
      progress: 134,
      target: 100,
      color: "emerald",
      unlocked: true,
    },
    {
      icon: Droplets,
      title: "Water Saver",
      description: "Conserved 50,000L of water",
      progress: 21600,
      target: 50000,
      color: "blue",
      unlocked: false,
    },
    {
      icon: Wind,
      title: "Clean Air Hero",
      description: "1 ton of CO₂ saved",
      progress: 892,
      target: 1000,
      color: "sky",
      unlocked: false,
    },
  ];

  const weeklyData = [
    { day: "Mon", value: 2.1 },
    { day: "Tue", value: 3.5 },
    { day: "Wed", value: 2.8 },
    { day: "Thu", value: 4.2 },
    { day: "Fri", value: 3.1 },
    { day: "Sat", value: 1.5 },
    { day: "Sun", value: 1.3 },
  ];

  const maxValue = Math.max(...weeklyData.map((d) => d.value));

  return (
    <div className="min-h-full bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pt-6 pb-12 rounded-b-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-6 h-6 text-white" />
            <h1 className="text-white text-2xl font-bold">Your Impact</h1>
          </div>
          <p className="text-emerald-100 text-sm">
            Making the world greener, one trip at a time
          </p>
        </motion.div>

        {/* Time Frame Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-1"
        >
          {(["week", "month", "year"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFrame(period)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                timeFrame === period
                  ? "bg-white text-emerald-700 shadow-md"
                  : "text-white/70 active:bg-white/10"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Main Stats Cards */}
      <div className="px-6 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-xl"
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-gray-500 text-sm">CO₂ Saved</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {currentStats.co2}
                <span className="text-lg text-gray-500 ml-1">kg</span>
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-500 text-sm">Trees</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {currentStats.trees}
                <span className="text-lg text-gray-500 ml-1">eq.</span>
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-500 text-sm">Water</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {currentStats.water}
                <span className="text-lg text-gray-500 ml-1">L</span>
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-gray-500 text-sm">Distance</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {currentStats.distance}
                <span className="text-lg text-gray-500 ml-1">km</span>
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 text-sm">
                {currentStats.trips} trips completed
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">+24%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Weekly Chart */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-gray-900 font-bold text-lg mb-4">
            This Week's Activity
          </h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {weeklyData.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ height: 0 }}
                animate={{ height: `${(day.value / maxValue) * 100}%` }}
                transition={{ delay: 0.4 + index * 0.05, type: "spring" }}
                className="flex-1 flex flex-col items-center"
              >
                <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg mb-2 relative group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.value} kg
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {day.day}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 font-bold text-lg">Achievements</h2>
          <button className="text-emerald-600 text-sm font-semibold">
            View All
          </button>
        </div>

        <div className="space-y-3">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            const progress = Math.min(
              (achievement.progress / achievement.target) * 100,
              100
            );

            return (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`bg-white rounded-2xl p-4 shadow-sm ${
                  achievement.unlocked ? "border-2 border-emerald-200" : ""
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      achievement.unlocked
                        ? "bg-emerald-600"
                        : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        achievement.unlocked ? "text-white" : "text-gray-400"
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-gray-900 font-semibold">
                        {achievement.title}
                      </h3>
                      {achievement.unlocked && (
                        <Award className="w-5 h-5 text-yellow-500" fill="currentColor" />
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {!achievement.unlocked && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {achievement.progress.toLocaleString()} /{" "}
                        {achievement.target.toLocaleString()}
                      </span>
                      <span className="text-emerald-600 font-semibold">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{
                          delay: 0.6 + index * 0.1,
                          duration: 0.8,
                        }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Comparison Card */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Keep it up!</h3>
              <p className="text-emerald-100 text-sm mb-3">
                You're doing better than 87% of EcoRoute users in your area.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-[87%] h-full bg-white rounded-full" />
                </div>
                <span className="text-sm font-semibold">87%</span>
              </div>
            </div>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/monthly-report")}
            className="w-full bg-white/20 backdrop-blur-sm text-white py-3 rounded-xl font-semibold active:bg-white/30 transition-colors flex items-center justify-center gap-2 border border-white/30"
          >
            <FileText className="w-5 h-5" />
            View Monthly Report
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}