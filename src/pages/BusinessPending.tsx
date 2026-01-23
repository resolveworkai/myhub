import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { Clock, CheckCircle2, Mail, Phone, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function BusinessPending() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Auto-check verification status every 2 seconds
    const checkVerification = setInterval(() => {
      if (user?.accountType === 'business' && (user as any).businessVerified) {
        setIsVerifying(false);
        clearInterval(checkVerification);
      }
    }, 2000);

    // Simulate auto-verification after 5 seconds for demo
    const autoVerify = setTimeout(() => {
      setIsVerifying(false);
    }, 5000);

    return () => {
      clearInterval(checkVerification);
      clearTimeout(autoVerify);
    };
  }, [user]);

  if (!isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Congratulations! 🎉
          </h1>
          <p className="text-muted-foreground mb-6">
            Your business account has been verified. You now have full access to your dashboard.
          </p>
          <Button
            variant="gradient"
            className="w-full"
            size="lg"
            onClick={() => navigate('/business-dashboard')}
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-display font-bold text-xl">P</span>
          </div>
          <span className="font-display font-bold text-xl text-foreground">Portal</span>
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6 relative">
            <Clock className="h-10 w-10 text-warning" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Verification in Progress
          </h1>
          <p className="text-muted-foreground">
            Your business account is under review. Our team will verify your details and approve your account within 24-48 hours.
          </p>
        </div>

        {/* Status Card */}
        <div className="p-6 rounded-xl border border-border bg-card mb-6">
          <h3 className="font-semibold text-foreground mb-4">Verification Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-success-foreground" />
              </div>
              <span className="text-foreground">Account Created</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-success-foreground" />
              </div>
              <span className="text-foreground">Email Verified</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-warning-foreground animate-spin" />
              </div>
              <span className="text-muted-foreground">Business Verification</span>
            </div>
          </div>
        </div>

        {/* Demo notice */}
        <div className="p-4 rounded-lg bg-info/10 border border-info/30 mb-6">
          <p className="text-sm text-info text-center">
            <strong>Demo:</strong> Auto-verification will complete in a few seconds...
          </p>
        </div>

        {/* Contact Support */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Have questions about the verification process?
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Call Us
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link to="/" className="text-primary font-semibold hover:underline">
            Return to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
