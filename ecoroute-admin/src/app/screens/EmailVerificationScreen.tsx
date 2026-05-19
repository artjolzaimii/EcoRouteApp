import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Mail } from "lucide-react";

export default function EmailVerificationScreen() {
  const navigate = useNavigate();
  const email = "you@example.com"; // Would come from signup form

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-[#2D8653] rounded-full flex items-center justify-center">
                <Mail className="w-9 h-9 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[#1A1A1A] text-3xl font-bold mb-4"
          >
            Check your email
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 text-lg mb-8"
          >
            We sent a verification link to
            <br />
            <span className="font-semibold text-[#1A1A1A]">{email}</span>
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-[#2D8653] py-4 rounded-2xl font-bold border-2 border-[#2D8653] active:bg-gray-50 transition-colors"
            >
              Resend email
            </motion.button>

            <button
              onClick={() => navigate("/signup")}
              className="text-gray-600 font-semibold text-base py-2"
            >
              Change email
            </button>
          </motion.div>

          {/* Skip for Demo */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/home")}
            className="mt-8 text-[#2D8653] font-semibold text-sm"
          >
            Continue to app →
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
