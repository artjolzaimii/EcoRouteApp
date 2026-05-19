import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Leaf, Eye, EyeOff } from "lucide-react";

export default function LogInScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogIn = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/home");
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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-[#2D8653] rounded-2xl flex items-center justify-center">
              <Leaf className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-[#1A1A1A] text-2xl font-bold text-center mb-6">
              Welcome back
            </h2>

            <form onSubmit={handleLogIn} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-gray-700 text-sm font-medium mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#2D8653] focus:outline-none transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-gray-700 text-sm font-medium mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#2D8653] focus:outline-none transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-[#2D8653] text-sm font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Log In Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors mt-6"
              >
                Log In
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social Sign In */}
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-2xl border-2 border-gray-200 font-semibold text-gray-700 active:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-2xl border-2 border-gray-900 bg-gray-900 font-semibold text-white active:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Sign in with Apple
              </motion.button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-gray-600 text-sm mt-6">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-[#2D8653] font-semibold"
              >
                Sign Up
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
