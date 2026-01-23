import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import BusinessPending from "./pages/BusinessPending";
import Explore from "./pages/Explore";
import BusinessDetail from "./pages/BusinessDetail";
import UserDashboard from "./pages/UserDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import HowItWorks from "./pages/HowItWorks";
import ForBusiness from "./pages/ForBusiness";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import NotFound from "./pages/NotFound";
import ProfileSettings from "./pages/ProfileSettings";

const queryClient = new QueryClient();

// Activity tracking wrapper
function ActivityTracker({ children }: { children: React.ReactNode }) {
  const updateLastActivity = useAuthStore((s) => s.updateLastActivity);
  const checkAndRestoreSession = useAuthStore((s) => s.checkAndRestoreSession);

  useEffect(() => {
    // Restore session on mount
    checkAndRestoreSession();
    
    // Track activity
    const handleActivity = () => updateLastActivity();
    
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [updateLastActivity, checkAndRestoreSession]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ActivityTracker>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup/business" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ForgotPassword />} />
            
            {/* Info Pages */}
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/for-business" element={<ForBusiness />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            
            {/* Discovery Pages */}
            <Route path="/explore" element={<Explore />} />
            <Route path="/gyms" element={<Explore />} />
            <Route path="/coaching" element={<Explore />} />
            <Route path="/libraries" element={<Explore />} />
            
            {/* Venue Detail */}
            <Route path="/venue/:id" element={<BusinessDetail />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
            
            {/* Protected: User Dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredAccountType="normal">
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/*" element={
              <ProtectedRoute requiredAccountType="normal">
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute requiredAccountType="normal">
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute requiredAccountType="normal">
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute requiredAccountType="normal">
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } />
            
            {/* Protected: Business Dashboard */}
            <Route path="/business-dashboard" element={
              <ProtectedRoute requiredAccountType="business">
                <BusinessDashboard />
              </ProtectedRoute>
            } />
            <Route path="/business-dashboard/pending" element={<BusinessPending />} />
            <Route path="/business-dashboard/*" element={
              <ProtectedRoute requiredAccountType="business">
                <BusinessDashboard />
              </ProtectedRoute>
            } />
            
            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ActivityTracker>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
