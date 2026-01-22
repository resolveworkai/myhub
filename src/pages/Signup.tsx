import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Building2,
  Users,
  Check,
} from "lucide-react";

type UserType = "member" | "business";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>("member");
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-display font-bold text-xl">M</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">MyHub</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground mb-8">
            Join thousands of members and businesses on MyHub
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

          <form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i <= 2 ? "bg-warning" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Use 8+ characters with a mix of letters, numbers & symbols
              </p>
            </div>

            {userType === "business" && (
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="businessName"
                    placeholder="Your Business Name"
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Checkbox id="terms" className="mt-1" />
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button variant="gradient" className="w-full" size="lg">
              Create Account
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">
                or sign up with
              </span>
            </div>
          </div>

          {/* Social Signup */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Google", icon: "G" },
              { name: "Apple", icon: "" },
              { name: "Facebook", icon: "f" },
            ].map((provider) => (
              <Button key={provider.name} variant="outline" className="h-12">
                <span className="font-bold">{provider.icon || provider.name[0]}</span>
              </Button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
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
