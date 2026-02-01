import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Users, Building2 } from "lucide-react";
import { NormalUserSignup } from "@/components/auth/signup/NormalUserSignup";
import { BusinessSignup } from "@/components/auth/signup/BusinessSignup";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

type UserType = "member" | "business";

export default function Signup() {
  const { t } = useTranslation();
  const location = useLocation();
  const isBusinessPath = location.pathname.includes('/business');
  const [userType, setUserType] = useState<UserType>(isBusinessPath ? "business" : "member");

  const memberFeatures = t("auth.memberFeatures", { returnObjects: true }) as string[];
  const businessFeatures = t("auth.businessFeatures", { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-md py-6 sm:py-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-6 sm:mb-8">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-display font-bold text-lg sm:text-xl">P</span>
            </div>
            <span className="font-display font-bold text-lg sm:text-xl text-foreground">Portal</span>
          </Link>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {t("auth.signUpTitle")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
            {t("auth.signUpSubtitle")}
          </p>

          {/* User Type Selection */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => setUserType("member")}
              className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all touch-target ${
                userType === "member"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {userType === "member" && (
                <div className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                </div>
              )}
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-1.5 sm:mb-2" />
              <h3 className="font-semibold text-sm sm:text-base text-foreground">{t("auth.member")}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                {t("auth.memberDesc")}
              </p>
            </button>
            <button
              onClick={() => setUserType("business")}
              className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all touch-target ${
                userType === "business"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {userType === "business" && (
                <div className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                </div>
              )}
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-accent mb-1.5 sm:mb-2" />
              <h3 className="font-semibold text-sm sm:text-base text-foreground">{t("auth.businessAccount")}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                {t("auth.businessDesc")}
              </p>
            </button>
          </div>

          {/* Social Auth (only for member signup) */}
          {userType === "member" && (
            <>
              <SocialAuthButtons mode="signup" />
              <div className="relative my-4 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground text-xs sm:text-sm">
                    {t("auth.orContinueWith")} {t("auth.email").toLowerCase()}
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

          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8">
            {t("auth.hasAccount")}{" "}
            <Link to="/signin" className="text-primary font-semibold hover:underline">
              {t("common.signIn")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative text-center max-w-lg">
          {userType === "member" ? (
            <>
              <div className="w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-6 lg:mb-8 rounded-2xl lg:rounded-3xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center">
                <span className="text-4xl lg:text-6xl">🎯</span>
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-primary-foreground mb-3 lg:mb-4">
                {t("auth.startJourney")}
              </h2>
              <p className="text-primary-foreground/80 text-base lg:text-lg">
                {t("auth.startJourneySubtitle")}
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-6 lg:mb-8 rounded-2xl lg:rounded-3xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center">
                <span className="text-4xl lg:text-6xl">📈</span>
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-primary-foreground mb-3 lg:mb-4">
                {t("auth.growBusiness")}
              </h2>
              <p className="text-primary-foreground/80 text-base lg:text-lg">
                {t("auth.growBusinessSubtitle")}
              </p>
            </>
          )}

          {/* Features List */}
          <div className="mt-6 lg:mt-8 space-y-2 lg:space-y-3 text-left">
            {(userType === "member" ? memberFeatures : businessFeatures).map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 text-primary-foreground/90 text-sm lg:text-base"
              >
                <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
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