import { useState } from "react";
import { motion } from "motion/react";
import {
  Gift,
  Sparkles,
  Coffee,
  ShoppingBag,
  Bike,
  Zap,
  Star,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function RewardsScreen() {
  const [activeTab, setActiveTab] = useState<"available" | "redeemed">(
    "available"
  );

  const userPoints = 2840;
  const nextReward = 3000;

  const rewards = [
    {
      id: 1,
      name: "Free Coffee",
      partner: "Starbucks",
      points: 500,
      category: "Food & Drink",
      icon: Coffee,
      color: "amber",
      discount: "100% Off",
      expiry: "Valid for 30 days",
      popular: true,
    },
    {
      id: 2,
      name: "$10 Off Purchase",
      partner: "REI",
      points: 800,
      category: "Outdoor Gear",
      icon: ShoppingBag,
      color: "green",
      discount: "$10 Off",
      expiry: "Valid for 60 days",
      popular: true,
    },
    {
      id: 3,
      name: "Free Bike Tune-up",
      partner: "Local Bike Shop",
      points: 1200,
      category: "Services",
      icon: Bike,
      color: "blue",
      discount: "$50 Value",
      expiry: "Valid for 90 days",
      popular: false,
    },
    {
      id: 4,
      name: "Premium Upgrade",
      partner: "EcoRoute Plus",
      points: 2000,
      category: "App Features",
      icon: Zap,
      color: "purple",
      discount: "3 Months Free",
      expiry: "Instant activation",
      popular: true,
    },
  ];

  const redeemedRewards = [
    {
      id: 101,
      name: "Free Coffee",
      partner: "Starbucks",
      redeemedDate: "March 25, 2026",
      code: "ECO-CF-9283",
      status: "Active",
    },
    {
      id: 102,
      name: "$5 Off Purchase",
      partner: "Whole Foods",
      redeemedDate: "March 20, 2026",
      code: "ECO-WF-7421",
      status: "Used",
    },
  ];

  const challenges = [
    {
      title: "Weekend Warrior",
      description: "Complete 5 eco-trips this weekend",
      reward: "+200 points",
      progress: 3,
      total: 5,
    },
    {
      title: "Bike Champion",
      description: "Bike 50km this month",
      reward: "+500 points",
      progress: 32,
      total: 50,
    },
  ];

  return (
    <div className="min-h-full bg-gray-50 pb-6">
      {/* Header with Points */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 px-6 pt-6 pb-12 rounded-b-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-6 h-6 text-white" />
            <h1 className="text-white text-2xl font-bold">Rewards</h1>
          </div>
          <p className="text-purple-100 text-sm">
            Redeem points for exclusive perks
          </p>
        </motion.div>

        {/* Points Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Your Points</p>
              <p className="text-white text-4xl font-bold">
                {userPoints.toLocaleString()}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">Next reward</span>
              <span className="text-white font-semibold">
                {nextReward - userPoints} points away
              </span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(userPoints / nextReward) * 100}%` }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Active Challenges */}
      <div className="px-6 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-xl mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-bold text-base">
              Active Challenges
            </h3>
            <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
          </div>

          <div className="space-y-4">
            {challenges.map((challenge, index) => (
              <motion.div
                key={challenge.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="border-l-4 border-purple-500 pl-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-gray-900 font-semibold text-sm">
                      {challenge.title}
                    </h4>
                    <p className="text-gray-500 text-xs">
                      {challenge.description}
                    </p>
                  </div>
                  <span className="text-purple-600 text-xs font-bold whitespace-nowrap ml-2">
                    {challenge.reward}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{
                        width: `${(challenge.progress / challenge.total) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {challenge.progress}/{challenge.total}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tab Selector */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("available")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "available"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 active:bg-gray-50"
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setActiveTab("redeemed")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "redeemed"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-600 active:bg-gray-50"
            }`}
          >
            My Rewards
          </button>
        </div>
      </div>

      {/* Rewards Grid */}
      {activeTab === "available" ? (
        <div className="px-6 space-y-4">
          {rewards.map((reward, index) => {
            const Icon = reward.icon;
            const canAfford = userPoints >= reward.points;

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                  !canAfford ? "opacity-60" : ""
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 bg-${reward.color}-100 rounded-2xl flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon
                        className={`w-7 h-7 text-${reward.color}-600`}
                        strokeWidth={2}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-gray-900 font-bold text-base mb-1">
                            {reward.name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {reward.partner}
                          </p>
                        </div>
                        {reward.popular && (
                          <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" fill="currentColor" />
                            Popular
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-purple-600 font-bold text-lg">
                          {reward.discount}
                        </span>
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {reward.expiry}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-900 font-semibold">
                            {reward.points} points
                          </span>
                        </div>

                        <motion.button
                          whileTap={canAfford ? { scale: 0.95 } : {}}
                          disabled={!canAfford}
                          className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                            canAfford
                              ? "bg-purple-600 text-white active:bg-purple-700"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {canAfford ? "Redeem" : "Locked"}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Partner CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white mt-6"
          >
            <h3 className="font-bold text-lg mb-2">Want more rewards?</h3>
            <p className="text-purple-100 text-sm mb-4">
              Complete challenges and eco-trips to earn more points faster.
            </p>
            <button className="bg-white text-purple-600 px-6 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform flex items-center gap-2">
              View Challenges
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      ) : (
        <div className="px-6 space-y-4">
          {redeemedRewards.map((reward, index) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-gray-900 font-bold text-base mb-1">
                    {reward.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{reward.partner}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    reward.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {reward.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-xs text-gray-500 mb-1">Redemption Code</p>
                <p className="text-gray-900 font-mono font-bold text-lg tracking-wider">
                  {reward.code}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Redeemed: {reward.redeemedDate}
                </span>
                {reward.status === "Active" && (
                  <button className="text-purple-600 font-semibold">
                    Use Now
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
