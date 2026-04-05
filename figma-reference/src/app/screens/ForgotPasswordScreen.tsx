import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordScreen() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Would send reset link in a real app
    navigate("/login");
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

      {/* Back Button */}
      <div className="px-6 py-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-[#2D8653] font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-[#2D8653]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[#1A1A1A] text-3xl font-bold text-center mb-3">
            Reset password
          </h2>

          {/* Subtitle */}
          <p className="text-gray-600 text-center mb-8">
            Enter your email and we will send you a reset link
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-gray-700 text-sm font-medium mb-2 block">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-[#2D8653] focus:outline-none transition-colors"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors"
            >
              Send Reset Link
            </motion.button>
          </form>

          {/* Back to Login */}
          <p className="text-center text-gray-600 text-sm mt-6">
            <button
              onClick={() => navigate("/login")}
              className="text-[#2D8653] font-semibold"
            >
              Back to login
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
