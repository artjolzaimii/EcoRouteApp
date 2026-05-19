import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { CheckCircle, Sparkles, Home, ShoppingBag, Share2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function RedemptionConfirmationScreen() {
  const navigate = useNavigate();
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleShare = (platform: string) => {
    setShowShareDialog(false);
    alert(`Shared your achievement on ${platform}! 🎉`);
  };

  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#2D8653", "#1A5C38", "#34D399", "#FBBF24"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#2D8653", "#1A5C38", "#34D399", "#FBBF24"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex flex-col items-center justify-center px-6">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.2,
        }}
        className="mb-8"
      >
        <div className="relative">
          {/* Animated Background Circles */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl"
          />

          {/* Success Icon */}
          <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle
              className="w-20 h-20 text-emerald-600"
              strokeWidth={2.5}
            />
          </div>

          {/* Sparkles */}
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-8 h-8 text-yellow-500" fill="currentColor" />
          </motion.div>
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-gray-900 font-bold text-3xl mb-3">
          Congratulations!
        </h1>
        <p className="text-gray-600 text-base leading-relaxed max-w-sm">
          Your points have been successfully redeemed. Your reward details have
          been sent to your email.
        </p>
      </motion.div>

      {/* Points Redeemed Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-6 mb-8 w-full max-w-sm"
      >
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">Points Redeemed</p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <span className="text-emerald-600 font-bold text-4xl">1,200</span>
          </div>

          <div className="h-px bg-gray-200 mb-4" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Remaining Balance</span>
            <span className="text-gray-900 font-bold">1,640 Points</span>
          </div>
        </div>
      </motion.div>

      {/* What's Next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-blue-50 rounded-2xl p-5 mb-8 w-full max-w-sm"
      >
        <h3 className="text-blue-900 font-bold text-sm mb-2">What's Next?</h3>
        <ul className="space-y-2 text-blue-700 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">✓</span>
            <span>Check your email for redemption details</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">✓</span>
            <span>Track your order in the Profile section</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">✓</span>
            <span>Earn more points by taking eco-friendly trips</span>
          </li>
        </ul>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="w-full max-w-sm space-y-3"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowShareDialog(true)}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:opacity-90"
        >
          <Share2 className="w-5 h-5" />
          Share Your Achievement
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/marketplace")}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:bg-emerald-700"
        >
          <ShoppingBag className="w-5 h-5" />
          Continue Shopping
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/home")}
          className="w-full py-4 bg-white text-gray-700 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 shadow-md active:bg-gray-50"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </motion.button>
      </motion.div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12 text-center"
      >
        <p className="text-gray-400 text-xs">
          Thank you for choosing eco-friendly rewards! 🌱
        </p>
      </motion.div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center max-w-[430px] mx-auto">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white rounded-t-3xl p-6 w-full"
          >
            <h3 className="text-gray-900 font-bold text-xl mb-2">
              Share Your Achievement
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Let others know about your eco-friendly choice!
            </p>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { name: "Facebook", icon: "📘" },
                { name: "Twitter", icon: "🐦" },
                { name: "Instagram", icon: "📷" },
                { name: "WhatsApp", icon: "💬" },
              ].map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform.name)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center text-2xl">
                    {platform.icon}
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {platform.name}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowShareDialog(false)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
