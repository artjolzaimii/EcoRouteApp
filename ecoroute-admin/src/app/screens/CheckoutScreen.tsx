import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Sparkles, Check, AlertCircle } from "lucide-react";

const allProducts = [
  {
    id: 1,
    name: "Premium Bike Lock",
    description: "Heavy-duty U-lock with mounting bracket",
    points: 1200,
    image: "🔒",
    shipping: "Free shipping • Arrives in 5-7 days",
  },
  {
    id: 2,
    name: "Reusable Water Bottle",
    description: "Stainless steel, 750ml insulated bottle",
    points: 400,
    image: "💧",
    shipping: "Free shipping • Arrives in 3-5 days",
  },
  {
    id: 3,
    name: "Monthly Coffee Pass",
    description: "30 free coffees at partner cafes",
    points: 2500,
    image: "☕",
    shipping: "Digital delivery • Instant access",
  },
  {
    id: 4,
    name: "Bike Repair Kit",
    description: "Complete toolkit for on-the-go repairs",
    points: 800,
    image: "🔧",
    shipping: "Free shipping • Arrives in 5-7 days",
  },
  {
    id: 5,
    name: "Eco Tote Bag Set",
    description: "Set of 3 organic cotton tote bags",
    points: 300,
    image: "👜",
    shipping: "Free shipping • Arrives in 3-5 days",
  },
  {
    id: 6,
    name: "Gym Day Pass (5-pack)",
    description: "5 day passes to partner fitness centers",
    points: 1500,
    image: "💪",
    shipping: "Digital delivery • Instant access",
  },
  {
    id: 7,
    name: "Bookstore Gift Card",
    description: "$25 gift card for local bookstores",
    points: 2000,
    image: "📚",
    shipping: "Digital delivery • Instant access",
  },
  {
    id: 8,
    name: "Transit Pass (Weekly)",
    description: "7-day unlimited public transport pass",
    points: 1800,
    image: "🚌",
    shipping: "Digital delivery • Instant access",
  },
  {
    id: 9,
    name: "Student Meal Vouchers",
    description: "10 meal vouchers for campus dining",
    points: 1000,
    image: "🍽️",
    shipping: "Digital delivery • Instant access",
  },
  {
    id: 10,
    name: "Bamboo Cutlery Set",
    description: "Travel utensil set with carrying case",
    points: 250,
    image: "🥢",
    shipping: "Free shipping • Arrives in 3-5 days",
  },
  {
    id: 11,
    name: "Bike Lights Set",
    description: "Front and rear LED safety lights",
    points: 600,
    image: "💡",
    shipping: "Free shipping • Arrives in 5-7 days",
  },
  {
    id: 12,
    name: "Coffee Beans (1kg)",
    description: "Premium organic fair-trade coffee",
    points: 900,
    image: "☕",
    shipping: "Free shipping • Arrives in 3-5 days",
  },
];

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const { productId } = useParams();

  const userPoints = 2840;
  const product = allProducts.find((p) => p.id === Number(productId));

  if (!product) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-gray-900 font-bold text-xl mb-2">
            Product not found
          </h2>
          <button
            onClick={() => navigate("/marketplace")}
            className="text-emerald-600 font-semibold"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const pointsAfterPurchase = userPoints - product.points;

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <motion.button
          onClick={() => navigate(`/marketplace/product/${product.id}`)}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </motion.button>
        <h1 className="text-gray-900 font-bold text-lg">Checkout</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2"
        >
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-white" strokeWidth={3} />
          </div>
          <div className="w-12 h-1 bg-emerald-600 rounded-full" />
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">2</span>
          </div>
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-400 font-bold text-sm">3</span>
          </div>
        </motion.div>

        {/* Product Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-5">
            <h2 className="text-gray-900 font-bold text-base mb-4">
              Order Summary
            </h2>

            <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                {product.image}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-bold text-base mb-1">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-sm mb-2">
                  {product.description}
                </p>
                <p className="text-gray-400 text-xs">{product.shipping}</p>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Quantity</span>
                <span className="text-gray-900 font-semibold">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Points Cost</span>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="text-gray-900 font-semibold">
                    {product.points.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Points Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-5"
        >
          <h2 className="text-gray-900 font-bold text-base mb-4">
            Points Summary
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Current Balance</span>
              <span className="text-gray-900 font-semibold">
                {userPoints.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Points to Redeem</span>
              <span className="text-red-600 font-semibold">
                -{product.points.toLocaleString()}
              </span>
            </div>

            <div className="h-px bg-gray-200" />

            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-bold">
                Balance After Purchase
              </span>
              <span className="text-emerald-600 font-bold text-lg">
                {pointsAfterPurchase.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 rounded-2xl p-5 flex items-start gap-4"
        >
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-900 font-semibold text-sm mb-1">
              Important Notice
            </h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              Points redemption is final and cannot be reversed. Make sure
              you've reviewed all details before confirming your order.
            </p>
          </div>
        </motion.div>

        {/* Terms Checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-start gap-3"
        >
          <input
            type="checkbox"
            id="terms"
            className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
            defaultChecked
          />
          <label htmlFor="terms" className="text-gray-600 text-sm">
            I agree to the{" "}
            <span className="text-emerald-600 font-semibold">
              terms and conditions
            </span>{" "}
            and confirm that all order details are correct.
          </label>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 safe-area-bottom">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/marketplace/confirmation")}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:bg-emerald-700"
        >
          <Check className="w-5 h-5" />
          Confirm Redemption
        </motion.button>

        <button
          onClick={() => navigate(`/marketplace/product/${product.id}`)}
          className="w-full mt-3 py-3 text-gray-600 font-semibold text-sm"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
