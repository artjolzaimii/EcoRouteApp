import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, Map, Leaf, Gift, User, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";

const tabs = [
  { id: "home", label: "Home", icon: Home, path: "/home" },
  { id: "routes", label: "Routes", icon: Map, path: "/routes" },
  { id: "impact", label: "Impact", icon: Leaf, path: "/impact" },
  { id: "rewards", label: "Rewards", icon: Gift, path: "/rewards" },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag, path: "/marketplace" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

export function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-gray-50 flex flex-col overflow-hidden">
      {/* Status Bar */}
      <div className="bg-white px-6 pt-3 pb-2 flex items-center justify-between text-sm">
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

      {/* Main Content Area with safe area insets */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Bottom Tab Navigation */}
      <div className="bg-white border-t border-gray-200 px-2 pb-6 pt-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-1 py-2 px-4 rounded-lg relative"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-emerald-50 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10">
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isActive ? "text-emerald-600" : "text-gray-400"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                
                <span
                  className={`text-xs font-medium relative z-10 transition-colors ${
                    isActive ? "text-emerald-600" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
