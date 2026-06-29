import { Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard, GuestGuard } from "@/components/auth/AuthGuard";

// Auth
import LoginPage          from "@/pages/LoginPage";
import RegisterPage       from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import VerifyOtpPage      from "@/pages/VerifyOtpPage";
import ResetPasswordPage  from "@/pages/ResetPasswordPage";
import AuthCallbackPage   from "@/pages/AuthCallbackPage";
import VerifyEmailPage    from "@/pages/VerifyEmailPage";
import MfaPage            from "@/pages/MfaPage";

// App
import HomePage             from "@/pages/HomePage";
import SearchPage           from "@/pages/SearchPage";
import ReservationFormPage  from "@/pages/ReservationFormPage";
import ReservationsPage     from "@/pages/ReservationsPage";
import WalletPage           from "@/pages/WalletPage";
import ProfilePage          from "@/pages/ProfilePage";
import CommanderPage        from "@/pages/CommanderPage";

// Restaurant
import RestaurantDashboardPage  from "@/pages/RestaurantDashboardPage";
import RestaurantProfilePage    from "@/pages/RestaurantProfilePage";
import OrdersConsolePage        from "@/pages/OrdersConsolePage";

// Public
import PublicMenuPage       from "@/pages/PublicMenuPage";
import TableOrderPage       from "@/pages/TableOrderPage";
import RestaurantPublicPage from "@/pages/RestaurantPublicPage";

// Admin
import AdminDashboardPage from "@/pages/AdminDashboardPage";

// Staff
import { StaffDashboardPage } from "@/pages/StaffDashboardPage";

// Livraison
import DriverDashboardPage  from "@/pages/DriverDashboardPage";
import OrderTrackingPage    from "@/pages/OrderTrackingPage";
import RegisterDriverPage   from "@/pages/RegisterDriverPage";

// Abonnement
import { SubscriptionPage } from "@/pages/SubscriptionPage";
import AbonnementPage       from "@/pages/AbonnementPage";
import PaymentPage          from "@/pages/PaymentPage";
import PaiementRetourPage   from "@/pages/PaiementRetourPage";

// Dev
import UIKitPage   from "@/pages/UIKitPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Pages publiques — redirige si déjà connecté */}
      <Route path="/login"           element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path="/register"         element={<GuestGuard><RegisterPage /></GuestGuard>} />
      <Route path="/register-driver"  element={<GuestGuard><RegisterDriverPage /></GuestGuard>} />
      <Route path="/forgot-password" element={<GuestGuard><ForgotPasswordPage /></GuestGuard>} />
      <Route path="/verify-otp"      element={<VerifyOtpPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/auth/callback"   element={<AuthCallbackPage />} />
      <Route path="/verify-email"    element={<VerifyEmailPage />} />
      <Route path="/auth/mfa"        element={<MfaPage />} />

      {/* Restaurants — publics */}
      <Route path="/restaurant/:id"  element={<RestaurantPublicPage />} />

      {/* Menu public QR — accessible sans connexion */}
      <Route path="/r/:restaurantId" element={<PublicMenuPage />} />
      <Route path="/table/:tableId"  element={<TableOrderPage />} />

      {/* Pages protégées */}
      <Route path="/home"            element={<AuthGuard><HomePage /></AuthGuard>} />
      <Route path="/search"          element={<AuthGuard><SearchPage /></AuthGuard>} />
      <Route path="/reservation/:id" element={<AuthGuard><ReservationFormPage /></AuthGuard>} />
      <Route path="/reservations"    element={<AuthGuard><ReservationsPage /></AuthGuard>} />
      <Route path="/commander"       element={<AuthGuard><CommanderPage /></AuthGuard>} />
      <Route path="/wallet"          element={<AuthGuard><WalletPage /></AuthGuard>} />
      <Route path="/profile"         element={<AuthGuard><ProfilePage /></AuthGuard>} />
      <Route path="/dashboard"       element={<AuthGuard><RestaurantDashboardPage /></AuthGuard>} />
      <Route path="/commandes"       element={<AuthGuard><OrdersConsolePage /></AuthGuard>} />
      <Route path="/mon-restaurant"  element={<AuthGuard><RestaurantProfilePage /></AuthGuard>} />
      <Route path="/admin"           element={<AuthGuard><AdminDashboardPage /></AuthGuard>} />
      <Route path="/staff"           element={<AuthGuard><StaffDashboardPage /></AuthGuard>} />
      <Route path="/driver"          element={<AuthGuard><DriverDashboardPage /></AuthGuard>} />
      <Route path="/track/:orderId"  element={<AuthGuard><OrderTrackingPage /></AuthGuard>} />
      <Route path="/abonnement"      element={<AuthGuard><SubscriptionPage /></AuthGuard>} />
      <Route path="/abonnement/cinetpay" element={<AuthGuard><AbonnementPage /></AuthGuard>} />
      <Route path="/payment"             element={<AuthGuard><PaymentPage /></AuthGuard>} />
      <Route path="/paiement/retour"     element={<PaiementRetourPage />} />

      {/* Dev */}
      <Route path="/ui-kit" element={<UIKitPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
