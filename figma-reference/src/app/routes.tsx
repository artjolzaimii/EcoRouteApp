import { createBrowserRouter } from "react-router";
import WelcomeScreen from "./screens/WelcomeScreen";
import HomeScreen from "./screens/HomeScreen";
import RoutesScreen from "./screens/RoutesScreen";
import ImpactScreen from "./screens/ImpactScreen";
import RewardsScreen from "./screens/RewardsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { MobileLayout } from "./components/MobileLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <WelcomeScreen />,
  },
  {
    element: <MobileLayout />,
    children: [
      {
        path: "/home",
        element: <HomeScreen />,
      },
      {
        path: "/routes",
        element: <RoutesScreen />,
      },
      {
        path: "/impact",
        element: <ImpactScreen />,
      },
      {
        path: "/rewards",
        element: <RewardsScreen />,
      },
      {
        path: "/profile",
        element: <ProfileScreen />,
      },
    ],
  },
]);
