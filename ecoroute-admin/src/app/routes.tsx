import { createBrowserRouter, Navigate, Outlet, redirect } from "react-router";
import { useAuth } from "./lib/auth";
import LoginPage from "./admin/LoginPage";

function RequireAuth() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
import SplashScreen from "./screens/SplashScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import LocationPermissionScreen from "./screens/LocationPermissionScreen";
import NotificationPermissionScreen from "./screens/NotificationPermissionScreen";
import SignUpScreen from "./screens/SignUpScreen";
import LogInScreen from "./screens/LogInScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import EmailVerificationScreen from "./screens/EmailVerificationScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import HomeScreen from "./screens/HomeScreen";
import SearchExpandedScreen from "./screens/SearchExpandedScreen";
import RoutesScreen from "./screens/RoutesScreen";
import RouteDetailScreen from "./screens/RouteDetailScreen";
import NavigationScreen from "./screens/NavigationScreen";
import TripCompletedScreen from "./screens/TripCompletedScreen";
import ImpactScreen from "./screens/ImpactScreen";
import MonthlyReportScreen from "./screens/MonthlyReportScreen";
import RewardsScreen from "./screens/RewardsScreen";
import CouponDetailScreen from "./screens/CouponDetailScreen";
import CouponRedeemedScreen from "./screens/CouponRedeemedScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import SavedRoutesScreen from "./screens/SavedRoutesScreen";
import MarketplaceScreen from "./screens/MarketplaceScreen";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import RedemptionConfirmationScreen from "./screens/RedemptionConfirmationScreen";
import ChatScreen from "./screens/ChatScreen";
import { MobileLayout } from "./components/MobileLayout";
import { AdminLayout } from "./components/AdminLayout";
import DashboardPage from "./admin/DashboardPage";
import UsersPage from "./admin/UsersPage";
import PartnersPage from "./admin/PartnersPage";
import AddPartnerPage from "./admin/AddPartnerPage";
import CouponsPage from "./admin/CouponsPage";
import MapViewPage from "./admin/MapViewPage";
import BadgesPage from "./admin/BadgesPage";
import AnalyticsPage from "./admin/AnalyticsPage";
import ReportsPage from "./admin/ReportsPage";
import SettingsPage from "./admin/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/admin/login"),
  },
  {
    path: "/welcome",
    element: <WelcomeScreen />,
  },
  {
    path: "/onboarding",
    element: <OnboardingScreen />,
  },
  {
    path: "/location-permission",
    element: <LocationPermissionScreen />,
  },
  {
    path: "/notification-permission",
    element: <NotificationPermissionScreen />,
  },
  {
    path: "/signup",
    element: <SignUpScreen />,
  },
  {
    path: "/login",
    element: <LogInScreen />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordScreen />,
  },
  {
    path: "/email-verification",
    element: <EmailVerificationScreen />,
  },
  {
    path: "/search-expanded",
    element: <SearchExpandedScreen />,
  },
  {
    path: "/route-detail",
    element: <RouteDetailScreen />,
  },
  {
    path: "/navigation",
    element: <NavigationScreen />,
  },
  {
    path: "/trip-completed",
    element: <TripCompletedScreen />,
  },
  {
    path: "/monthly-report",
    element: <MonthlyReportScreen />,
  },
  {
    path: "/coupon-detail",
    element: <CouponDetailScreen />,
  },
  {
    path: "/coupon-redeemed",
    element: <CouponRedeemedScreen />,
  },
  {
    path: "/edit-profile",
    element: <EditProfileScreen />,
  },
  {
    path: "/saved-routes",
    element: <SavedRoutesScreen />,
  },
  {
    path: "/marketplace/product/:productId",
    element: <ProductDetailScreen />,
  },
  {
    path: "/marketplace/checkout/:productId",
    element: <CheckoutScreen />,
  },
  {
    path: "/marketplace/confirmation",
    element: <RedemptionConfirmationScreen />,
  },
  {
    path: "/marketplace/chat/:sellerName",
    element: <ChatScreen />,
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
        path: "/marketplace",
        element: <MarketplaceScreen />,
      },
      {
        path: "/profile",
        element: <ProfileScreen />,
      },
    ],
  },
  {
    path: "/admin/login",
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
  {
    element: <AdminLayout />,
    children: [
      {
        path: "/admin",
        element: <DashboardPage />,
      },
      {
        path: "/admin/users",
        element: <UsersPage />,
      },
      {
        path: "/admin/partners",
        element: <PartnersPage />,
      },
      {
        path: "/admin/partners/add",
        element: <AddPartnerPage />,
      },
      {
        path: "/admin/coupons",
        element: <CouponsPage />,
      },
      {
        path: "/admin/map",
        element: <MapViewPage />,
      },
      {
        path: "/admin/badges",
        element: <BadgesPage />,
      },
      {
        path: "/admin/analytics",
        element: <AnalyticsPage />,
      },
      {
        path: "/admin/reports",
        element: <ReportsPage />,
      },
      {
        path: "/admin/settings",
        element: <SettingsPage />,
      },
    ],
  },
    ],
  },
]);