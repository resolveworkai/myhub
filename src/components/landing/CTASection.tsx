import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Building2, Users } from "lucide-react";

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* For Users */}
          <div className="relative group">
            <div className="absolute inset-0 gradient-primary rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative rounded-3xl border border-primary/20 p-8 lg:p-12 bg-card">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                {t("cta.forUsers.title")}
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                {t("cta.forUsers.subtitle")}
              </p>
              <Link to="/signup">
                <Button variant="gradient" size="lg">
                  {t("cta.forUsers.button")}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-card"
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">50,000+</span> {t("cta.forUsers.happyUsers")}
                </span>
              </div>
            </div>
          </div>

          {/* For Businesses */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent to-warning rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative rounded-3xl border border-accent/20 p-8 lg:p-12 bg-card">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Building2 className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                {t("cta.forBusiness.title")}
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                {t("cta.forBusiness.subtitle")}
              </p>
              <Link to="/for-business">
                <Button variant="accent" size="lg">
                  {t("cta.forBusiness.button")}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{t("cta.forBusiness.freeToStart")}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}