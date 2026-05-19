import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Camera } from "lucide-react";
import { Switch } from "../components/ui/switch";

export default function EditProfileScreen() {
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState({
    weeklySummary: true,
    badgeAlerts: true,
    streakReminders: false,
    ecoPartnerNearby: true,
  });

  const handleSave = () => {
    // Save changes logic here
    navigate("/profile");
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
        <h1 className="text-[#1A1A1A] text-2xl font-bold">Edit Profile</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                AW
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="absolute bottom-0 right-0 w-10 h-10 bg-[#2D8653] rounded-full flex items-center justify-center shadow-lg border-4 border-[#F1EFE8] active:bg-[#1A5C38]"
              >
                <Camera className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-white rounded-3xl p-6 shadow-lg space-y-4">
            <div>
              <label className="text-gray-700 text-sm font-medium mb-2 block">
                Full Name
              </label>
              <input
                type="text"
                defaultValue="Alex Walker"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#2D8653] focus:outline-none transition-colors text-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="text-gray-700 text-sm font-medium mb-2 block">
                Email
              </label>
              <input
                type="email"
                defaultValue="alex.walker@example.com"
                disabled
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-gray-200 text-gray-500 cursor-not-allowed"
              />
              <p className="text-gray-500 text-xs mt-2">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-[#1A1A1A] text-lg font-bold mb-4">
              Notification Preferences
            </h2>

            <div className="space-y-4">
              {/* Weekly Summary */}
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-[#1A1A1A] font-semibold text-base">
                    Weekly summary
                  </p>
                  <p className="text-gray-600 text-sm">
                    Your eco impact recap every week
                  </p>
                </div>
                <Switch
                  checked={notifications.weeklySummary}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, weeklySummary: checked })
                  }
                  className="data-[state=checked]:bg-[#2D8653]"
                />
              </div>

              <div className="border-t border-gray-100" />

              {/* Badge Alerts */}
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-[#1A1A1A] font-semibold text-base">
                    Badge alerts
                  </p>
                  <p className="text-gray-600 text-sm">
                    Get notified when you earn badges
                  </p>
                </div>
                <Switch
                  checked={notifications.badgeAlerts}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, badgeAlerts: checked })
                  }
                  className="data-[state=checked]:bg-[#2D8653]"
                />
              </div>

              <div className="border-t border-gray-100" />

              {/* Streak Reminders */}
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-[#1A1A1A] font-semibold text-base">
                    Streak reminders
                  </p>
                  <p className="text-gray-600 text-sm">
                    Daily reminders to keep your streak alive
                  </p>
                </div>
                <Switch
                  checked={notifications.streakReminders}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, streakReminders: checked })
                  }
                  className="data-[state=checked]:bg-[#2D8653]"
                />
              </div>

              <div className="border-t border-gray-100" />

              {/* Eco-Partner Nearby */}
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-[#1A1A1A] font-semibold text-base">
                    Eco-Partner nearby alerts
                  </p>
                  <p className="text-gray-600 text-sm">
                    Offers from eco businesses on your route
                  </p>
                </div>
                <Switch
                  checked={notifications.ecoPartnerNearby}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, ecoPartnerNearby: checked })
                  }
                  className="data-[state=checked]:bg-[#2D8653]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <div className="px-6 pb-8 pt-4 bg-gradient-to-t from-[#F1EFE8] via-[#F1EFE8] to-transparent">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors"
        >
          Save Changes
        </motion.button>
      </div>
    </div>
  );
}
