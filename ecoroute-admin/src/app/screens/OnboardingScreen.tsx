import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Map, Leaf, Gift, ChevronRight } from "lucide-react";

const onboardingCards = [
  {
    id: 1,
    icon: Map,
    title: "The greenest route",
    subtitle: "Walk, cycle, bus and scooter combined into one smart journey",
    color: "emerald",
  },
  {
    id: 2,
    icon: Leaf,
    title: "Track your impact",
    subtitle: "See exactly how much CO₂ you save every trip",
    color: "green",
  },
  {
    id: 3,
    icon: Gift,
    title: "Earn real rewards",
    subtitle: "Green Points unlock discounts at local eco businesses",
    color: "emerald",
  },
];

export default function OnboardingScreen() {
  const [currentCard, setCurrentCard] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentCard < onboardingCards.length - 1) {
      setCurrentCard(currentCard + 1);
    } else {
      navigate("/location-permission");
    }
  };

  const handleSkip = () => {
    navigate("/location-permission");
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

      {/* Skip Button */}
      <div className="px-6 py-4 flex justify-end">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSkip}
          className="text-[#2D8653] font-semibold text-base"
        >
          Skip
        </motion.button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {onboardingCards.map((card, index) => {
              if (index !== currentCard) return null;
              const Icon = card.icon;

              return (
                <div key={card.id} className="flex flex-col items-center text-center">
                  {/* Illustration Circle */}
                  <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center mb-8 shadow-lg">
                    <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center">
                      <Icon className="w-20 h-20 text-[#2D8653]" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-[#1A1A1A] text-3xl font-bold mb-4">
                    {card.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-gray-600 text-lg leading-relaxed max-w-sm">
                    {card.subtitle}
                  </p>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mb-8">
        {onboardingCards.map((_, index) => (
          <motion.div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentCard
                ? "w-8 bg-[#2D8653]"
                : "w-2 bg-gray-300"
            }`}
            animate={{
              width: index === currentCard ? 32 : 8,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Next / Get Started Button */}
      <div className="px-6 pb-8">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full bg-[#2D8653] text-white py-4 rounded-2xl font-bold shadow-lg active:bg-[#1A5C38] transition-colors flex items-center justify-center gap-2"
        >
          {currentCard === onboardingCards.length - 1 ? "Get Started" : "Next"}
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
