import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OTPInput } from "@/components/auth/OTPInput";
import { verifyOTP, resendOTP } from "@/lib/apiService";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/use-toast";
import { Mail, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const isBusiness = searchParams.get('type') === 'business';
  
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  const clearPendingVerification = useAuthStore((s) => s.clearPendingVerification);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await verifyOTP(email, otp);
      
      if (!result.success) {
        setError(result.error || 'Verification failed');
        return;
      }
      
      setIsVerified(true);
      clearPendingVerification();
      
      toast({
        title: "Email Verified! 🎉",
        description: "Your email has been verified successfully.",
      });
      
      // Redirect after showing success
      setTimeout(() => {
        if (isBusiness) {
          navigate('/business-dashboard/pending');
        } else {
          navigate('/signin');
        }
      }, 2000);
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    
    try {
      await resendOTP(email);
      setResendCooldown(60);
      toast({
        title: "Code Sent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : 'your email';

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Email Verified!
          </h1>
          <p className="text-muted-foreground mb-6">
            {isBusiness 
              ? "Your email is verified. Your business account is pending admin approval."
              : "Your email is verified. You can now sign in to your account."}
          </p>
          <Button variant="gradient" className="w-full" onClick={() => navigate(isBusiness ? '/business-dashboard/pending' : '/signin')}>
            {isBusiness ? "View Status" : "Sign In"}
            <ArrowRight className="h-4 w-4 ml-2" />
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
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Verify Your Email
          </h1>
          <p className="text-muted-foreground">
            We've sent a 6-digit verification code to{" "}
            <span className="font-medium text-foreground">{maskedEmail}</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* OTP Input */}
          <div className="space-y-2">
            <OTPInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setError(null);
              }}
              error={!!error}
            />
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          {/* Demo hint */}
          <div className="p-3 rounded-lg bg-info/10 border border-info/30 text-center">
            <p className="text-xs text-info">
              <strong>Demo:</strong> Use OTP <span className="font-mono font-bold">000000</span>
            </p>
          </div>

          {/* Verify Button */}
          <Button
            variant="gradient"
            className="w-full"
            size="lg"
            onClick={handleVerify}
            disabled={isSubmitting || otp.length !== 6}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>

          {/* Resend */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                "Resend Code"
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Wrong email?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
