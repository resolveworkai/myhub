import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Users, Building2 } from "lucide-react";
import { NormalUserSignup } from "@/components/auth/signup/NormalUserSignup";
import { BusinessSignup } from "@/components/auth/signup/BusinessSignup";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

type UserType = "member" | "business";

export default function Signup() {
  const location = useLocation();
  const isBusinessPath = location.pathname.includes('/business');
  const [userType, setUserType] = useState<UserType>(isBusinessPath ? "business" : "member");

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-display font-bold text-xl">P</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">Portal</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground mb-8">
            Join thousands of users and businesses on Portal
          </p>

          {/* User Type Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setUserType("member")}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                userType === "member"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {userType === "member" && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold text-foreground">Member</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Book appointments & track progress
              </p>
            </button>
            <button
              onClick={() => setUserType("business")}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                userType === "business"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {userType === "business" && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <Building2 className="h-8 w-8 text-accent mb-2" />
              <h3 className="font-semibold text-foreground">Business</h3>
              <p className="text-xs text-muted-foreground mt-1">
                List & manage your business
              </p>
            </button>
          </div>

          {/* Social Auth (only for member signup) */}
          {userType === "member" && (
            <>
              <SocialAuthButtons mode="signup" />
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">
                    or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Multi-step Forms */}
          {userType === "member" ? (
            <NormalUserSignup />
          ) : (
            <BusinessSignup />
          )}

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative text-center max-w-lg">
          {userType === "member" ? (
            <>
              <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center">
                <span className="text-6xl">🎯</span>
              </div>
              <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
                Start Your Journey Today
              </h2>
              <p className="text-primary-foreground/80 text-lg">
                Join thousands of members achieving their fitness, learning, and wellness goals.
              </p>
            </>
          ) : (
            <>
              <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center">
                <span className="text-6xl">📈</span>
              </div>
              <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
                Grow Your Business
              </h2>
              <p className="text-primary-foreground/80 text-lg">
                Reach thousands of potential customers and streamline your operations.
              </p>
            </>
          )}

          {/* Features List */}
          <div className="mt-8 space-y-3 text-left">
            {(userType === "member"
              ? [
                  "Find & book nearby businesses",
                  "Track attendance & streaks",
                  "Earn achievements & rewards",
                  "Manage payments easily",
                ]
              : [
                  "List your business for free",
                  "Manage members & appointments",
                  "Track revenue & analytics",
                  "Send automated reminders",
                ]
            ).map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 text-primary-foreground/90"
              >
                <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
