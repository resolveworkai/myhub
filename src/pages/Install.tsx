import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Download,
  Smartphone,
  Wifi,
  Zap,
  Bell,
  Shield,
  Check,
  Share,
  PlusSquare,
  ArrowRight,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Load instantly, even on slow networks",
    },
    {
      icon: Wifi,
      title: "Works Offline",
      description: "Access your bookings without internet",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Get reminders for your appointments",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data stays safe on your device",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 sm:pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* App Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl gradient-primary flex items-center justify-center shadow-xl">
              <span className="text-primary-foreground font-display font-bold text-3xl sm:text-4xl">
                P
              </span>
            </div>

            {isInstalled ? (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success mb-6">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">App Installed!</span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  You're All Set!
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Portal is now installed on your device. Open it from your home screen for the best experience.
                </p>
                <Link to="/explore">
                  <Button variant="gradient" size="lg" className="h-12 sm:h-14 px-6 sm:px-8">
                    Start Exploring
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  Install Portal App
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto px-4">
                  Get the full app experience with faster loading, offline access, and push notifications.
                </p>

                {/* Install Button or iOS Instructions */}
                {deferredPrompt ? (
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={handleInstallClick}
                    className="h-12 sm:h-14 px-6 sm:px-8 touch-target"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Install Now
                  </Button>
                ) : isIOS ? (
                  <div className="bg-card rounded-2xl border border-border p-6 max-w-md mx-auto">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Install on iPhone/iPad
                    </h3>
                    <ol className="space-y-4 text-left">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Tap the Share button</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Share className="h-4 w-4" /> at the bottom of Safari
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Select "Add to Home Screen"</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <PlusSquare className="h-4 w-4" /> from the menu
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Tap "Add" to confirm</p>
                          <p className="text-sm text-muted-foreground">
                            Portal will appear on your home screen
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>
                ) : isAndroid ? (
                  <div className="bg-card rounded-2xl border border-border p-6 max-w-md mx-auto">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Install on Android
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Look for the install prompt in your browser's address bar, or tap the menu (⋮) and select "Install app" or "Add to Home Screen".
                    </p>
                    <p className="text-sm text-muted-foreground">
                      If you don't see the option, try using Chrome browser.
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Open this page on your mobile device to install the app.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* Benefits Section */}
        {!isInstalled && (
          <section className="container mx-auto px-4 py-12 sm:py-16">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
              Why Install Portal?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-card rounded-2xl border border-border p-6 text-center hover-lift"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground mb-4">
              Prefer to use the website? No problem!
            </p>
            <Link to="/explore">
              <Button variant="outline" size="lg">
                Continue in Browser
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
