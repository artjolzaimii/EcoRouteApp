import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Gift, Clock, MapPin, Zap } from "lucide-react";

export default function CouponDetailScreen() {
  const navigate = useNavigate();

  // Sample coupon data
  const coupon = {
    businessName: "Green Coffee Co.",
    category: "Coffee & Café",
    logo: "☕",
    offerHeadline: "10% off any purchase",
    description: "Enjoy a discount on organic fair-trade coffee, pastries, and light meals. We use 100% renewable energy and compostable packaging.",
    pointsRequired: 0,
    freeWithEcoRoute: true,
    validUntil: "March 31, 2026",
    howToRedeem: "Show this screen at checkout before payment",
    terms: "Valid for in-store purchases only. Cannot be combined with other offers. One use per customer per day.",
  };

  const handleRedeem = () => {
    navigate("/coupon-redeemed");
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

      {/* Header with Back Button */}
      <div className="px-6 py-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:shadow"
        >
          <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Business Logo & Info */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                {coupon.logo}
              </div>
              <div className="flex-1">
                <span className="inline-block text-emerald-600 text-xs font-bold mb-1 bg-emerald-50 px-2 py-1 rounded-full">
                  Eco-Partner
                </span>
                <h1 className="text-[#1A1A1A] text-2xl font-bold mb-1">
                  {coupon.businessName}
                </h1>
                <p className="text-gray-600 text-sm">{coupon.category}</p>
              </div>
            </div>
          </div>

          {/* Offer Headline */}
          <div className="bg-gradient-to-br from-[#2D8653] to-[#1A5C38] rounded-3xl p-6 shadow-lg">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-white text-3xl font-bold flex-1">
                {coupon.offerHeadline}
              </h2>
            </div>
            <p className="text-white/90 text-base leading-relaxed">
              {coupon.description}
            </p>
          </div>

          {/* Points Required */}
          <div className="bg-white rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#2D8653]" />
                </div>
                <div>
                  {coupon.freeWithEcoRoute ? (
                    <>
                      <p className="text-[#1A1A1A] font-bold text-lg">
                        Free with eco route
                      </p>
                      <p className="text-gray-600 text-sm">No points required</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[#1A1A1A] font-bold text-lg">
                        {coupon.pointsRequired} Points
                      </p>
                      <p className="text-gray-600 text-sm">Required to unlock</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Valid Until */}
          <div className="bg-white rounded-3xl p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-600 text-sm mb-1">Valid until</p>
                <p className="text-[#1A1A1A] font-semibold text-base">
                  {coupon.validUntil}
                </p>
              </div>
            </div>
          </div>

          {/* How to Redeem */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h3 className="text-[#1A1A1A] font-bold text-lg mb-3">
              How to redeem
            </h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 text-base leading-relaxed">
                {coupon.howToRedeem}
              </p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <h4 className="text-gray-700 font-semibold text-sm mb-2">
              Terms & Conditions
            </h4>
            <p className="text-gray-600 text-xs leading-relaxed">
              {coupon.terms}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="px-6 pb-8 pt-4 bg-gradient-to-t from-[#F1EFE8] via-[#F1EFE8] to-transparent">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleRedeem}
          className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors"
        >
          Redeem Now
        </motion.button>
      </div>
    </div>
  );
}
