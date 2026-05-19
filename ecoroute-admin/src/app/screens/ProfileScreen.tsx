import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  User,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Award,
  Users,
  MapPin,
  ChevronRight,
  Share2,
  LogOut,
  Mail,
  Edit,
  Trophy,
  TrendingUp,
  Bookmark,
} from "lucide-react";

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const user = {
    name: "Alex Morgan",
    email: "alex.morgan@email.com",
    memberSince: "January 2026",
    level: "Eco Champion",
    rank: "Top 5%",
    totalImpact: "892 kg CO₂",
  };

  const stats = [
    { label: "Total Trips", value: "687", icon: MapPin, color: "emerald" },
    { label: "Achievements", value: "24", icon: Award, color: "yellow" },
    { label: "Friends", value: "42", icon: Users, color: "blue" },
  ];

  const handleMenuAction = (action: string) => {
    switch (action) {
      case "profile":
        navigate("/edit-profile");
        break;
      case "routes":
        navigate("/saved-routes");
        break;
      // Add other navigation cases as needed
      default:
        console.log("Action:", action);
    }
  };

  const menuSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", action: "profile" },
        { icon: Bell, label: "Notifications", action: "notifications", toggle: true },
        { icon: Shield, label: "Privacy & Security", action: "privacy" },
      ],
    },
    {
      title: "App Settings",
      items: [
        { icon: Bookmark, label: "Saved Routes", action: "routes" },
        { icon: Settings, label: "Preferences", action: "preferences" },
        { icon: CreditCard, label: "Payment Methods", action: "payment" },
      ],
    },
    {
      title: "Community",
      items: [
        { icon: Users, label: "Friends & Leaderboard", action: "friends" },
        { icon: Share2, label: "Invite Friends", action: "invite" },
        { icon: Trophy, label: "Challenges", action: "challenges" },
      ],
    },
  ];

  return (
    <div className="min-h-full bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-6 pt-6 pb-16 rounded-b-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-white" />
            <h1 className="text-white text-2xl font-bold">Profile</h1>
          </div>
          <button className="text-white">
            <Settings className="w-6 h-6" />
          </button>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center border-2 border-white/40 flex-shrink-0">
              <User className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-white text-xl font-bold">{user.name}</h2>
                  <p className="text-white/70 text-sm">{user.email}</p>
                </div>
                <button className="text-white/80 hover:text-white">
                  <Edit className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {user.level}
                </span>
                <span className="bg-yellow-500/20 text-yellow-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {user.rank}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20">
            <p className="text-white/70 text-xs mb-1">Total Environmental Impact</p>
            <p className="text-white text-2xl font-bold">{user.totalImpact}</p>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-2xl p-4 shadow-lg text-center"
              >
                <div
                  className={`w-10 h-10 bg-${stat.color}-100 rounded-xl flex items-center justify-center mx-auto mb-2`}
                >
                  <Icon
                    className={`w-5 h-5 text-${stat.color}-600`}
                    strokeWidth={2}
                  />
                </div>
                <p className="text-gray-900 font-bold text-lg">{stat.value}</p>
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Menu Sections */}
      <div className="px-6 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + sectionIndex * 0.1 }}
          >
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3 px-1">
              {section.title}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isLast = itemIndex === section.items.length - 1;

                return (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors ${
                      !isLast ? "border-b border-gray-100" : ""
                    }`}
                    onClick={() => handleMenuAction(item.action)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-600" strokeWidth={2} />
                      </div>
                      <span className="text-gray-900 font-medium">
                        {item.label}
                      </span>
                    </div>

                    {item.toggle ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotificationsEnabled(!notificationsEnabled);
                        }}
                        className={`w-12 h-7 rounded-full transition-colors relative ${
                          notificationsEnabled ? "bg-emerald-600" : "bg-gray-300"
                        }`}
                      >
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full absolute top-1"
                          animate={{
                            left: notificationsEnabled ? "26px" : "4px",
                          }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Member Since */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm mb-1">Member Since</p>
              <p className="text-white text-xl font-bold mb-2">
                {user.memberSince}
              </p>
              <p className="text-emerald-100 text-sm">
                You've made a positive impact on the planet for over 2 months!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-center gap-2 text-red-600 font-semibold active:bg-gray-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </motion.button>

        {/* App Version */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center py-4"
        >
          <p className="text-gray-400 text-xs">EcoRoute v1.2.0</p>
          <p className="text-gray-400 text-xs mt-1">
            Made with 💚 for a sustainable future
          </p>
        </motion.div>
      </div>
    </div>
  );
}