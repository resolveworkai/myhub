import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { useAuthStore } from "@/store/authStore";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Critical pages - loaded immediately
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy loaded pages for better performance
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const BusinessPending = lazy(() => import("./pages/BusinessPending"));
const Explore = lazy(() => import("./pages/Explore"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const ForBusiness = lazy(() => import("./pages/ForBusiness"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));

// Business Dashboard Pages
const BusinessMembers = lazy(() => import("./pages/business/BusinessMembers"));
const BusinessAppointments = lazy(() => import("./pages/business/BusinessAppointments"));
const BusinessPayments = lazy(() => import("./pages/business/BusinessPayments"));
const BusinessAnalytics = lazy(() => import("./pages/business/BusinessAnalytics"));
const BusinessMessages = lazy(() => import("./pages/business/BusinessMessages"));
const BusinessSettings = lazy(() => import("./pages/business/BusinessSettings"));

// Optimized QueryClient with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-display font-bold text-xl">P</span>
        </div>
        <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-primary rounded-full animate-[loading_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

// Activity tracking wrapper - optimized with throttling
function ActivityTracker({ children }: { children: React.ReactNode }) {
  const updateLastActivity = useAuthStore((s) => s.updateLastActivity);
  const checkAndRestoreSession = useAuthStore((s) => s.checkAndRestoreSession);

  useEffect(() => {
    checkAndRestoreSession();
    
    // Throttled activity handler
    let lastUpdate = 0;
    const throttleMs = 30000; // Only update every 30 seconds
    
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > throttleMs) {
        lastUpdate = now;
        updateLastActivity();
      }
    };
    
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [updateLastActivity, checkAndRestoreSession]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter 
        basename={import.meta.env.BASE_URL}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ActivityTracker>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Pages - Critical */}
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/business" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ForgotPassword />} />
              
              {/* Info Pages - Lazy */}
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
              <Route path="/dashboard/*" element={
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
              }>
                <Route index element={null} />
                <Route path="members" element={<BusinessMembers />} />
                <Route path="appointments" element={<BusinessAppointments />} />
                <Route path="fees" element={<BusinessPayments />} />
                <Route path="analytics" element={<BusinessAnalytics />} />
                <Route path="messages" element={<BusinessMessages />} />
                <Route path="settings" element={<BusinessSettings />} />
              </Route>
              
              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ActivityTracker>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
