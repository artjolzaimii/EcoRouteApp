import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Leaf, MapPin, TrendingUp } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-gradient-to-b from-emerald-600 to-emerald-800 flex flex-col overflow-hidden">
      {/* Status Bar */}
      <div className="px-6 pt-3 pb-2 flex items-center justify-between text-sm text-white">
        <span className="font-medium">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 border border-white rounded-sm relative">
            <div className="absolute inset-0.5 bg-white rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-between px-8 pt-12 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
          >
            <Leaf className="w-14 h-14 text-emerald-600" strokeWidth={2.5} />
          </motion.div>

          <h1 className="text-4xl font-bold text-white mb-3 text-center">
            EcoRoute
          </h1>
          <p className="text-emerald-100 text-lg text-center max-w-xs">
            Navigate sustainably. Impact positively.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full space-y-4"
        >
          {[
            {
              icon: MapPin,
              title: "Smart Routes",
              description: "Find the most eco-friendly paths",
            },
            {
              icon: Leaf,
              title: "Track Impact",
              description: "See your carbon savings in real-time",
            },
            {
              icon: TrendingUp,
              title: "Earn Rewards",
              description: "Get rewarded for sustainable choices",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-base mb-1">
                  {feature.title}
                </h3>
                <p className="text-emerald-100 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          onClick={() => navigate("/home")}
          className="w-full bg-white text-emerald-700 py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform"
          whileTap={{ scale: 0.98 }}
        >
          Get Started
        </motion.button>
      </div>
    </div>
  );
}
