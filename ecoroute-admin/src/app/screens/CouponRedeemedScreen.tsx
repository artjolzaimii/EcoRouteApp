import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Check, Clock } from "lucide-react";

export default function CouponRedeemedScreen() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Sample redeemed coupon data
  const redeemedCoupon = {
    businessName: "Green Coffee Co.",
    offerHeadline: "10% off any purchase",
    code: "ECO-X7K2M9",
    qrCode: true,
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full space-y-6"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-4"
          >
            <div className="w-24 h-24 bg-[#2D8653] rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-14 h-14 text-white" strokeWidth={3} />
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-[#1A1A1A] text-3xl font-bold mb-2">
              Coupon Redeemed!
            </h1>
            <p className="text-gray-600 text-base">
              {redeemedCoupon.businessName}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {redeemedCoupon.offerHeadline}
            </p>
          </div>

          {/* Redemption Code */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-center text-gray-600 text-sm mb-3 font-medium">
              Show this to the cashier
            </p>
            
            {/* Code Display */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-6 border-2 border-dashed border-[#2D8653] mb-4">
              <p className="text-center text-[#1A1A1A] text-4xl font-mono font-bold tracking-wider">
                {redeemedCoupon.code}
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex justify-center mb-4">
              <div className="w-48 h-48 bg-white border-4 border-[#2D8653] rounded-2xl flex items-center justify-center">
                {/* QR Code Pattern Simulation */}
                <svg width="160" height="160" viewBox="0 0 160 160" className="opacity-80">
                  {/* Top-left corner square */}
                  <rect x="10" y="10" width="50" height="50" fill="none" stroke="#1A1A1A" strokeWidth="8" />
                  <rect x="22" y="22" width="26" height="26" fill="#1A1A1A" />
                  
                  {/* Top-right corner square */}
                  <rect x="100" y="10" width="50" height="50" fill="none" stroke="#1A1A1A" strokeWidth="8" />
                  <rect x="112" y="22" width="26" height="26" fill="#1A1A1A" />
                  
                  {/* Bottom-left corner square */}
                  <rect x="10" y="100" width="50" height="50" fill="none" stroke="#1A1A1A" strokeWidth="8" />
                  <rect x="22" y="112" width="26" height="26" fill="#1A1A1A" />
                  
                  {/* Random pattern blocks */}
                  <rect x="70" y="20" width="8" height="8" fill="#1A1A1A" />
                  <rect x="80" y="20" width="8" height="8" fill="#1A1A1A" />
                  <rect x="70" y="30" width="8" height="8" fill="#1A1A1A" />
                  <rect x="70" y="70" width="8" height="8" fill="#1A1A1A" />
                  <rect x="80" y="70" width="8" height="8" fill="#1A1A1A" />
                  <rect x="90" y="70" width="8" height="8" fill="#1A1A1A" />
                  <rect x="100" y="70" width="8" height="8" fill="#1A1A1A" />
                  <rect x="110" y="70" width="8" height="8" fill="#1A1A1A" />
                  <rect x="120" y="90" width="8" height="8" fill="#1A1A1A" />
                  <rect x="130" y="90" width="8" height="8" fill="#1A1A1A" />
                  <rect x="70" y="100" width="8" height="8" fill="#1A1A1A" />
                  <rect x="80" y="100" width="8" height="8" fill="#1A1A1A" />
                  <rect x="90" y="100" width="8" height="8" fill="#1A1A1A" />
                  <rect x="100" y="110" width="8" height="8" fill="#1A1A1A" />
                  <rect x="110" y="110" width="8" height="8" fill="#1A1A1A" />
                  <rect x="120" y="110" width="8" height="8" fill="#1A1A1A" />
                  <rect x="70" y="120" width="8" height="8" fill="#1A1A1A" />
                  <rect x="80" y="130" width="8" height="8" fill="#1A1A1A" />
                  <rect x="90" y="130" width="8" height="8" fill="#1A1A1A" />
                </svg>
              </div>
            </div>

            {/* Timer */}
            {timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-200">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-amber-700 text-sm font-semibold">
                  Expires in {formatTime(timeLeft)}
                </p>
              </div>
            )}
          </div>

          {/* Instruction */}
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <p className="text-center text-emerald-800 text-sm leading-relaxed">
              Present this screen to the cashier before payment to claim your discount
            </p>
          </div>
        </motion.div>
      </div>

      {/* Done Button */}
      <div className="px-6 pb-8 pt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/rewards")}
          className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors"
        >
          Done
        </motion.button>
      </div>
    </div>
  );
}
