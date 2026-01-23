import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPInput } from "@/components/auth/OTPInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/authValidation";
import { requestPasswordReset, verifyResetOTP, resetPassword } from "@/lib/mockAuthService";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { z } from "zod";

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Request reset
  const handleRequestReset = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await requestPasswordReset(data.email);
      
      if (!result.success) {
        setError(result.error || 'Failed to send reset code');
        return;
      }
      
      setEmail(data.email);
      setStep('otp');
      setResendCooldown(60);
      toast({
        title: "Reset Code Sent",
        description: "Check your email for the verification code.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await verifyResetOTP(email, otp);
      
      if (!result.success) {
        setError(result.error || 'Invalid code');
        return;
      }
      
      setStep('reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset password
  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await resetPassword(email, data.password);
      
      if (!result.success) {
        setError(result.error || 'Failed to reset password');
        return;
      }
      
      setStep('success');
      toast({
        title: "Password Reset Successful! 🎉",
        description: "You can now sign in with your new password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    const result = await requestPasswordReset(email);
    if (result.success) {
      setResendCooldown(60);
      toast({
        title: "Code Sent",
        description: "A new reset code has been sent to your email.",
      });
    }
  };

  // Cooldown timer
  if (resendCooldown > 0) {
    setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
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

        {/* Email Step */}
        {step === 'email' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Forgot Password?
              </h1>
              <p className="text-muted-foreground">
                Enter your email and we'll send you a reset code
              </p>
            </div>

            <form onSubmit={emailForm.handleSubmit(handleRequestReset)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...emailForm.register("email")}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <Button
                variant="gradient"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Code
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Enter Verification Code
              </h1>
              <p className="text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">
                  {email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                </span>
              </p>
            </div>

            <div className="space-y-6">
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

              {/* Demo hint */}
              <div className="p-3 rounded-lg bg-info/10 border border-info/30 text-center">
                <p className="text-xs text-info">
                  <strong>Demo:</strong> Use OTP <span className="font-mono font-bold">000000</span>
                </p>
              </div>

              <Button
                variant="gradient"
                className="w-full"
                size="lg"
                onClick={handleVerifyOTP}
                disabled={isSubmitting || otp.length !== 6}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep('email')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </>
        )}

        {/* Reset Step */}
        {step === 'reset' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Create New Password
              </h1>
              <p className="text-muted-foreground">
                Choose a strong password for your account
              </p>
            </div>

            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="pl-10 pr-10"
                    {...resetForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={resetForm.watch("password") || ''} />
                {resetForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                    {...resetForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                variant="gradient"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Password Reset Complete!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
            <Button
              variant="gradient"
              className="w-full"
              size="lg"
              onClick={() => navigate('/signin')}
            >
              Sign In
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {step !== 'success' && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Remember your password?{" "}
            <Link to="/signin" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
