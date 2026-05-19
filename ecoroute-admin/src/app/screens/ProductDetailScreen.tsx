import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Check,
  Package,
  Star,
  MessageCircle,
  Share2,
  BadgeCheck,
  MapPin,
  ThumbsUp,
  TrendingUp,
  DollarSign,
} from "lucide-react";

const allProducts = [
  {
    id: 1,
    name: "Premium Bike Lock",
    description: "Heavy-duty U-lock with mounting bracket",
    fullDescription:
      "Protect your bike with this premium U-lock featuring hardened steel construction, weather-resistant coating, and an easy-mount bracket. Includes two keys and a protective coating to prevent scratches on your bike frame.",
    points: 1200,
    image: "🔒",
    inStock: true,
    features: [
      "Hardened steel construction",
      "Weather-resistant coating",
      "Includes mounting bracket",
      "2 keys included",
    ],
    shipping: "Free shipping • Arrives in 5-7 days",
    seller: {
      name: "EcoGear Store",
      avatar: "🏪",
      rating: 4.8,
      totalReviews: 342,
      verified: true,
      location: "2.3 km away",
      responseTime: "Usually responds in 2 hours",
    },
    rating: 4.7,
    reviews: 124,
    negotiable: true,
    userReviews: [
      {
        name: "Sarah M.",
        avatar: "👩",
        rating: 5,
        date: "2 days ago",
        comment: "Excellent quality! Very sturdy and easy to install.",
        helpful: 24,
      },
      {
        name: "Mike R.",
        avatar: "👨",
        rating: 4,
        date: "1 week ago",
        comment: "Great lock, but a bit heavy to carry around.",
        helpful: 12,
      },
      {
        name: "Emma L.",
        avatar: "👧",
        rating: 5,
        date: "2 weeks ago",
        comment: "Best bike lock I've owned. Worth every point!",
        helpful: 18,
      },
    ],
  },
  {
    id: 2,
    name: "Reusable Water Bottle",
    description: "Stainless steel, 750ml insulated bottle",
    fullDescription:
      "Stay hydrated sustainably with this premium stainless steel water bottle. Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and dishwasher safe.",
    points: 400,
    image: "💧",
    inStock: true,
    features: [
      "750ml capacity",
      "24hr cold / 12hr hot",
      "BPA-free materials",
      "Dishwasher safe",
    ],
    shipping: "Free shipping • Arrives in 3-5 days",
    seller: {
      name: "GreenLife Co",
      avatar: "🌿",
      rating: 4.9,
      totalReviews: 567,
      verified: true,
      location: "1.5 km away",
      responseTime: "Usually responds in 1 hour",
    },
    rating: 4.9,
    reviews: 89,
    negotiable: false,
    userReviews: [
      {
        name: "Alex K.",
        avatar: "🧑",
        rating: 5,
        date: "3 days ago",
        comment: "Keeps my drinks cold all day! Love it.",
        helpful: 31,
      },
    ],
  },
];

