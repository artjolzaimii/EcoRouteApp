import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Bell } from "lucide-react";

export default function NotificationPermissionScreen() {
  const navigate = useNavigate();

  const handleEnable = () => {
    navigate("/signup");
  };

  const handleSkip = () => {
    navigate("/signup");
  };

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
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Icon Illustration */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-lg">
            <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center">
              <Bell className="w-20 h-20 text-[#2D8653]" strokeWidth={1.5} />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[#1A1A1A] text-3xl font-bold mb-4 text-center"
        >
          Stay on your green streak
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 text-lg leading-relaxed text-center max-w-sm"
        >
          Get notified about badge unlocks, Green Points earned, and weekly impact summaries.
        </motion.p>
      </div>

      {/* Buttons */}
      <div className="px-6 pb-8 space-y-3">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEnable}
          className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors"
        >
          Enable Notifications
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSkip}
          className="text-gray-600 font-semibold text-base py-2"
        >
          Skip for now
        </motion.button>
      </div>
    </div>
  );
}
