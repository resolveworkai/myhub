import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/business" element={<Signup />} />
          <Route path="/forgot-password" element={<Login />} />
          
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
          
          {/* User Dashboard */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/dashboard/*" element={<UserDashboard />} />
          <Route path="/profile" element={<UserDashboard />} />
          <Route path="/bookings" element={<UserDashboard />} />
          <Route path="/favorites" element={<UserDashboard />} />
          <Route path="/settings" element={<UserDashboard />} />
          
          {/* Business Dashboard */}
          <Route path="/business-dashboard" element={<BusinessDashboard />} />
          <Route path="/business-dashboard/*" element={<BusinessDashboard />} />
          
          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