export default function ProductDetailScreen() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerPoints, setOfferPoints] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);

  const userPoints = 2840;
  const product = allProducts.find((p) => p.id === Number(productId)) || allProducts[0];

  const canAfford = userPoints >= product.points;

  const handleMakeOffer = () => {
    setShowOfferDialog(false);
    alert(`Offer of ${offerPoints} points sent to ${product.seller.name}!`);
    setOfferPoints("");
  };

  const handleShare = (platform: string) => {
    setShowShareDialog(false);
    alert(`Shared on ${platform}!`);
  };

  return (
    <div className="min-h-full bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate("/marketplace")}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          <h1 className="text-gray-900 font-bold text-lg">Product Details</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowShareDialog(true)}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <Share2 className="w-5 h-5 text-gray-700" />
        </motion.button>
      </div>

      {/* Product Image */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 aspect-square flex items-center justify-center relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-9xl"
        >
          {product.image}
        </motion.div>
        {product.negotiable && (
          <div className="absolute top-4 left-4 bg-blue-500 text-white text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Negotiable
          </div>
        )}
        {product.seller.verified && (
          <div className="absolute top-4 right-4 bg-emerald-600 text-white rounded-full p-2">
            <BadgeCheck className="w-6 h-6" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="px-6 py-6 space-y-6">
        {/* Title, Rating & Price */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-gray-900 font-bold text-2xl flex-1">
              {product.name}
            </h2>
            {product.inStock && (
              <div className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                <Check className="w-3 h-3" />
                In Stock
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
              <span className="text-gray-900 font-bold">{product.rating}</span>
              <span className="text-gray-500 text-sm">
                ({product.reviews} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <MapPin className="w-4 h-4" />
              {product.seller.location}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <span className="text-emerald-700 font-bold text-3xl">
              {product.points.toLocaleString()}
            </span>
            <span className="text-gray-500">Green Points</span>
          </div>

          <p className="text-gray-600 leading-relaxed">
            {product.fullDescription}
          </p>
        </motion.div>

        {/* Seller Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-lg"
        >
          <h3 className="text-gray-900 font-bold text-base mb-4">
            Sold By
          </h3>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
              {product.seller.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-900 font-bold">
                  {product.seller.name}
                </span>
                {product.seller.verified && (
                  <BadgeCheck
                    className="w-5 h-5 text-emerald-600"
                    fill="currentColor"
                  />
                )}
              </div>
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                <span className="text-gray-900 font-semibold text-sm">
                  {product.seller.rating}
                </span>
                <span className="text-gray-500 text-sm">
                  ({product.seller.totalReviews} reviews)
                </span>
              </div>
              <p className="text-gray-500 text-xs mb-3">
                {product.seller.responseTime}
              </p>
              <button
                onClick={() => navigate(`/marketplace/chat/${product.seller.name}`)}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:bg-emerald-700"
              >
                <MessageCircle className="w-4 h-4" />
                Message Seller
              </button>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-5 shadow-lg"
        >
          <h3 className="text-gray-900 font-bold text-base mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-emerald-600" />
            What's Included
          </h3>
          <div className="space-y-3">
            {product.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                </div>
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Shipping Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50 rounded-2xl p-5 flex items-start gap-4"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            {product.shipping.includes("Digital") ? (
              <Sparkles className="w-5 h-5 text-blue-600" />
            ) : (
              <Package className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h4 className="text-blue-900 font-semibold text-sm mb-1">
              Delivery Info
            </h4>
            <p className="text-blue-700 text-sm">{product.shipping}</p>
          </div>
        </motion.div>

        {/* Customer Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-5 shadow-lg"
        >
          <h3 className="text-gray-900 font-bold text-base mb-4">
            Customer Reviews
          </h3>
          <div className="space-y-4">
            {product.userReviews.map((review, index) => (
              <div key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-xl">
                    {review.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-900 font-semibold text-sm">
                        {review.name}
                      </span>
                      <span className="text-gray-400 text-xs">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating
                              ? "text-yellow-500"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {review.comment}
                    </p>
                    <button className="flex items-center gap-1 text-gray-500 text-xs">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Helpful ({review.helpful})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Points Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-100 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Your Points</span>
            <span className="text-gray-900 font-bold text-lg">
              {userPoints.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Cost</span>
            <span className="text-gray-900 font-bold text-lg">
              -{product.points.toLocaleString()}
            </span>
          </div>
          <div className="h-px bg-gray-300 my-3" />
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-semibold">After Purchase</span>
            <span
              className={`font-bold text-lg ${
                canAfford ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {canAfford
                ? (userPoints - product.points).toLocaleString()
                : "Insufficient Points"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 safe-area-bottom max-w-[430px] mx-auto">
        <div className="flex gap-3">
          {product.negotiable && canAfford && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowOfferDialog(true)}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:bg-blue-700"
            >
              <TrendingUp className="w-5 h-5" />
              Make Offer
            </motion.button>
          )}
          <motion.button
            whileTap={canAfford ? { scale: 0.97 } : {}}
            disabled={!canAfford}
            onClick={() =>
              canAfford && navigate(`/marketplace/checkout/${product.id}`)
            }
            className={`${product.negotiable && canAfford ? "flex-1" : "w-full"} py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 ${
              canAfford
                ? "bg-emerald-600 text-white active:bg-emerald-700 shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {canAfford ? "Redeem Now" : "Not Enough Points"}
          </motion.button>
        </div>
      </div>

      {/* Make Offer Dialog */}
      {showOfferDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center max-w-[430px] mx-auto">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white rounded-t-3xl p-6 w-full"
          >
            <h3 className="text-gray-900 font-bold text-xl mb-4">
              Make an Offer
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Current price: {product.points} points
            </p>
            <div className="mb-6">
              <label className="text-gray-700 text-sm font-semibold mb-2 block">
                Your Offer (points)
              </label>
              <input
                type="number"
                value={offerPoints}
                onChange={(e) => setOfferPoints(e.target.value)}
                placeholder={`Less than ${product.points}`}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-emerald-600 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowOfferDialog(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleMakeOffer}
                disabled={!offerPoints || Number(offerPoints) >= product.points}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:text-gray-500"
              >
                Send Offer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center max-w-[430px] mx-auto">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white rounded-t-3xl p-6 w-full"
          >
            <h3 className="text-gray-900 font-bold text-xl mb-4">
              Share Product
            </h3>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {["Facebook", "Twitter", "WhatsApp", "Copy Link"].map((platform) => (
                <button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-xs text-gray-600">{platform}</span>
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
